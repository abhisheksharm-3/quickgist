package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

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
	doc, err := app.firestore.Collection("userSnippets").Doc(snippetId).Get(ctx)
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
		SnippetId   string    `json:"snippetId"`
		Title       string    `json:"title"`
		Description string    `json:"description"`
		Content     string    `json:"content"`
		IsDraft     bool      `json:"isDraft"`
		CreatedAt   time.Time `json:"createdAt"`
	}{
		SnippetId:   snippetId,
		Title:       fmt.Sprintf("%v", data["title"]),
		Description: fmt.Sprintf("%v", data["description"]),
		Content:     fmt.Sprintf("%v", data["content"]),
		IsDraft:     data["isDraft"].(bool),
		CreatedAt:   data["createdAt"].(time.Time),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (app *application) gistCreate(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Content     string `json:"content"`
		IsDraft     bool   `json:"isDraft"`
		userId      string `json:"userId"`
	}

	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	if input.Title == "" || input.Content == "" {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	ctx := context.Background()

	// Generate a new document ID
	docRef := app.firestore.Collection("userSnippets").NewDoc()

	userSnippets := map[string]interface{}{
		"title":       input.Title,
		"description": input.Description,
		"content":     input.Content,
		"isDraft":     input.IsDraft,
		"createdAt":   time.Now(),
	}

	// Add userId to the document if it's provided
	if input.userId != "" {
		userSnippets["userId"] = input.userId
	}
	fmt.Println(input)

	_, err = docRef.Set(ctx, userSnippets)
	if err != nil {
		app.serverError(w, err)
		return
	}

	response := struct {
		SnippetId   string    `json:"snippetId"`
		Title       string    `json:"title"`
		Description string    `json:"description"`
		Content     string    `json:"content"`
		IsDraft     bool      `json:"isDraft"`
		CreatedAt   time.Time `json:"createdAt"`
		userId      string    `json:"userId,omitempty"` // Include userId in response
	}{
		SnippetId:   docRef.ID,
		Title:       input.Title,
		Description: input.Description,
		Content:     input.Content,
		IsDraft:     input.IsDraft,
		CreatedAt:   userSnippets["createdAt"].(time.Time),
		userId:      input.userId,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}
