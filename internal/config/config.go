package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all application configuration.
type Config struct {
	Server    ServerConfig
	Firebase  FirebaseConfig
	CORS      CORSConfig
	RateLimit RateLimitConfig
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		return nil, fmt.Errorf("loading .env file: %w", err)
	}

	serverCfg, err := loadServerConfig()
	if err != nil {
		return nil, err
	}

	firebaseCfg, err := loadFirebaseConfig()
	if err != nil {
		return nil, err
	}

	return &Config{
		Server:    serverCfg,
		Firebase:  firebaseCfg,
		CORS:      loadCORSConfig(),
		RateLimit: loadRateLimitConfig(),
	}, nil
}

func loadServerConfig() (ServerConfig, error) {
	port := getEnv("PORT", "8000")
	if !strings.HasPrefix(port, ":") {
		port = ":" + port
	}

	return ServerConfig{
		Port:            port,
		Env:             getEnv("APP_ENV", "development"),
		ReadTimeout:     getDuration("READ_TIMEOUT", 10*time.Second),
		WriteTimeout:    getDuration("WRITE_TIMEOUT", 30*time.Second),
		IdleTimeout:     getDuration("IDLE_TIMEOUT", 120*time.Second),
		ShutdownTimeout: getDuration("SHUTDOWN_TIMEOUT", 30*time.Second),
		MaxHeaderBytes:  getInt("MAX_HEADER_BYTES", 1<<20),
	}, nil
}

func loadFirebaseConfig() (FirebaseConfig, error) {
	credPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	if credPath == "" {
		return FirebaseConfig{}, fmt.Errorf("GOOGLE_APPLICATION_CREDENTIALS not set")
	}

	projectID := os.Getenv("FIREBASE_PROJECT_ID")
	if projectID == "" {
		return FirebaseConfig{}, fmt.Errorf("FIREBASE_PROJECT_ID not set")
	}

	return FirebaseConfig{
		CredentialsPath: credPath,
		ProjectID:       projectID,
		StorageBucket:   getEnv("FIREBASE_STORAGE_BUCKET", projectID+".appspot.com"),
		MaxRetries:      getInt("FIRESTORE_MAX_RETRIES", 3),
	}, nil
}

func loadCORSConfig() CORSConfig {
	originsStr := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,https://quickgist.vercel.app")
	origins := strings.Split(originsStr, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}

	return CORSConfig{
		AllowedOrigins: origins,
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}
}

func loadRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		RequestsPerSecond: getInt("RATE_LIMIT_RPS", 10),
		BurstSize:         getInt("RATE_LIMIT_BURST", 20),
		Enabled:           getEnv("RATE_LIMIT_ENABLED", "true") == "true",
	}
}

func getEnv(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}

func getDuration(key string, defaultValue time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return defaultValue
}

func getInt(key string, defaultValue int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return defaultValue
}
