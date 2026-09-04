// The endpoint describing the signed-in caller.
package api

import "net/http"

// Me handles GET /v1/me.
//
// It exists so the browser never has to guess who it is. Deriving a handle from
// OAuth metadata in the client is wrong for an account created with a password, and
// wrong again whenever the database de-duplicated the handle.
func (a *API) Me(w http.ResponseWriter, r *http.Request) {
	id, ok := a.requireIdentity(w, r)
	if !ok {
		return
	}

	profile, err := a.store.MyProfile(r.Context(), id)
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	w.Header().Set("Cache-Control", "private, no-store")
	a.respond(w, r, http.StatusOK, profile)
}
