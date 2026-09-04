// Revision handlers: the history of a gist, and putting an old version back.
package api

import (
	"errors"
	"net/http"
	"strconv"
)

// ListRevisions handles GET /v1/gists/{slug}/revisions.
//
// Available to whoever can read the gist, not only its author: how a shared document
// changed is part of reading it. A private gist's history is private with it, which
// the SQL function decides rather than this handler.
func (a *API) ListRevisions(w http.ResponseWriter, r *http.Request) {
	revisions, err := a.store.ListRevisions(r.Context(), a.identity(r), r.PathValue("slug"))
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	w.Header().Set("Cache-Control", "private, no-cache")
	a.respond(w, r, http.StatusOK, revisions)
}

// GetRevision handles GET /v1/gists/{slug}/revisions/{revision}.
func (a *API) GetRevision(w http.ResponseWriter, r *http.Request) {
	revision, ok := a.revisionNumber(w, r)
	if !ok {
		return
	}

	stored, err := a.store.GetRevision(r.Context(), a.identity(r), r.PathValue("slug"), revision)
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	w.Header().Set("Cache-Control", "private, no-cache")
	a.respond(w, r, http.StatusOK, stored)
}

// RestoreRevision handles POST /v1/gists/{slug}/revisions/{revision}/restore.
//
// It answers with the gist as it now stands, which is what the caller needs next,
// and leaves behind a revision of the state it replaced. Restoring is therefore
// undoable by restoring again.
func (a *API) RestoreRevision(w http.ResponseWriter, r *http.Request) {
	id, ok := a.requireIdentity(w, r)
	if !ok {
		return
	}

	revision, ok := a.revisionNumber(w, r)
	if !ok {
		return
	}

	gist, err := a.store.RestoreRevision(r.Context(), id, r.PathValue("slug"), revision)
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	a.respond(w, r, http.StatusOK, a.view(r.Context(), gist))
}

// revisionNumber reads the path's revision, writing the error response itself.
func (a *API) revisionNumber(w http.ResponseWriter, r *http.Request) (int, bool) {
	revision, err := strconv.Atoi(r.PathValue("revision"))
	if err != nil || revision < 1 {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidRequest,
			errors.New("a revision is a positive whole number"))
		return 0, false
	}
	return revision, true
}
