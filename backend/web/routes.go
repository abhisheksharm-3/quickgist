package main

import "net/http"

// The routes() method returns a servemux containing our application routes.
func (app *application) routes() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", app.home)
	mux.HandleFunc("/gist/view", app.gistView)
	mux.HandleFunc("/gist/create", app.gistCreate)
	return mux
}
