// Package config loads runtime configuration from the environment.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Development reports whether the server is running outside production.
func (c *Config) Development() bool { return c.Env != "production" }

// JWKSURL is where Supabase publishes the public keys for access tokens.
func (c *Config) JWKSURL() string {
	return c.SupabaseURL + "/auth/v1/.well-known/jwks.json"
}

// Issuer is the iss claim Supabase puts in access tokens.
func (c *Config) Issuer() string { return c.SupabaseURL + "/auth/v1" }

// Load reads configuration and reports every missing requirement at once, rather
// than failing on the first one and hiding the rest.
func Load(version string) (*Config, error) {
	if err := loadEnvFiles(); err != nil {
		return nil, err
	}

	c := &Config{
		Port:            withColon(env("PORT", "8000")),
		Env:             env("APP_ENV", "development"),
		ReadTimeout:     duration("READ_TIMEOUT", 10*time.Second),
		WriteTimeout:    duration("WRITE_TIMEOUT", 30*time.Second),
		IdleTimeout:     duration("IDLE_TIMEOUT", 120*time.Second),
		ShutdownTimeout: duration("SHUTDOWN_TIMEOUT", 20*time.Second),

		DatabaseURL:   os.Getenv("DATABASE_URL"),
		MaxConns:      int32(integer("DB_MAX_CONNS", 10)),
		SupabaseURL:   strings.TrimSuffix(os.Getenv("SUPABASE_URL"), "/"),
		ServiceKey:    os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		StorageBucket: env("SUPABASE_STORAGE_BUCKET", "gist-files"),

		AllowedOrigins: list("CORS_ALLOWED_ORIGINS", "http://localhost:5173"),

		RateLimitRPS:     integer("RATE_LIMIT_RPS", 10),
		RateLimitBurst:   integer("RATE_LIMIT_BURST", 20),
		RateLimitEnabled: env("RATE_LIMIT_ENABLED", "true") == "true",
		TrustedProxies:   integer("TRUSTED_PROXIES", 0),

		SentryDSN:      os.Getenv("SENTRY_DSN"),
		OTLPEndpoint:   os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT"),
		ServiceName:    env("OTEL_SERVICE_NAME", "quickgist-api"),
		ServiceVersion: version,
	}

	c.PublicBaseURL = strings.TrimSuffix(env("PUBLIC_BASE_URL", firstOrigin(c.AllowedOrigins)), "/")
	c.APIBaseURL = strings.TrimSuffix(os.Getenv("API_BASE_URL"), "/")

	if err := c.validate(); err != nil {
		return nil, err
	}
	return c, nil
}

// validate reports the required values that are absent.
func (c *Config) validate() error {
	required := map[string]string{
		"DATABASE_URL":              c.DatabaseURL,
		"SUPABASE_URL":              c.SupabaseURL,
		"SUPABASE_SERVICE_ROLE_KEY": c.ServiceKey,
	}

	var missing []string
	for name, value := range required {
		if value == "" {
			missing = append(missing, name)
		}
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing required configuration: %s", strings.Join(missing, ", "))
	}
	return nil
}

// loadEnvFiles reads the dotenv files, tolerating their absence.
func loadEnvFiles() error {
	for _, f := range envFiles {
		if err := godotenv.Load(f); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("load %s: %w", f, err)
		}
	}
	return nil
}

// firstOrigin is the fallback for PUBLIC_BASE_URL.
//
// The first allowed origin is the frontend in every deployment this service has,
// so requiring the same value twice would be a second thing to get wrong.
func firstOrigin(origins []string) string {
	if len(origins) == 0 {
		return ""
	}
	return origins[0]
}

// withColon normalises a port into the form http.Server expects.
func withColon(port string) string {
	if strings.HasPrefix(port, ":") {
		return port
	}
	return ":" + port
}

// env returns an environment variable, or fallback when it is unset or empty.
func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// integer reads an integer variable, falling back on anything unparseable.
func integer(key string, fallback int) int {
	if v, err := strconv.Atoi(os.Getenv(key)); err == nil {
		return v
	}
	return fallback
}

// duration reads a Go duration string, falling back on anything unparseable.
func duration(key string, fallback time.Duration) time.Duration {
	if d, err := time.ParseDuration(os.Getenv(key)); err == nil {
		return d
	}
	return fallback
}

// list reads a comma-separated variable into trimmed, non-empty entries.
func list(key, fallback string) []string {
	parts := strings.Split(env(key, fallback), ",")
	out := make([]string, 0, len(parts))

	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
