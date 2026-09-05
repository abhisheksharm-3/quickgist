// What a caller gets back from the bucket, and what the janitor needs from the
// database.
//
// Store and Janitor stay with their behaviour; these two are data and a dependency
// boundary, which is what the rest of the service actually couples to.
package blob

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"time"
)

// Object is an open download. The caller must Close it.
type Object struct {
	Body          io.ReadCloser
	ContentType   string
	ContentLength int64
	ETag          string
	LastModified  string
}

// Queue is the orphaned-blob work queue.
//
// Deleting a gist_files row enqueues its storage path by trigger, so every deletion
// path arrives here: an author deleting a gist, the upload retention sweep, and the
// cascade from an expiring gist.
//
// It is an interface so this package stays about object storage and does not import
// the database layer.
type Queue interface {
	ClaimOrphanedBlobs(ctx context.Context, limit int) ([]string, error)
	ReleaseOrphanedBlob(ctx context.Context, path string) error
}

// Store is a handle on one storage bucket.
//
// The bucket is private and only this service holds its key. Reads are proxied by
// the API, which checks a gist's visibility first, so a private gist's attachment is
// never world-readable by URL.
type Store struct {
	baseURL string
	bucket  string
	key     string
	client  *http.Client
}

// Janitor deletes bucket objects whose rows have been removed.
//
// Postgres cannot reach the bucket, so without this an expired upload's bytes would
// be billed forever. A path is released only after its object is gone, which makes
// the queue safe to retry: a crash mid-sweep leaves work to redo, never work lost.
type Janitor struct {
	store    *Store
	queue    Queue
	log      *slog.Logger
	interval time.Duration
	batch    int
}
