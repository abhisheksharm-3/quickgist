package main

import (
	"context"
	"log"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"google.golang.org/api/option"

	"github.com/abhisheksharm-3/quickgist/internal/cache"
	"github.com/abhisheksharm-3/quickgist/internal/config"
	"github.com/abhisheksharm-3/quickgist/internal/handler"
	"github.com/abhisheksharm-3/quickgist/internal/repository"
	"github.com/abhisheksharm-3/quickgist/internal/server"
	"github.com/abhisheksharm-3/quickgist/internal/storage"
)

func main() {
	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime|log.LUTC)
	errorLog := log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.LUTC|log.Lshortfile)

	cfg, err := config.Load()
	if err != nil {
		errorLog.Fatalf("failed to load config: %v", err)
	}

	firestoreClient, err := initFirestore(cfg.Firebase)
	if err != nil {
		errorLog.Fatalf("failed to initialize firestore: %v", err)
	}
	defer firestoreClient.Close()

	fileStorage, err := storage.NewFirebaseStorage(
		cfg.Firebase.CredentialsPath,
		cfg.Firebase.StorageBucket,
	)
	if err != nil {
		errorLog.Fatalf("failed to initialize storage: %v", err)
	}

	repo := repository.NewFirestoreRepository(firestoreClient)
	gistCache := cache.NewMemoryCache(1000)

	h := handler.New(repo, fileStorage, gistCache, infoLog, errorLog)

	srv := server.New(cfg, h, infoLog, errorLog)

	if err := srv.Start(); err != nil {
		errorLog.Fatalf("server error: %v", err)
	}
}

func initFirestore(cfg config.FirebaseConfig) (*firestore.Client, error) {
	ctx := context.Background()

	opt := option.WithCredentialsFile(cfg.CredentialsPath)
	fbConfig := &firebase.Config{ProjectID: cfg.ProjectID}

	app, err := firebase.NewApp(ctx, fbConfig, opt)
	if err != nil {
		return nil, err
	}

	var client *firestore.Client
	for i := 0; i < cfg.MaxRetries; i++ {
		client, err = app.Firestore(ctx)
		if err == nil {
			return client, nil
		}
		if i < cfg.MaxRetries-1 {
			time.Sleep(time.Second * time.Duration(i+1))
		}
	}

	return nil, err
}
