package handler

import (
	"net/http"
	"time"
)

const version = "2.0.0"

// Home handles the root endpoint.
func (h *Handler) Home(w http.ResponseWriter, r *http.Request) {
	h.respondJSON(w, http.StatusOK, HomeResponse{
		Message: "Hello from QuickGist!",
		Version: version,
	})
}

// Health handles the health check endpoint.
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodHead {
		w.WriteHeader(http.StatusOK)
		return
	}

	h.respondJSON(w, http.StatusOK, HealthResponse{
		Status:    "available",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Version:   version,
	})
}
