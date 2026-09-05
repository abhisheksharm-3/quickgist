// What a caller gets back from the bucket, and what the janitor needs from the
// database.
//
// Store and Janitor stay with their behaviour; these two are data and a dependency
// boundary, which is what the rest of the service actually couples to.
package blob

import (
	"context"
	"io"
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
