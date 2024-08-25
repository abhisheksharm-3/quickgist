package main

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
	"github.com/justinas/alice"
)

// The routes() method returns a servemux containing our application routes.
func (app *application) routes() http.Handler {
	router := httprouter.New()
	router.NotFound = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		app.notFound(w)
	})
	router.HandlerFunc(http.MethodGet, "/", app.home)
	router.HandlerFunc(http.MethodGet, "/gist/view/:id", app.gistView)
	router.HandlerFunc(http.MethodPost, "/gist/create", app.gistCreate)
	router.HandlerFunc(http.MethodGet, "/gist/user-gists", app.userGists)
	standard := alice.New(app.recoverPanic, app.logRequest, secureHeaders, app.enableCORS)
	return standard.Then(router)
}
