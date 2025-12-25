package handler

import "time"

// GistResponse represents a gist in API responses.
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

// CreateGistRequest represents the request to create a gist.
type CreateGistRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Content     string `json:"content"`
	IsDraft     bool   `json:"isDraft"`
	UserID      string `json:"userId"`
}

// ErrorResponse represents an error in API responses.
type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// HealthResponse represents the health check response.
type HealthResponse struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
	Version   string `json:"version"`
}

// HomeResponse represents the home endpoint response.
type HomeResponse struct {
	Message string `json:"message"`
	Version string `json:"version"`
}
