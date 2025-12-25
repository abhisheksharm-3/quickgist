package handler

import (
	"fmt"
	"io"
	"net/http"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/julienschmidt/httprouter"

	"github.com/abhisheksharm-3/quickgist/internal/apperror"
)

var (
	httpClient = &http.Client{
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 100,
			IdleConnTimeout:     90 * time.Second,
		},
		Timeout: 30 * time.Second,
	}

	safeFilenamePattern = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)
)

// ServeFile handles GET /files/:snippetId/*filepath
func (h *Handler) ServeFile(w http.ResponseWriter, r *http.Request) {
	params := httprouter.ParamsFromContext(r.Context())
	snippetID := strings.TrimSpace(params.ByName("snippetId"))
	filepath := params.ByName("filepath")

	filepath = path.Clean(strings.TrimPrefix(filepath, "/"))

	if snippetID == "" || filepath == "" {
		h.respondError(w, apperror.BadRequest("invalid file path"))
		return
	}

	if strings.Contains(filepath, "..") || strings.HasPrefix(filepath, "/") {
		h.respondError(w, apperror.BadRequest("invalid file path"))
		return
	}

	gist, err := h.repo.Get(r.Context(), snippetID)
	if err != nil {
		h.respondError(w, err)
		return
	}

	if gist.FileURL == "" {
		h.respondError(w, apperror.NotFound("file"))
		return
	}

	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, gist.FileURL, nil)
	if err != nil {
		h.respondError(w, apperror.Internal(err))
		return
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		h.respondError(w, apperror.Internal(err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		h.respondError(w, apperror.Internal(fmt.Errorf("upstream returned %d", resp.StatusCode)))
		return
	}

	w.Header().Set("Content-Security-Policy", "default-src 'self'")
	w.Header().Set("X-Content-Type-Options", "nosniff")

	if ct := resp.Header.Get("Content-Type"); ct != "" {
		w.Header().Set("Content-Type", ct)
	}
	if cd := resp.Header.Get("Content-Disposition"); cd != "" {
		w.Header().Set("Content-Disposition", cd)
	} else {
		w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=%q", filepath))
	}

	w.Header().Set("Cache-Control", "public, max-age=3600")
	if etag := resp.Header.Get("ETag"); etag != "" {
		w.Header().Set("ETag", etag)
	}
	if lm := resp.Header.Get("Last-Modified"); lm != "" {
		w.Header().Set("Last-Modified", lm)
	}
	if cl := resp.Header.Get("Content-Length"); cl != "" {
		w.Header().Set("Content-Length", cl)
	}

	w.WriteHeader(http.StatusOK)
	if _, err := io.Copy(w, resp.Body); err != nil {
		h.errorLog.Printf("error streaming file: %v", err)
	}
}
