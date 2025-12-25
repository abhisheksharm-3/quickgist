package config

import "time"

// ServerConfig holds HTTP server configuration.
type ServerConfig struct {
	Port            string
	Env             string
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration
	MaxHeaderBytes  int
}

// FirebaseConfig holds Firebase service configuration.
type FirebaseConfig struct {
	CredentialsPath string
	ProjectID       string
	StorageBucket   string
	MaxRetries      int
}

// CORSConfig holds CORS middleware configuration.
type CORSConfig struct {
	AllowedOrigins   []string
	AllowedMethods   []string
	AllowedHeaders   []string
	AllowCredentials bool
}

// RateLimitConfig holds rate limiting configuration.
type RateLimitConfig struct {
	RequestsPerSecond int
	BurstSize         int
	Enabled           bool
}

// IsDevelopment returns true if running in development mode.
func (c *ServerConfig) IsDevelopment() bool {
	return c.Env == "development"
}

// IsProduction returns true if running in production mode.
func (c *ServerConfig) IsProduction() bool {
	return c.Env == "production"
}
