package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
)

type application struct {
	errorLog  *log.Logger
	infoLog   *log.Logger
	firestore *firestore.Client
}

func main() {
	addr := flag.String("addr", ":8000", "HTTP Network Port Address")
	projectID := flag.String("project", "", "Firebase Project ID")
	//call parse method before using addr to assign cli given value to addr
	flag.Parse()

	if *projectID == "" {
		log.Fatal("Firebase Project ID must be provided")
	}

	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)

	//mux is a request multiplexer that matches the URL of each incoming request against a list of registered patterns and calls the handler for the pattern that most closely matches the URL.
	ctx := context.Background()
	conf := &firebase.Config{ProjectID: *projectID}
	firebaseApp, err := firebase.NewApp(ctx, conf)
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
