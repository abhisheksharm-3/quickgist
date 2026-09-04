// Revision reads and the restore write, each one call to a SQL function in
// 0008_revisions.sql.
package store

import (
	"context"
	"time"

	"github.com/abhisheksharm-3/quickgist/internal/auth"
)

// RevisionSummary is one entry in a gist's history.
type RevisionSummary struct {
	Revision  int       `json:"revision"`
	Title     string    `json:"title"`
	FileCount int       `json:"fileCount"`
	CreatedAt time.Time `json:"createdAt"`
}

// RevisionFile is a file as a revision stored it.
//
// A revision holds the same shape the replace endpoint accepts, so restoring is a
// replace with old input rather than a second code path.
type RevisionFile struct {
	Filename    string  `json:"filename"`
	Language    *string `json:"language,omitempty"`
	Content     *string `json:"content,omitempty"`
	StoragePath *string `json:"storage_path,omitempty"`
	ByteSize    int64   `json:"byte_size,omitempty"`
}

// Revision is one stored version of a gist.
type Revision struct {
	Revision    int            `json:"revision"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	CreatedAt   time.Time      `json:"createdAt"`
	Files       []RevisionFile `json:"files"`
}

// ListRevisions returns a gist's history, newest first.
func (s *Store) ListRevisions(ctx context.Context, id *auth.Identity, slug string) ([]RevisionSummary, error) {
	var out []RevisionSummary
	if err := s.queryJSON(ctx, id, &out, "select list_revisions($1)", slug); err != nil {
		return nil, err
	}
	return out, nil
}

// GetRevision returns one stored version with the text of its files.
func (s *Store) GetRevision(ctx context.Context, id *auth.Identity, slug string, revision int) (*Revision, error) {
	var out Revision
	if err := s.queryJSON(ctx, id, &out, "select get_revision($1, $2)", slug, revision); err != nil {
		return nil, err
	}
	return &out, nil
}

// RestoreRevision makes a stored version current, snapshotting what it replaces.
func (s *Store) RestoreRevision(ctx context.Context, id *auth.Identity, slug string, revision int) (*Gist, error) {
	var g Gist
	if err := s.queryJSON(ctx, id, &g, "select restore_revision($1, $2)", slug, revision); err != nil {
		return nil, err
	}
	return &g, nil
}
