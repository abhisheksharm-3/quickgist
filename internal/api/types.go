// The shapes this service accepts and returns.
//
// Every type here is data on the wire: a request body, a response body, or the view
// of a stored record that a client sees. They live together so the API's surface can
// be read in one file rather than reconstructed from eight handlers.
//
// Types that exist only as the receiver for one file's behaviour stay with that
// behaviour: API, the middleware chain, the rate limiter. Separating a struct from
// the only methods it has would cost more than the consistency is worth.
package api

import (
	"time"

	"github.com/abhisheksharm-3/quickgist/internal/render"
	"github.com/abhisheksharm-3/quickgist/internal/store"
)

// createGistRequest is the create payload.
//
// It is JSON rather than multipart. The previous endpoint took multipart for
// everything, so a text-only gist, the common case, paid for form parsing and a
// malformed boundary reported "request too large" for a twenty-byte snippet.
// Uploads have their own endpoint.
type createGistRequest struct {
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Visibility  string      `json:"visibility"`
	ExpiresAt   *time.Time  `json:"expiresAt"`
	Files       []fileInput `json:"files"`
}

// updateGistRequest carries the metadata to change. An omitted field is left alone.
type updateGistRequest struct {
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	Visibility  *string    `json:"visibility"`
	ExpiresAt   *time.Time `json:"expiresAt"`
}

// fileInput is a text file as a client sends it, on create and on replace alike.
type fileInput struct {
	Filename string  `json:"filename"`
	Language *string `json:"language"`
	Content  string  `json:"content"`
}

// previewResponse is what Preview returns.
type previewResponse struct {
	Kind render.Kind `json:"kind"`
	HTML string      `json:"html"`
}

// healthResponse is what the health endpoint returns.
type healthResponse struct {
	Status   string `json:"status"`
	Version  string `json:"version"`
	Database string `json:"database,omitempty"`
}

// errorBody is the only error shape this API returns.
//
// The previous backend had two, structured JSON from handlers and bare text from
// middleware, so a client had to parse both to learn what went wrong.
type errorBody struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// fileView is a file as a client sees it: rendered, with its source alongside so a
// copy button needs no second request.
type fileView struct {
	Filename      string      `json:"filename"`
	Language      *string     `json:"language"`
	Kind          render.Kind `json:"kind"`
	ByteSize      int64       `json:"byteSize"`
	Content       *string     `json:"content,omitempty"`
	HTML          string      `json:"html,omitempty"`
	RawURL        string      `json:"rawUrl"`
	BlobExpiresAt *time.Time  `json:"blobExpiresAt,omitempty"`
}

// gistView is a gist as a client sees it.
type gistView struct {
	Slug        string        `json:"slug"`
	Title       string        `json:"title"`
	Description string        `json:"description"`
	Visibility  string        `json:"visibility"`
	ViewCount   int64         `json:"viewCount"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`
	ExpiresAt   *time.Time    `json:"expiresAt"`
	Author      *store.Author `json:"author"`
	Files       []fileView    `json:"files"`
}
