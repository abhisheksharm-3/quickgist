package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", home)
	mux.HandleFunc("/gist/view", gistView)
	mux.HandleFunc("/gist/create", gistCreate)
	log.Print("Server started on localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
