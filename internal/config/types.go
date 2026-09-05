// The configuration this service runs on.
//
// One struct, built once at startup and read-only afterwards, so nothing downstream
// has to know whether a value came from the environment or from a default.
package config

import (
	"time"
)

// Config is the whole of the application's configuration.
//
// TrustedProxies is the number of proxy hops in front of this server, used to read
// a client address out of X-Forwarded-For. It defaults to zero, meaning trust no
// forwarding header, because trusting one nobody strips lets any caller forge its
// own rate-limit bucket.
type Config struct {
	Port            string
	Env             string
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration

	DatabaseURL   string
	MaxConns      int32
	SupabaseURL   string
	ServiceKey    string
	StorageBucket string

	AllowedOrigins []string

	// PublicBaseURL is where the frontend is served, which is the only thing that
	// can turn a slug into a link somebody can open. It is needed wherever this
	// service has to name a page rather than answer a request for one: the paste
	// endpoint's response, and the canonical URL on a link preview.
	PublicBaseURL string

	// APIBaseURL is where this service itself is reachable, used to name the
	// preview card in a cacheable document. Empty means fall back to the request's
	// own Host, which is the client's to choose.
	APIBaseURL string

	RateLimitRPS     int
	RateLimitBurst   int
	RateLimitEnabled bool
	TrustedProxies   int

	SentryDSN      string
	OTLPEndpoint   string
	ServiceName    string
	ServiceVersion string
}
