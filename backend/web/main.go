package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"google.golang.org/api/option"
)

type application struct {
	errorLog  *log.Logger
	infoLog   *log.Logger
	firestore *firestore.Client
}

func main() {
	addr := flag.String("addr", ":8000", "HTTP Network Port Address")
	serviceAccountPath := flag.String("sa", "", "Path to Firebase Service Account Key JSON file")
	flag.Parse()

	if *serviceAccountPath == "" {
		log.Fatal("Path to Firebase Service Account Key JSON file must be provided")
	}

	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)

	ctx := context.Background()
	opt := option.WithCredentialsFile(*serviceAccountPath)
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
		Addr:     *addr,
		ErrorLog: errorLog,
		Handler:  app.routes(),
	}
	infoLog.Printf("Server started on %s", *addr)
	err = srv.ListenAndServe()
	errorLog.Fatal(err)
}
