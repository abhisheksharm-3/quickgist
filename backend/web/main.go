package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

type application struct {
	errorLog  *log.Logger
	infoLog   *log.Logger
	firestore *firestore.Client
}

func initializeFirebase() (*firebase.App, error) {
	ctx := context.Background()
	serviceAccountPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	if serviceAccountPath == "" {
		return nil, fmt.Errorf("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set")
	}

	opt := option.WithCredentialsFile(serviceAccountPath)
	config := &firebase.Config{
		ProjectID: os.Getenv("FIREBASE_PROJECT_ID"), // Make sure to set this in your .env file
	}

	app, err := firebase.NewApp(ctx, config, opt)
	if err != nil {
		return nil, fmt.Errorf("error initializing Firebase app: %v", err)
	}

	return app, nil
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	addr := os.Getenv("PORT")
	if addr == "" {
		addr = ":8000" // Default value if not set
	} else {
		addr = ":" + addr // Prepend ":" to the PORT value
	}

	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)

	firebaseApp, err := initializeFirebase()
	if err != nil {
		errorLog.Fatalf("Failed to initialize Firebase: %v", err)
	}

	ctx := context.Background()
	client, err := firebaseApp.Firestore(ctx)
	if err != nil {
		errorLog.Fatalf("Error initializing Firestore client: %v", err)
	}
	defer client.Close()

	app := &application{
		errorLog:  errorLog,
		infoLog:   infoLog,
		firestore: client,
	}

	srv := &http.Server{
		Addr:     addr,
		ErrorLog: errorLog,
		Handler:  app.routes(),
	}

	infoLog.Printf("Server started on %s", addr)
	err = srv.ListenAndServe()
	errorLog.Fatal(err)
}
