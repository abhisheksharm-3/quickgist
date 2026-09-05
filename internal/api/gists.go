// Gist handlers: create, read, update, delete, list, and search.
package api

import (
	"errors"
	"github.com/abhisheksharm-3/quickgist/internal/domain"
	"net/http"
	"strings"
)

// CreateGist handles POST /v1/gists.
func (a *API) CreateGist(w http.ResponseWriter, r *http.Request) {
	var req createGistRequest
	if !a.decodeJSON(w, r, &req) {
		return
	}

	if strings.TrimSpace(req.Title) == "" {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidRequest, errors.New("title is required"))
		return
	}

	visibility, err := resolveVisibility(req.Visibility)
	if err != nil {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidRequest, err)
		return
	}

	identity := a.identity(r)
	if visibility == domain.VisibilityPrivate && identity == nil {
		a.fail(w, r, http.StatusUnauthorized, codeUnauthenticated, nil)
		return
	}

	files, err := toNewFiles(req.Files)
	if err != nil {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidRequest, err)
		return
	}

	gist, err := a.store.CreateGist(r.Context(), identity, domain.CreateGistInput{
		Title:       req.Title,
		Description: req.Description,
		Visibility:  visibility,
		ExpiresAt:   req.ExpiresAt,
		Files:       files,
	})
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	w.Header().Set("Location", "/v1/gists/"+gist.Slug)
	a.respond(w, r, http.StatusCreated, a.view(r.Context(), gist))
}

// GetGist handles GET /v1/gists/{slug}.
func (a *API) GetGist(w http.ResponseWriter, r *http.Request) {
	gist, err := a.store.GetGist(r.Context(), a.identity(r), r.PathValue("slug"))
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	w.Header().Set("Cache-Control", "private, no-cache")
	a.respond(w, r, http.StatusOK, a.view(r.Context(), gist))
}

// UpdateGist handles PATCH /v1/gists/{slug}.
func (a *API) UpdateGist(w http.ResponseWriter, r *http.Request) {
	id, ok := a.requireIdentity(w, r)
	if !ok {
		return
	}

	var req updateGistRequest
	if !a.decodeJSON(w, r, &req) {
		return
	}

	if req.Visibility != nil && !domain.ValidVisibility(*req.Visibility) {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidRequest, errors.New("unknown visibility"))
		return
	}

	gist, err := a.store.UpdateGist(r.Context(), id, r.PathValue("slug"), domain.UpdateGistInput{
		Title:       req.Title,
		Description: req.Description,
		Visibility:  req.Visibility,
		ExpiresAt:   req.ExpiresAt,
	})
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	a.respond(w, r, http.StatusOK, a.view(r.Context(), gist))
}

// ReplaceGistFiles handles PUT /v1/gists/{slug}/files.
func (a *API) ReplaceGistFiles(w http.ResponseWriter, r *http.Request) {
	id, ok := a.requireIdentity(w, r)
	if !ok {
		return
	}

	var req struct {
		Files []fileInput `json:"files"`
	}
	if !a.decodeJSON(w, r, &req) {
		return
	}

	files, err := toNewFiles(req.Files)
	if err != nil {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidRequest, err)
		return
	}

	gist, err := a.store.ReplaceFiles(r.Context(), id, r.PathValue("slug"), files)
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	a.respond(w, r, http.StatusOK, a.view(r.Context(), gist))
}

// DeleteGist handles DELETE /v1/gists/{slug}.
func (a *API) DeleteGist(w http.ResponseWriter, r *http.Request) {
	id, ok := a.requireIdentity(w, r)
	if !ok {
		return
	}

	if err := a.store.DeleteGist(r.Context(), id, r.PathValue("slug")); err != nil {
		a.failFromStore(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ListGists handles GET /v1/gists.
func (a *API) ListGists(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	cursor, err := parseCursor(q)
	if err != nil {
		a.fail(w, r, http.StatusBadRequest, codeInvalidRequest, err)
		return
	}

	var handle *string
	if h := strings.TrimSpace(q.Get("author")); h != "" {
		handle = &h
	}

	gists, err := a.store.ListGists(r.Context(), a.identity(r), handle, pageSize(q.Get("limit")), cursor)
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	a.respond(w, r, http.StatusOK, a.summaries(gists))
}

// SearchGists handles GET /v1/gists/search.
func (a *API) SearchGists(w http.ResponseWriter, r *http.Request) {
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	if query == "" {
		a.fail(w, r, http.StatusBadRequest, codeInvalidRequest, errors.New("q is required"))
		return
	}

	gists, err := a.store.SearchGists(r.Context(), a.identity(r),
		query, pageSize(r.URL.Query().Get("limit")))
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	a.respond(w, r, http.StatusOK, a.summaries(gists))
}

// resolveVisibility defaults an empty visibility to unlisted and rejects an unknown
// one, so a typo cannot silently make a gist public.
func resolveVisibility(requested string) (string, error) {
	if requested == "" {
		return domain.VisibilityUnlisted, nil
	}
	if !domain.ValidVisibility(requested) {
		return "", errors.New("unknown visibility")
	}
	return requested, nil
}
