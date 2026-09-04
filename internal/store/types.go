// The gist domain types, shaped to match the jsonb the SQL functions return.
package store

import "time"

// Visibility values, matching the gist_visibility enum in 0001_init.sql.
const (
	VisibilityPublic   = "public"
	VisibilityUnlisted = "unlisted"
	VisibilityPrivate  = "private"
)

// ValidVisibility reports whether v is one of the three enum values. Callers must
// check this before passing a visibility to the database, so an unknown value
// becomes a validation error rather than a failed cast.
func ValidVisibility(v string) bool {
	return v == VisibilityPublic || v == VisibilityUnlisted || v == VisibilityPrivate
}

// Author is the public face of a profile.
type Author struct {
	Handle      string  `json:"handle"`
	DisplayName *string `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
}

// File is one file in a gist. Exactly one of Content and StoragePath is set, an
// invariant the text_or_blob_not_both constraint enforces.
type File struct {
	ID            string     `json:"id"`
	Filename      string     `json:"filename"`
	Language      *string    `json:"language"`
	Content       *string    `json:"content"`
	StoragePath   *string    `json:"storage_path"`
	ByteSize      int64      `json:"byte_size"`
	BlobExpiresAt *time.Time `json:"blob_expires_at"`
	RenderedHTML  *string    `json:"rendered_html"`
	RendererHash  *string    `json:"renderer_hash"`
}

// Gist is a shared set of files.
type Gist struct {
	Slug        string     `json:"slug"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Visibility  string     `json:"visibility"`
	ViewCount   int64      `json:"view_count"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	ExpiresAt   *time.Time `json:"expires_at"`
	Author      *Author    `json:"author"`
	Files       []File     `json:"files"`
}

// NewFile is an incoming file on create or replace. RetentionDays applies only to an
// upload and is capped at MaxRetentionDays by the database regardless of its value.
type NewFile struct {
	Filename      string  `json:"filename"`
	Language      *string `json:"language,omitempty"`
	Content       *string `json:"content,omitempty"`
	StoragePath   *string `json:"storage_path,omitempty"`
	ByteSize      int64   `json:"byte_size,omitempty"`
	RetentionDays *int    `json:"retention_days,omitempty"`
}

// MaxRetentionDays is the ceiling on how long an upload is kept. The
// blob_retention_within_ceiling constraint enforces it; this constant exists so the
// API can reject an out-of-range request with a clear error instead of letting the
// database clamp it silently.
const MaxRetentionDays = 30

// CreateGistInput is a request to create a gist.
type CreateGistInput struct {
	Title       string
	Description string
	Visibility  string
	ExpiresAt   *time.Time
	Files       []NewFile
}

// UpdateGistInput carries the metadata fields to change. A nil field is left as it is.
type UpdateGistInput struct {
	Title       *string
	Description *string
	Visibility  *string
	ExpiresAt   *time.Time
}
