// domain.Revision reads and the restore write, each one call to a SQL function in
// 0008_revisions.sql.
package store

import (
	"context"
	"github.com/abhisheksharm-3/quickgist/internal/domain"

	"github.com/abhisheksharm-3/quickgist/internal/auth"
)

// ListRevisions returns a gist's history, newest first.
func (s *Store) ListRevisions(ctx context.Context, id *auth.Identity, slug string) ([]domain.RevisionSummary, error) {
	var out []domain.RevisionSummary
	if err := s.queryJSON(ctx, id, &out, "select list_revisions($1)", slug); err != nil {
		return nil, err
	}
	return out, nil
}

// GetRevision returns one stored version with the text of its files.
func (s *Store) GetRevision(ctx context.Context, id *auth.Identity, slug string, revision int) (*domain.Revision, error) {
	var out domain.Revision
	if err := s.queryJSON(ctx, id, &out, "select get_revision($1, $2)", slug, revision); err != nil {
		return nil, err
	}
	return &out, nil
}

// RestoreRevision makes a stored version current, snapshotting what it replaces.
func (s *Store) RestoreRevision(ctx context.Context, id *auth.Identity, slug string, revision int) (*domain.Gist, error) {
	var g domain.Gist
	if err := s.queryJSON(ctx, id, &g, "select restore_revision($1, $2)", slug, revision); err != nil {
		return nil, err
	}
	return &g, nil
}
