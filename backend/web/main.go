package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

// Config holds all application configuration
type Config struct {
	Port                string
	Env                 string
	FirebaseProjectID   string
	ServiceAccountPath  string
	ShutdownTimeout     time.Duration
	ReadTimeout         time.Duration
	WriteTimeout        time.Duration
	IdleTimeout         time.Duration
	MaxHeaderBytes      int
	FirestoreMaxRetries int
}

// Application holds all dependencies
type application struct {
	config    Config
	errorLog  *log.Logger
	infoLog   *log.Logger
	firestore *firestore.Client
}

// Custom errors
var (
	ErrMissingConfig = errors.New("missing required configuration")
	ErrFirebaseInit  = errors.New("firebase initialization failed")
)

func loadConfig() (Config, error) {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		return Config{}, fmt.Errorf("error loading .env file: %w", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	serviceAccountPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	if serviceAccountPath == "" {
		return Config{}, fmt.Errorf("%w: GOOGLE_APPLICATION_CREDENTIALS not set", ErrMissingConfig)
	}

	projectID := os.Getenv("FIREBASE_PROJECT_ID")
	if projectID == "" {
		return Config{}, fmt.Errorf("%w: FIREBASE_PROJECT_ID not set", ErrMissingConfig)
	}

	config := Config{
		Port:                fmt.Sprintf(":%s", port),
		Env:                 getEnvWithDefault("APP_ENV", "development"),
		FirebaseProjectID:   projectID,
		ServiceAccountPath:  serviceAccountPath,
		ShutdownTimeout:     getEnvDurationWithDefault("SHUTDOWN_TIMEOUT", 30*time.Second),
		ReadTimeout:         getEnvDurationWithDefault("READ_TIMEOUT", 10*time.Second),
		WriteTimeout:        getEnvDurationWithDefault("WRITE_TIMEOUT", 30*time.Second),
		IdleTimeout:         getEnvDurationWithDefault("IDLE_TIMEOUT", 120*time.Second),
		MaxHeaderBytes:      getEnvIntWithDefault("MAX_HEADER_BYTES", 1<<20), // 1 MB
		FirestoreMaxRetries: getEnvIntWithDefault("FIRESTORE_MAX_RETRIES", 3),
	}

	return config, nil
}

func initializeFirebase(config Config) (*firebase.App, error) {
	ctx := context.Background()

	opt := option.WithCredentialsFile(config.ServiceAccountPath)
	fbConfig := &firebase.Config{
		ProjectID: config.FirebaseProjectID,
	}

	app, err := firebase.NewApp(ctx, fbConfig, opt)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrFirebaseInit, err)
	}

	return app, nil
}

func setupLogging() (*log.Logger, *log.Logger) {
	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime|log.LUTC)
	errorLog := log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.LUTC|log.Lshortfile)
	return infoLog, errorLog
}

func main() {
	// Setup logging
	infoLog, errorLog := setupLogging()

	// Load configuration
	config, err := loadConfig()
	if err != nil {
		errorLog.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize Firebase
	firebaseApp, err := initializeFirebase(config)
	if err != nil {
		errorLog.Fatalf("Failed to initialize Firebase: %v", err)
	}

	// Initialize Firestore with retry mechanism
	var client *firestore.Client
	ctx := context.Background()
	for i := 0; i < config.FirestoreMaxRetries; i++ {
		client, err = firebaseApp.Firestore(ctx)
		if err == nil {
			break
		}
		if i < config.FirestoreMaxRetries-1 {
			time.Sleep(time.Second * time.Duration(i+1))
		}
	}
	if err != nil {
		errorLog.Fatalf("Error initializing Firestore client after %d retries: %v",
			config.FirestoreMaxRetries, err)
	}
	defer client.Close()

	// Initialize application
	app := &application{
		config:    config,
		errorLog:  errorLog,
		infoLog:   infoLog,
		firestore: client,
	}

	// Initialize server
	srv := &http.Server{
		Addr:           config.Port,
		Handler:        app.routes(),
		ErrorLog:       errorLog,
		ReadTimeout:    config.ReadTimeout,
		WriteTimeout:   config.WriteTimeout,
		IdleTimeout:    config.IdleTimeout,
		MaxHeaderBytes: config.MaxHeaderBytes,
	}

	// Channel to listen for errors coming from the server
	serverErrors := make(chan error, 1)

	// Start server
	go func() {
		infoLog.Printf("Starting server in %s mode on %s", config.Env, config.Port)
		serverErrors <- srv.ListenAndServe()
	}()

	// Channel to listen for interrupt signals
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	// Block until a signal is received or an error occurs
	select {
	case err := <-serverErrors:
		errorLog.Printf("Error starting server: %v", err)
	case sig := <-shutdown:
		infoLog.Printf("Received signal %v, initiating shutdown", sig)

		// Create shutdown context with timeout
		ctx, cancel := context.WithTimeout(context.Background(), config.ShutdownTimeout)
		defer cancel()

		// Gracefully shutdown the server
		if err := srv.Shutdown(ctx); err != nil {
			errorLog.Printf("Error during server shutdown: %v", err)
			if err := srv.Close(); err != nil {
				errorLog.Printf("Error closing server: %v", err)
			}
		}

		// Cleanup resources
		if err := client.Close(); err != nil {
			errorLog.Printf("Error closing Firestore client: %v", err)
		}
	}
}

// Helper functions for environment variables
func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvDurationWithDefault(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getEnvIntWithDefault(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
