// Gist reads and writes, each one call to a SQL function in 0003_rpc.sql.
package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/abhisheksharm-3/quickgist/internal/auth"
)

// GetGist reads a gist by slug and counts the view. It returns ErrNotFound when the
// slug is unknown, expired, or private to someone else.
func (s *Store) GetGist(ctx context.Context, id *auth.Identity, slug string) (*Gist, error) {
	var g Gist
	if err := s.queryJSON(ctx, id, &g, "select get_gist($1)", slug); err != nil {
		return nil, err
	}
	return &g, nil
}

// GetGistMeta reads a gist without counting a view.
//
// Used by everything that loads a gist for a machine rather than for a reader: the
// link preview a chat client fetches, and the card image that preview names.
func (s *Store) GetGistMeta(ctx context.Context, id *auth.Identity, slug string) (*Gist, error) {
	var g Gist
	if err := s.queryJSON(ctx, id, &g, "select get_gist_meta($1)", slug); err != nil {
		return nil, err
	}
	return &g, nil
}

// CreateGist inserts a gist and all of its files in one transaction, so a partially
// created gist is not a state the caller can observe.
func (s *Store) CreateGist(ctx context.Context, id *auth.Identity, in CreateGistInput) (*Gist, error) {
	files, err := json.Marshal(in.Files)
	if err != nil {
		return nil, fmt.Errorf("encode files: %w", err)
	}

	var g Gist
	err = s.queryJSON(ctx, id, &g,
		"select create_gist($1, $2, $3, $4, $5)",
		in.Title, in.Description, in.Visibility, in.ExpiresAt, files)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// UpdateGist changes a gist's metadata. Only its author can, and any other caller
// receives ErrNotFound.
func (s *Store) UpdateGist(ctx context.Context, id *auth.Identity, slug string, in UpdateGistInput) (*Gist, error) {
	var g Gist
	err := s.queryJSON(ctx, id, &g,
		"select update_gist($1, $2, $3, $4, $5)",
		slug, in.Title, in.Description, in.Visibility, in.ExpiresAt)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// ReplaceFiles swaps a gist's whole file set. Removed uploads are queued for bucket
// cleanup by a trigger, and cached renders of changed files are dropped.
func (s *Store) ReplaceFiles(ctx context.Context, id *auth.Identity, slug string, files []NewFile) (*Gist, error) {
	payload, err := json.Marshal(files)
	if err != nil {
		return nil, fmt.Errorf("encode files: %w", err)
	}

	var g Gist
	if err := s.queryJSON(ctx, id, &g, "select replace_gist_files($1, $2)", slug, payload); err != nil {
		return nil, err
	}
	return &g, nil
}

// DeleteGist removes a gist and returns ErrNotFound if it is not the caller's.
func (s *Store) DeleteGist(ctx context.Context, id *auth.Identity, slug string) error {
	return s.asCaller(ctx, id, func(tx pgx.Tx) error {
		var deleted bool
		if err := tx.QueryRow(ctx, "select delete_gist($1)", slug).Scan(&deleted); err != nil {
			return translate(err)
		}
		if !deleted {
			return ErrNotFound
		}
		return nil
	})
}

// ListGists returns the public feed, or one author's gists when handle is set. The
// author's own listing includes their unlisted and private gists; nobody else's does.
func (s *Store) ListGists(ctx context.Context, id *auth.Identity, handle *string, limit int, before *time.Time) ([]Gist, error) {
	gists := []Gist{}
	if err := s.queryJSON(ctx, id, &gists, "select list_gists($1, $2, $3)", handle, limit, before); err != nil {
		return nil, err
	}
	return gists, nil
}

// SearchGists runs full-text search across public gists only.
func (s *Store) SearchGists(ctx context.Context, id *auth.Identity, query string, limit int) ([]Gist, error) {
	gists := []Gist{}
	if err := s.queryJSON(ctx, id, &gists, "select search_gists($1, $2)", query, limit); err != nil {
		return nil, err
	}
	return gists, nil
}
