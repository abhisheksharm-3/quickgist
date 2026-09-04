// Background cleanup of bucket objects whose database rows are gone.
package blob

import (
	"context"
	"log/slog"
	"time"
)

const (
	sweepInterval = 10 * time.Minute
	sweepBatch    = 100
)

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

// NewJanitor builds a Janitor that sweeps every ten minutes.
func NewJanitor(store *Store, queue Queue, log *slog.Logger) *Janitor {
	return &Janitor{
		store:    store,
		queue:    queue,
		log:      log,
		interval: sweepInterval,
		batch:    sweepBatch,
	}
}

// Run sweeps until ctx is cancelled, starting with one immediate sweep so a restart
// picks up whatever the previous process left behind.
func (j *Janitor) Run(ctx context.Context) {
	ticker := time.NewTicker(j.interval)
	defer ticker.Stop()

	j.sweep(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			j.sweep(ctx)
		}
	}
}

// sweep deletes one batch of orphaned objects. A failure on any single path is
// logged and left queued for the next sweep rather than aborting the batch.
func (j *Janitor) sweep(ctx context.Context) {
	paths, err := j.queue.ClaimOrphanedBlobs(ctx, j.batch)
	if err != nil {
		j.log.ErrorContext(ctx, "janitor could not read the cleanup queue", "error", err)
		return
	}
	if len(paths) == 0 {
		return
	}

	deleted := 0
	for _, p := range paths {
		if ctx.Err() != nil {
			return
		}
		if j.deleteAndRelease(ctx, p) {
			deleted++
		}
	}

	j.log.InfoContext(ctx, "janitor swept orphaned blobs", "claimed", len(paths), "deleted", deleted)
}

// deleteAndRelease removes one object then dequeues it, reporting whether both
// steps succeeded.
func (j *Janitor) deleteAndRelease(ctx context.Context, path string) bool {
	if err := j.store.Delete(ctx, path); err != nil {
		j.log.ErrorContext(ctx, "janitor could not delete a blob", "path", path, "error", err)
		return false
	}
	if err := j.queue.ReleaseOrphanedBlob(ctx, path); err != nil {
		j.log.ErrorContext(ctx, "janitor deleted a blob but could not dequeue it", "path", path, "error", err)
		return false
	}
	return true
}
