// The shapes this service accepts and returns.
//
// Every type here is data on the wire: a request body, a response body, or the view
// of a stored record that a client sees. They live together so the API's surface can
// be read in one file rather than reconstructed from eight handlers.
//
// The receiver types are here too: API, the middleware chain, the rate limiter. Go
// requires a method to sit in its type's package, not in its file, so the
// declarations gather here while the behaviour stays in the file it belongs to.
package api

import (
	"log/slog"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"

	"github.com/abhisheksharm-3/quickgist/internal/auth"
	"github.com/abhisheksharm-3/quickgist/internal/blob"
	"github.com/abhisheksharm-3/quickgist/internal/card"
	"github.com/abhisheksharm-3/quickgist/internal/config"
	"github.com/abhisheksharm-3/quickgist/internal/domain"
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
//
// ExpiresAt is a pointer to a pointer so the three cases stay distinct: absent
// leaves the expiry as it is, a timestamp sets it, and an explicit null removes it.
// With one level of indirection the last two are the same value, and a gist set to
// expire could never be set back to never.
type updateGistRequest struct {
	Title       *string     `json:"title"`
	Description *string     `json:"description"`
	Visibility  *string     `json:"visibility"`
	ExpiresAt   **time.Time `json:"expiresAt"`
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
	Slug        string         `json:"slug"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Visibility  string         `json:"visibility"`
	ViewCount   int64          `json:"viewCount"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	ExpiresAt   *time.Time     `json:"expiresAt"`
	Author      *domain.Author `json:"author"`
	Files       []fileView     `json:"files"`
}

// API holds the handler dependencies.
type API struct {
	cfg            *config.Config
	store          *store.Store
	blobs          *blob.Store
	renderer       *render.Renderer
	cards          *card.Renderer
	verifier       *auth.Verifier
	log            *slog.Logger
	version        string
	css            string
	previewLimiter *limiter
}

// limiter is a token bucket per client address.
type limiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	rate     rate.Limit
	burst    int
}

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// middleware wraps a handler.
type middleware func(http.Handler) http.Handler

// recorder captures the status and byte count for logging.
type recorder struct {
	http.ResponseWriter
	status int
	bytes  int
}
