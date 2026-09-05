// The render cache and the orphaned-blob queue, both owner-only side tables.
package store

import (
	"context"
	"fmt"
)

// CacheRender stores rendered HTML for a file.
//
// It runs without a caller identity because gist_file_renders has row-level security
// enabled and no policies, so only the owner role can reach it.
func (s *Store) CacheRender(ctx context.Context, fileID, html, rendererHash string) error {
	if _, err := s.pool.Exec(ctx, "select cache_render($1, $2, $3)", fileID, html, rendererHash); err != nil {
		return fmt.Errorf("cache render for file %s: %w", fileID, translate(err))
	}
	return nil
}

// ClaimOrphanedBlobs returns storage paths whose database rows are gone, so the
// janitor can delete the objects Postgres cannot reach.
func (s *Store) ClaimOrphanedBlobs(ctx context.Context, limit int) ([]string, error) {
	if limit <= 0 || limit > blobClaimLimit {
		limit = blobClaimLimit
	}

	rows, err := s.pool.Query(ctx, "select claim_orphaned_blobs($1)", limit)
	if err != nil {
		return nil, fmt.Errorf("claim orphaned blobs: %w", translate(err))
	}
	defer rows.Close()

	var paths []string
	for rows.Next() {
		var p string
		if err := rows.Scan(&p); err != nil {
			return nil, fmt.Errorf("scan orphaned blob path: %w", err)
		}
		paths = append(paths, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate orphaned blobs: %w", err)
	}
	return paths, nil
}

// ReleaseOrphanedBlob drops a path from the queue once its object is deleted.
// Releasing before the object is gone would lose the object permanently.
func (s *Store) ReleaseOrphanedBlob(ctx context.Context, path string) error {
	if _, err := s.pool.Exec(ctx, "select release_orphaned_blob($1)", path); err != nil {
		return fmt.Errorf("release orphaned blob %s: %w", path, err)
	}
	return nil
}
