// Command server runs the quickgist API.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/abhisheksharm-3/quickgist/internal/api"
	"github.com/abhisheksharm-3/quickgist/internal/auth"
	"github.com/abhisheksharm-3/quickgist/internal/blob"
	"github.com/abhisheksharm-3/quickgist/internal/config"
	"github.com/abhisheksharm-3/quickgist/internal/obs"
	"github.com/abhisheksharm-3/quickgist/internal/render"
	"github.com/abhisheksharm-3/quickgist/internal/store"
)

// version is overridden at build time with -ldflags "-X main.version=...".
var version = "dev"

const (
	databaseConnectTimeout = 15 * time.Second
	readHeaderTimeout      = 5 * time.Second
	telemetryFlushTimeout  = 5 * time.Second
	maxHeaderBytes         = 1 << 20
)

func main() {
	if err := run(); err != nil {
		slog.Error("fatal", "error", err)
		os.Exit(1)
	}
}

// run wires the dependencies, serves until interrupted, then shuts down in order.
func run() error {
	cfg, err := config.Load(version)
	if err != nil {
		return err
	}

	log := newLogger(cfg)
	slog.SetDefault(log)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	flush := startObservability(ctx, cfg, log)
	defer flushTelemetry(flush, log)

	db, err := openDatabase(ctx, cfg)
	if err != nil {
		return err
	}
	defer db.Close()
	log.Info("database connected", "max_conns", cfg.MaxConns)

	blobs := blob.New(cfg.SupabaseURL, cfg.StorageBucket, cfg.ServiceKey)

	a, err := api.New(cfg, db, blobs, render.New(),
		auth.NewVerifier(cfg.JWKSURL(), cfg.Issuer()), log, version)
	if err != nil {
		return err
	}

	handler, stopAPI := a.Handler()
	defer stopAPI()

	go blob.NewJanitor(blobs, db, log).Run(ctx)

	return serve(ctx, cfg, handler, log)
}

// startObservability initialises telemetry, treating failure as a warning because
// traffic is worth serving without it.
func startObservability(ctx context.Context, cfg *config.Config, log *slog.Logger) obs.Shutdown {
	flush, err := obs.Setup(ctx, obs.Options{
		ServiceName:    cfg.ServiceName,
		ServiceVersion: version,
		Environment:    cfg.Env,
		SentryDSN:      cfg.SentryDSN,
		OTLPEndpoint:   cfg.OTLPEndpoint,
	}, log)
	if err != nil {
		log.Error("observability setup failed, continuing without it", "error", err)
	}
	return flush
}

// flushTelemetry drains the exporters on a context of its own, since the request
// context is already cancelled by the time this runs.
func flushTelemetry(flush obs.Shutdown, log *slog.Logger) {
	ctx, cancel := context.WithTimeout(context.Background(), telemetryFlushTimeout)
	defer cancel()

	if err := flush(ctx); err != nil {
		log.Error("flush telemetry", "error", err)
	}
}

// openDatabase connects with a bounded timeout, so a bad DATABASE_URL fails at
// startup rather than hanging.
func openDatabase(ctx context.Context, cfg *config.Config) (*store.Store, error) {
	dbCtx, cancel := context.WithTimeout(ctx, databaseConnectTimeout)
	defer cancel()

	return store.Open(dbCtx, cfg.DatabaseURL, cfg.MaxConns)
}

// serve listens until the context is cancelled, then drains in-flight requests.
func serve(ctx context.Context, cfg *config.Config, handler http.Handler, log *slog.Logger) error {
	srv := &http.Server{
		Addr:              cfg.Port,
		Handler:           handler,
		ReadHeaderTimeout: readHeaderTimeout,
		ReadTimeout:       cfg.ReadTimeout,
		WriteTimeout:      cfg.WriteTimeout,
		IdleTimeout:       cfg.IdleTimeout,
		MaxHeaderBytes:    maxHeaderBytes,
		ErrorLog:          slog.NewLogLogger(log.Handler(), slog.LevelError),
		BaseContext:       func(net.Listener) context.Context { return ctx },
	}

	serverErr := make(chan error, 1)
	go func() {
		log.Info("listening", "addr", cfg.Port, "env", cfg.Env, "version", version)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}
	}()

	select {
	case err := <-serverErr:
		return err
	case <-ctx.Done():
		log.Info("shutting down")
	}

	return shutdown(srv, cfg.ShutdownTimeout, log)
}

// shutdown drains in-flight requests, forcing a close if they overrun the timeout.
func shutdown(srv *http.Server, timeout time.Duration, log *slog.Logger) error {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error("graceful shutdown failed, closing", "error", err)
		return srv.Close()
	}

	log.Info("stopped")
	return nil
}

// newLogger returns text logs in development and JSON in production, so a log
// aggregator gets structure and a terminal stays readable.
func newLogger(cfg *config.Config) *slog.Logger {
	opts := &slog.HandlerOptions{Level: slog.LevelInfo}

	if cfg.Development() {
		opts.Level = slog.LevelDebug
		return slog.New(slog.NewTextHandler(os.Stdout, opts))
	}
	return slog.New(slog.NewJSONHandler(os.Stdout, opts))
}
