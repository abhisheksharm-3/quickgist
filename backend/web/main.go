package main

import (
	"context"
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

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	addr := os.Getenv("PORT")
	if addr == "" {
		addr = ":8000" // Default value if not set
	}

	serviceAccountPath := os.Getenv("FIREBASE_SA_PATH")
	if serviceAccountPath == "" {
		log.Fatal("FIREBASE_SA_PATH environment variable must be set")
	}

	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)

	ctx := context.Background()
	opt := option.WithCredentialsFile(serviceAccountPath)
	firebaseApp, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		errorLog.Fatalf("Error initializing Firebase app: %v", err)
	}

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
