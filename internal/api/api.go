// Package api is the HTTP layer. It translates requests into store calls and holds
// no authorization logic of its own, because every permission decision belongs to
// the database.
package api

import (
	"log/slog"
	"net/http"

	"github.com/abhisheksharm-3/quickgist/internal/auth"
	"github.com/abhisheksharm-3/quickgist/internal/blob"
	"github.com/abhisheksharm-3/quickgist/internal/card"
	"github.com/abhisheksharm-3/quickgist/internal/config"
	"github.com/abhisheksharm-3/quickgist/internal/render"
	"github.com/abhisheksharm-3/quickgist/internal/store"
)

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

// New builds the API.
//
// The highlight stylesheet is generated once here because it depends only on the
// renderer, so no request ever pays to produce it.
func New(
	cfg *config.Config,
	st *store.Store,
	blobs *blob.Store,
	renderer *render.Renderer,
	verifier *auth.Verifier,
	log *slog.Logger,
	version string,
) (*API, error) {
	css, err := renderer.CSS()
	if err != nil {
		return nil, err
	}

	cards, err := card.New()
	if err != nil {
		return nil, err
	}

	return &API{
		cfg:            cfg,
		store:          st,
		blobs:          blobs,
		renderer:       renderer,
		cards:          cards,
		verifier:       verifier,
		log:            log,
		version:        version,
		css:            css,
		previewLimiter: newLimiter(previewRateLimitRPS, previewRateLimitBurst),
	}, nil
}

// identity returns the verified caller, or nil for an anonymous request.
func (a *API) identity(r *http.Request) *auth.Identity {
	if id, ok := auth.FromContext(r.Context()); ok {
		return &id
	}
	return nil
}

// requireIdentity returns the verified caller, or writes 401 and reports false.
func (a *API) requireIdentity(w http.ResponseWriter, r *http.Request) (*auth.Identity, bool) {
	id := a.identity(r)
	if id == nil {
		a.fail(w, r, http.StatusUnauthorized, codeUnauthenticated, nil)
		return nil, false
	}
	return id, true
}
