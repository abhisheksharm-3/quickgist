// Package obs wires tracing and error reporting. Both are optional, because an
// observability outage must not become an application outage.
package obs

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/getsentry/sentry-go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.opentelemetry.io/otel/trace"
)

const flushTimeout = 5 * time.Second

// Options configures observability. An empty SentryDSN or OTLPEndpoint disables
// that exporter.
type Options struct {
	ServiceName    string
	ServiceVersion string
	Environment    string
	SentryDSN      string
	OTLPEndpoint   string
}

// Shutdown flushes the exporters. It is always non-nil, so a caller can defer it
// unconditionally even when setup failed.
type Shutdown func(context.Context) error

// Setup initialises tracing and error reporting and returns a flush function.
func Setup(ctx context.Context, opts Options, log *slog.Logger) (Shutdown, error) {
	var shutdowns []Shutdown

	if opts.SentryDSN != "" {
		flush, err := setupSentry(opts)
		if err != nil {
			return noop, err
		}
		shutdowns = append(shutdowns, flush)
		log.Info("sentry enabled", "environment", opts.Environment)
	}

	if opts.OTLPEndpoint != "" {
		flush, err := setupTracing(ctx, opts)
		if err != nil {
			return flushAll(shutdowns), err
		}
		shutdowns = append(shutdowns, flush)
		log.Info("otel tracing enabled", "endpoint", opts.OTLPEndpoint)
	}

	if len(shutdowns) == 0 {
		log.Info("observability disabled",
			"reason", "no SENTRY_DSN or OTEL_EXPORTER_OTLP_ENDPOINT")
	}

	return flushAll(shutdowns), nil
}

// setupSentry initialises error reporting.
//
// Tracing is left off because traces go to OTLP; sampling both would pay twice for
// one picture.
//
// A non-nil empty HTTPBodies collects no request bodies, which matters because a
// body here can be an entire private gist. Leaving it nil would collect all body
// types instead. Scope.SetUser is unaffected by UserInfo, so a report still carries
// the user id the authentication middleware attaches.
func setupSentry(opts Options) (Shutdown, error) {
	err := sentry.Init(sentry.ClientOptions{
		Dsn:              opts.SentryDSN,
		Environment:      opts.Environment,
		Release:          opts.ServiceName + "@" + opts.ServiceVersion,
		EnableTracing:    false,
		AttachStacktrace: true,
		DataCollection: &sentry.DataCollection{
			UserInfo:   sentry.Set(false),
			HTTPBodies: []sentry.BodyType{},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("initialise sentry: %w", err)
	}

	return func(context.Context) error {
		sentry.Flush(flushTimeout)
		return nil
	}, nil
}

// setupTracing initialises the OTLP trace exporter and propagators.
func setupTracing(ctx context.Context, opts Options) (Shutdown, error) {
	exporter, err := otlptracehttp.New(ctx)
	if err != nil {
		return nil, fmt.Errorf("create otlp exporter: %w", err)
	}

	res, err := resource.Merge(resource.Default(), resource.NewWithAttributes(
		semconv.SchemaURL,
		semconv.ServiceName(opts.ServiceName),
		semconv.ServiceVersion(opts.ServiceVersion),
		attribute.String("deployment.environment", opts.Environment),
	))
	if err != nil {
		return nil, fmt.Errorf("build otel resource: %w", err)
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)

	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return tp.Shutdown, nil
}

// CaptureError reports an error to Sentry, tagged with the trace it came from so a
// Sentry issue and an OTLP trace can be lined up. A nil error or an unconfigured
// Sentry is a no-op.
func CaptureError(ctx context.Context, err error) {
	if err == nil || sentry.CurrentHub().Client() == nil {
		return
	}

	hub := sentry.GetHubFromContext(ctx)
	if hub == nil {
		hub = sentry.CurrentHub().Clone()
	}

	hub.WithScope(func(scope *sentry.Scope) {
		if span := trace.SpanContextFromContext(ctx); span.IsValid() {
			scope.SetTag("trace_id", span.TraceID().String())
			scope.SetTag("span_id", span.SpanID().String())
		}
		hub.CaptureException(err)
	})
}

// flushAll combines shutdown functions, returning the first error but always
// running every one.
func flushAll(shutdowns []Shutdown) Shutdown {
	return func(ctx context.Context) error {
		var firstErr error
		for _, s := range shutdowns {
			if err := s(ctx); err != nil && firstErr == nil {
				firstErr = err
			}
		}
		return firstErr
	}
}

// noop is the Shutdown returned when nothing was initialised.
func noop(context.Context) error { return nil }
