package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/julienschmidt/httprouter"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (app *application) home(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Hello from QuickGist!"))
}

func (app *application) gistView(w http.ResponseWriter, r *http.Request) {
	params := httprouter.ParamsFromContext(r.Context())
	snippetId := params.ByName("id")
	if snippetId == "" {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	doc, err := app.firestore.Collection("gists").Doc(snippetId).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			app.notFound(w)
		} else {
			app.serverError(w, err)
		}
		return
	}

	data := doc.Data()

	response := struct {
		SnippetId string `json:"snippetId"`
		Content   string `json:"content"`
	}{
		SnippetId: snippetId,
		Content:   fmt.Sprintf("%v", data["content"]),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (app *application) gistCreate(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Content   string `json:"content"`
		SnippetId string `json:"snippetId"`
	}

	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	if input.Content == "" || input.SnippetId == "" {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	_, err = app.firestore.Collection("gists").Doc(input.SnippetId).Set(ctx, map[string]interface{}{
		"content": input.Content,
	})
	if err != nil {
		app.serverError(w, err)
		return
	}

	response := struct {
		SnippetId string `json:"snippetId"`
		Content   string `json:"content"`
	}{
		SnippetId: input.SnippetId,
		Content:   input.Content,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}
