package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	firebase "firebase.google.com/go"
	"github.com/julienschmidt/httprouter"
	"google.golang.org/api/iterator"
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
		UserId      string    `json:"userId,omitempty"`
		FileName    string    `json:"fileName,omitempty"`
		FileURL     string    `json:"fileURL,omitempty"`
	}{
		SnippetId:   snippetId,
		Title:       fmt.Sprintf("%v", data["title"]),
		Description: fmt.Sprintf("%v", data["description"]),
		Content:     fmt.Sprintf("%v", data["content"]),
		IsDraft:     data["isDraft"].(bool),
		CreatedAt:   data["createdAt"].(time.Time),
	}

	// Add optional fields if they exist
	if userId, ok := data["userId"].(string); ok {
		response.UserId = userId
	}
	if fileName, ok := data["fileName"].(string); ok {
		response.FileName = fileName
	}

	// Use public URL if available, otherwise construct it
	if publicFileURL, ok := data["publicFileURL"].(string); ok {
		response.FileURL = publicFileURL
	} else if _, ok := data["fileName"].(string); ok {
		// Fallback for older entries that don't have publicFileURL
		response.FileURL = fmt.Sprintf("/files/%s/%s",
			snippetId,
			url.PathEscape(data["fileName"].(string)))
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
func (app *application) serveFile(w http.ResponseWriter, r *http.Request) {
	params := httprouter.ParamsFromContext(r.Context())
	snippetId := params.ByName("snippetId")
	filepath := params.ByName("filepath")

	// Remove leading slash from filepath
	filepath = strings.TrimPrefix(filepath, "/")

	if snippetId == "" || filepath == "" {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	// Get the snippet to verify it exists and get the real file URL
	ctx := r.Context()
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
	fileURL, ok := data["fileURL"].(string)
	if !ok {
		app.notFound(w)
		return
	}

	// Fetch the file from Firebase
	resp, err := http.Get(fileURL)
	if err != nil {
		app.serverError(w, err)
		return
	}
	defer resp.Body.Close()

	// Copy the content type
	contentType := resp.Header.Get("Content-Type")
	if contentType != "" {
		w.Header().Set("Content-Type", contentType)
	}

	// Set filename for download if present in original response
	if cd := resp.Header.Get("Content-Disposition"); cd != "" {
		w.Header().Set("Content-Disposition", cd)
	}

	// Copy the file to the response
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		app.serverError(w, err)
		return
	}
}
func (app *application) gistCreate(w http.ResponseWriter, r *http.Request) {
	// Parse the multipart form data
	err := r.ParseMultipartForm(10 << 20) // 10 MB max
	if err != nil {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	description := r.FormValue("description")
	content := r.FormValue("content")
	isDraft := r.FormValue("isDraft") == "true"
	userId := r.FormValue("userId")

	if title == "" || content == "" {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	ctx := context.Background()

	// Generate a new document ID
	docRef := app.firestore.Collection("userSnippets").NewDoc()

	userSnippets := map[string]interface{}{
		"title":       title,
		"description": description,
		"content":     content,
		"isDraft":     isDraft,
		"createdAt":   time.Now(),
	}

	// Add userId to the document if it's provided
	if userId != "" {
		userSnippets["userId"] = userId
	}

	// Handle file upload
	file, header, err := r.FormFile("file")
	if err == nil {
		defer file.Close()

		// Initialize Firebase app if not already done
		config := &firebase.Config{
			StorageBucket: "quickgists.appspot.com",
		}
		firebaseApp, err := firebase.NewApp(ctx, config)
		if err != nil {
			app.serverError(w, err)
			return
		}

		// Get Firebase Storage client
		client, err := firebaseApp.Storage(ctx)
		if err != nil {
			app.serverError(w, err)
			return
		}

		// Get bucket handle
		bucket, err := client.DefaultBucket()
		if err != nil {
			app.serverError(w, err)
			return
		}

		// Create a unique filename
		filename := fmt.Sprintf("quickgist-user-files/%s/%s", docRef.ID, header.Filename)
		obj := bucket.Object(filename)

		// Create a new storage object writer
		writer := obj.NewWriter(ctx)

		// Copy the file data to the object
		if _, err := io.Copy(writer, file); err != nil {
			app.serverError(w, err)
			return
		}

		// Close the writer
		if err := writer.Close(); err != nil {
			app.serverError(w, err)
			return
		}

		// Get the object attributes
		attrs, err := obj.Attrs(ctx)
		if err != nil {
			app.serverError(w, err)
			return
		}

		// Construct the Firebase Storage URL
		fileURL := fmt.Sprintf("https://firebasestorage.googleapis.com/v0/b/%s/o/%s?generation=%d&alt=media",
			"quickgists.appspot.com",
			url.QueryEscape(filename),
			attrs.Generation)

		// Create proxy URL
		proxyURL := fmt.Sprintf("/files/%s/%s",
			docRef.ID,
			url.PathEscape(header.Filename))

		// Store both URLs and filename
		userSnippets["fileName"] = header.Filename
		userSnippets["fileURL"] = fileURL        // Original Firebase URL (for internal use)
		userSnippets["publicFileURL"] = proxyURL // Public URL for clients
	}

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
		UserId      string    `json:"userId,omitempty"`
		FileName    string    `json:"fileName,omitempty"`
		FileURL     string    `json:"fileURL,omitempty"`
	}{
		SnippetId:   docRef.ID,
		Title:       title,
		Description: description,
		Content:     content,
		IsDraft:     isDraft,
		CreatedAt:   userSnippets["createdAt"].(time.Time),
		UserId:      userId,
	}

	if fileName, ok := userSnippets["fileName"].(string); ok {
		response.FileName = fileName
	}
	if publicFileURL, ok := userSnippets["publicFileURL"].(string); ok {
		response.FileURL = publicFileURL
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}
func (app *application) userGists(w http.ResponseWriter, r *http.Request) {
	userId := r.URL.Query().Get("userId")
	if userId == "" {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	iter := app.firestore.Collection("userSnippets").Where("userId", "==", userId).Documents(ctx)
	var gists []map[string]interface{}

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			app.serverError(w, err)
			return
		}

		data := doc.Data()
		gist := map[string]interface{}{
			"snippetId":   doc.Ref.ID,
			"title":       data["title"],
			"description": data["description"],
			"content":     data["content"],
			"isDraft":     data["isDraft"],
			"createdAt":   data["createdAt"],
		}

		// Add file information if it exists
		if fileName, ok := data["fileName"].(string); ok {
			gist["fileName"] = fileName
			// Use public URL if available, otherwise construct it
			if publicFileURL, ok := data["publicFileURL"].(string); ok {
				gist["fileURL"] = publicFileURL
			} else {
				gist["fileURL"] = fmt.Sprintf("/files/%s/%s",
					doc.Ref.ID,
					url.PathEscape(fileName))
			}
		}

		gists = append(gists, gist)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(gists)
}
func (app *application) healthCheck(w http.ResponseWriter, r *http.Request) {
	status := map[string]string{
		"status": "available",
	}

	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodHead {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.WriteHeader(http.StatusOK)
	err := json.NewEncoder(w).Encode(status)
	if err != nil {
		app.serverError(w, err)
		return
	}
}
