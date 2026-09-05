// What starting telemetry takes, and what it gives back.
package obs

import (
	"context"
)

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
