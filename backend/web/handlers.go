package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"github.com/julienschmidt/httprouter"
	"google.golang.org/api/iterator"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Constants
const (
	maxFileSize    = 10 << 20 // 10 MB
	maxContentSize = 1 << 20  // 1 MB
	bucketName     = "quickgists.appspot.com"
	fileURLPattern = "/files/%s/%s"
)

// Response types
type GistResponse struct {
	SnippetID   string    `json:"snippetId"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Content     string    `json:"content"`
	IsDraft     bool      `json:"isDraft"`
	CreatedAt   time.Time `json:"createdAt"`
	UserID      string    `json:"userId,omitempty"`
	FileName    string    `json:"fileName,omitempty"`
	FileURL     string    `json:"fileURL,omitempty"`
}

// Custom errors
var (
	ErrInvalidRequest = errors.New("invalid request parameters")
	ErrUnauthorized   = errors.New("unauthorized access")
	ErrNotFound       = errors.New("resource not found")
)

func (app *application) home(w http.ResponseWriter, r *http.Request) {
	app.respondJSON(w, http.StatusOK, map[string]string{
		"message": "Hello from QuickGist!",
		"version": "2.0.0",
	})
}

func (app *application) gistView(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	params := httprouter.ParamsFromContext(ctx)
	snippetID := params.ByName("id")

	if snippetID == "" {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	// Sanitize the snippet ID
	snippetID = strings.TrimSpace(snippetID)
	doc, err := app.firestore.Collection("userSnippets").Doc(snippetID).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			app.notFound(w)
		} else {
			app.serverError(w, err)
		}
		return
	}

	data := doc.Data()
	response := GistResponse{
		SnippetID:   snippetID,
		Title:       app.sanitizeString(data["title"]),
		Description: app.sanitizeString(data["description"]),
		Content:     app.sanitizeString(data["content"]),
		IsDraft:     data["isDraft"].(bool),
		CreatedAt:   data["createdAt"].(time.Time),
	}

	if userID, ok := data["userId"].(string); ok {
		response.UserID = userID
	}
	if fileName, ok := data["fileName"].(string); ok {
		response.FileName = fileName
	}
	if publicFileURL, ok := data["publicFileURL"].(string); ok {
		response.FileURL = publicFileURL
	} else if response.FileName != "" {
		response.FileURL = fmt.Sprintf(fileURLPattern,
			snippetID,
			url.PathEscape(response.FileName))
	}

	app.respondJSON(w, http.StatusOK, response)
}

func (app *application) serveFile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	params := httprouter.ParamsFromContext(ctx)
	snippetID := params.ByName("snippetId")
	filepath := params.ByName("filepath")

	filepath = path.Clean(strings.TrimPrefix(filepath, "/"))
	if snippetID == "" || filepath == "" {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	doc, err := app.firestore.Collection("userSnippets").Doc(snippetID).Get(ctx)
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

	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fileURL, nil)
	if err != nil {
		app.serverError(w, err)
		return
	}

	resp, err := client.Do(req)
	if err != nil {
		app.serverError(w, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		app.serverError(w, fmt.Errorf("failed to fetch file: %d", resp.StatusCode))
		return
	}

	// Set security headers
	w.Header().Set("Content-Security-Policy", "default-src 'self'")
	w.Header().Set("X-Content-Type-Options", "nosniff")

	// Copy content type and disposition
	if ct := resp.Header.Get("Content-Type"); ct != "" {
		w.Header().Set("Content-Type", ct)
	}
	if cd := resp.Header.Get("Content-Disposition"); cd != "" {
		w.Header().Set("Content-Disposition", cd)
	} else {
		// Set a default content disposition if none provided
		w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=%q", filepath))
	}

	// Set caching headers
	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.Header().Set("ETag", resp.Header.Get("ETag"))
	w.Header().Set("Last-Modified", resp.Header.Get("Last-Modified"))

	// Copy the Content-Length header if available
	if cl := resp.Header.Get("Content-Length"); cl != "" {
		w.Header().Set("Content-Length", cl)
	}

	// Stream the file content
	w.WriteHeader(http.StatusOK)
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		// Log the error but don't send it to the client as we've already started sending the response
		app.errorLog.Printf("Error streaming file: %v", err)
	}
}

func (app *application) gistCreate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Limit request size and parse form
	r.Body = http.MaxBytesReader(w, r.Body, maxFileSize)
	if err := r.ParseMultipartForm(maxFileSize); err != nil {
		app.clientError(w, http.StatusBadRequest)
		return
	}
	defer r.MultipartForm.RemoveAll()

	// Validate input
	title := strings.TrimSpace(r.FormValue("title"))
	description := strings.TrimSpace(r.FormValue("description"))
	content := strings.TrimSpace(r.FormValue("content"))
	isDraft := r.FormValue("isDraft") == "true"
	userID := strings.TrimSpace(r.FormValue("userId"))

	if title == "" || content == "" || len(content) > maxContentSize {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	// Create new document
	docRef := app.firestore.Collection("userSnippets").NewDoc()
	gist := map[string]interface{}{
		"title":       title,
		"description": description,
		"content":     content,
		"isDraft":     isDraft,
		"createdAt":   time.Now().UTC(),
	}

	if userID != "" {
		gist["userId"] = userID
	}

	// Handle file upload if present
	if file, header, err := r.FormFile("file"); err == nil {
		if err := app.handleFileUpload(ctx, file, header, docRef.ID, gist); err != nil {
			app.serverError(w, err)
			return
		}
	}

	// Save to Firestore
	if _, err := docRef.Set(ctx, gist); err != nil {
		app.serverError(w, err)
		return
	}

	// Prepare response
	response := GistResponse{
		SnippetID:   docRef.ID,
		Title:       title,
		Description: description,
		Content:     content,
		IsDraft:     isDraft,
		CreatedAt:   gist["createdAt"].(time.Time),
		UserID:      userID,
	}

	if fileName, ok := gist["fileName"].(string); ok {
		response.FileName = fileName
	}
	if publicFileURL, ok := gist["publicFileURL"].(string); ok {
		response.FileURL = publicFileURL
	}

	app.respondJSON(w, http.StatusCreated, response)
}

func (app *application) userGists(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := strings.TrimSpace(r.URL.Query().Get("userId"))

	if userID == "" {
		app.clientError(w, http.StatusBadRequest)
		return
	}

	iter := app.firestore.Collection("userSnippets").
		Where("userId", "==", userID).
		OrderBy("createdAt", firestore.Desc).
		Limit(100).
		Documents(ctx)

	var gists []GistResponse
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
		gist := GistResponse{
			SnippetID:   doc.Ref.ID,
			Title:       app.sanitizeString(data["title"]),
			Description: app.sanitizeString(data["description"]),
			Content:     app.sanitizeString(data["content"]),
			IsDraft:     data["isDraft"].(bool),
			CreatedAt:   data["createdAt"].(time.Time),
		}

		if fileName, ok := data["fileName"].(string); ok {
			gist.FileName = fileName
			if publicFileURL, ok := data["publicFileURL"].(string); ok {
				gist.FileURL = publicFileURL
			} else {
				gist.FileURL = fmt.Sprintf(fileURLPattern,
					doc.Ref.ID,
					url.PathEscape(fileName))
			}
		}

		gists = append(gists, gist)
	}

	app.respondJSON(w, http.StatusOK, gists)
}

func (app *application) healthCheck(w http.ResponseWriter, r *http.Request) {
	status := struct {
		Status    string `json:"status"`
		Timestamp string `json:"timestamp"`
		Version   string `json:"version"`
	}{
		Status:    "available",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Version:   "1.0.0",
	}

	if r.Method == http.MethodHead {
		w.WriteHeader(http.StatusOK)
		return
	}

	app.respondJSON(w, http.StatusOK, status)
}

// Helper methods
func (app *application) handleFileUpload(ctx context.Context, file io.ReadCloser, header *multipart.FileHeader, docID string, gist map[string]interface{}) error {
	defer file.Close()

	if header.Size > maxFileSize {
		return ErrInvalidRequest
	}

	config := &firebase.Config{
		StorageBucket: bucketName,
	}
	firebaseApp, err := firebase.NewApp(ctx, config)
	if err != nil {
		return err
	}

	client, err := firebaseApp.Storage(ctx)
	if err != nil {
		return err
	}

	bucket, err := client.DefaultBucket()
	if err != nil {
		return err
	}

	filename := fmt.Sprintf("quickgist-user-files/%s/%s", docID, header.Filename)
	obj := bucket.Object(filename)
	writer := obj.NewWriter(ctx)

	if _, err := io.Copy(writer, file); err != nil {
		writer.Close()
		return err
	}

	if err := writer.Close(); err != nil {
		return err
	}

	attrs, err := obj.Attrs(ctx)
	if err != nil {
		return err
	}

	fileURL := fmt.Sprintf("https://firebasestorage.googleapis.com/v0/b/%s/o/%s?generation=%d&alt=media",
		bucketName,
		url.QueryEscape(filename),
		attrs.Generation)

	proxyURL := fmt.Sprintf(fileURLPattern,
		docID,
		url.PathEscape(header.Filename))

	gist["fileName"] = header.Filename
	gist["fileURL"] = fileURL
	gist["publicFileURL"] = proxyURL

	return nil
}

func (app *application) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (app *application) sanitizeString(v interface{}) string {
	if v == nil {
		return ""
	}
	return strings.TrimSpace(fmt.Sprintf("%v", v))
}
