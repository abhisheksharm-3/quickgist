package storage

import (
	"context"
	"io"
)

// FileInfo contains metadata about an uploaded file.
type FileInfo struct {
	FileName      string
	FileURL       string
	PublicFileURL string
	Size          int64
}

// FileStorage defines the interface for file storage operations.
type FileStorage interface {
	Upload(ctx context.Context, gistID, filename string, content io.Reader, size int64) (*FileInfo, error)
}
