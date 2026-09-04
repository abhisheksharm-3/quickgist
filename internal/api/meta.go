// Endpoints describing the service itself: health and the highlight stylesheet.
package api

import (
	"io"
	"net/http"
)

// HighlightCSS handles GET /v1/highlight.css.
//
// The stylesheet is generated at startup and immutable for the life of a renderer
// hash, so it is safe to cache indefinitely. Serving it from the API keeps the
// highlight classes and the rules that style them versioned together.
func (a *API) HighlightCSS(w http.ResponseWriter, r *http.Request) {
	etag := `"` + a.renderer.Hash() + `"`

	w.Header().Set("Content-Type", "text/css; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	w.Header().Set("ETag", etag)

	if r.Header.Get("If-None-Match") == etag {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	w.WriteHeader(http.StatusOK)
	if _, err := io.WriteString(w, a.css); err != nil {
		a.log.DebugContext(r.Context(), "client closed connection mid-stylesheet", "error", err)
	}
}

// healthResponse is what the health endpoint returns.
type healthResponse struct {
	Status   string `json:"status"`
	Version  string `json:"version"`
	Database string `json:"database,omitempty"`
}

// Health handles GET /v1/health.
//
// It reports the database, because a server that cannot reach Postgres is not
// healthy however well it answers HTTP, and a load balancer needs to know that.
func (a *API) Health(w http.ResponseWriter, r *http.Request) {
	body := healthResponse{Status: "ok", Version: a.version}
	status := http.StatusOK

	if err := a.store.Ping(r.Context()); err != nil {
		body.Status = "degraded"
		body.Database = "unreachable"
		status = http.StatusServiceUnavailable
		a.log.ErrorContext(r.Context(), "health check failed", "error", err)
	}

	w.Header().Set("Cache-Control", "no-store")
	a.respond(w, r, status, body)
}
