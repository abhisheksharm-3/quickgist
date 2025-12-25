package server

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func (s *Server) routes() http.Handler {
	router := httprouter.New()

	router.NotFound = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
	})

	router.HandlerFunc(http.MethodGet, "/", s.handler.Home)
	router.HandlerFunc(http.MethodGet, "/health", s.handler.Health)
	router.HandlerFunc(http.MethodHead, "/health", s.handler.Health)

	router.HandlerFunc(http.MethodGet, "/gist/view/:id", s.handler.View)
	router.HandlerFunc(http.MethodPost, "/gist/create", s.handler.Create)
	router.HandlerFunc(http.MethodGet, "/gist/user-gists", s.handler.ListByUser)

	router.HandlerFunc(http.MethodGet, "/files/:snippetId/*filepath", s.handler.ServeFile)

	return router
}
