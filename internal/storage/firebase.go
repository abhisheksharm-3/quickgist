package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"time"

	firebase "firebase.google.com/go"
	"google.golang.org/api/option"

	"github.com/abhisheksharm-3/quickgist/internal/apperror"
)

const (
	uploadTimeout   = 30 * time.Second
	filePathPrefix  = "quickgist-user-files"
	fileURLPattern  = "/files/%s/%s"
)

// FirebaseStorage implements FileStorage using Firebase Cloud Storage.
type FirebaseStorage struct {
	bucketName string
	app        *firebase.App
}

// NewFirebaseStorage creates a new Firebase storage instance.
func NewFirebaseStorage(credentialsPath, bucketName string) (*FirebaseStorage, error) {
	ctx := context.Background()
	
	opt := option.WithCredentialsFile(credentialsPath)
	config := &firebase.Config{StorageBucket: bucketName}
	
	app, err := firebase.NewApp(ctx, config, opt)
	if err != nil {
		return nil, apperror.Storage(err)
	}

	return &FirebaseStorage{
		bucketName: bucketName,
		app:        app,
	}, nil
}

// Upload stores a file in Firebase Storage and returns its metadata.
func (s *FirebaseStorage) Upload(ctx context.Context, gistID, filename string, content io.Reader, size int64) (*FileInfo, error) {
	ctx, cancel := context.WithTimeout(ctx, uploadTimeout)
	defer cancel()

	client, err := s.app.Storage(ctx)
	if err != nil {
		return nil, apperror.Storage(err)
	}

	bucket, err := client.DefaultBucket()
	if err != nil {
		return nil, apperror.Storage(err)
	}

	objectPath := fmt.Sprintf("%s/%s/%s", filePathPrefix, gistID, filename)
	obj := bucket.Object(objectPath)
	writer := obj.NewWriter(ctx)

	if _, err := io.Copy(writer, content); err != nil {
		writer.Close()
		return nil, apperror.Storage(err)
	}

	if err := writer.Close(); err != nil {
		return nil, apperror.Storage(err)
	}

	attrs, err := obj.Attrs(ctx)
	if err != nil {
		return nil, apperror.Storage(err)
	}

	fileURL := fmt.Sprintf(
		"https://firebasestorage.googleapis.com/v0/b/%s/o/%s?generation=%d&alt=media",
		s.bucketName,
		url.QueryEscape(objectPath),
		attrs.Generation,
	)

	publicFileURL := fmt.Sprintf(fileURLPattern, gistID, url.PathEscape(filename))

	return &FileInfo{
		FileName:      filename,
		FileURL:       fileURL,
		PublicFileURL: publicFileURL,
		Size:          attrs.Size,
	}, nil
}
