package server

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/abhisheksharm-3/quickgist/internal/config"
	"github.com/abhisheksharm-3/quickgist/internal/handler"
	"github.com/abhisheksharm-3/quickgist/internal/middleware"
)

// Server represents the HTTP server.
type Server struct {
	httpServer *http.Server
	handler    *handler.Handler
	config     *config.Config
	infoLog    *log.Logger
	errorLog   *log.Logger
}

// New creates a new server instance.
func New(
	cfg *config.Config,
	h *handler.Handler,
	infoLog *log.Logger,
	errorLog *log.Logger,
) *Server {
	return &Server{
		config:   cfg,
		handler:  h,
		infoLog:  infoLog,
		errorLog: errorLog,
	}
}

// Start initializes and starts the HTTP server.
func (s *Server) Start() error {
	router := s.routes()

	chain := middleware.Chain(
		middleware.Recovery(s.errorLog),
		middleware.Logging(s.infoLog),
		middleware.Security(),
		middleware.CORS(s.config.CORS.AllowedOrigins, s.config.CORS.AllowCredentials),
	)

	if s.config.RateLimit.Enabled {
		chain = middleware.Chain(
			middleware.RateLimit(s.config.RateLimit.RequestsPerSecond, s.config.RateLimit.BurstSize),
			chain,
		)
	}

	s.httpServer = &http.Server{
		Addr:           s.config.Server.Port,
		Handler:        chain(router),
		ErrorLog:       s.errorLog,
		ReadTimeout:    s.config.Server.ReadTimeout,
		WriteTimeout:   s.config.Server.WriteTimeout,
		IdleTimeout:    s.config.Server.IdleTimeout,
		MaxHeaderBytes: s.config.Server.MaxHeaderBytes,
	}

	serverErrors := make(chan error, 1)

	go func() {
		s.infoLog.Printf("starting server on %s in %s mode", s.config.Server.Port, s.config.Server.Env)
		serverErrors <- s.httpServer.ListenAndServe()
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		return err
	case sig := <-shutdown:
		s.infoLog.Printf("received signal %v, initiating shutdown", sig)
		return s.Shutdown()
	}
}

// Shutdown gracefully shuts down the server.
func (s *Server) Shutdown() error {
	ctx, cancel := context.WithTimeout(context.Background(), s.config.Server.ShutdownTimeout)
	defer cancel()

	if err := s.httpServer.Shutdown(ctx); err != nil {
		s.errorLog.Printf("error during shutdown: %v", err)
		return s.httpServer.Close()
	}

	return nil
}
