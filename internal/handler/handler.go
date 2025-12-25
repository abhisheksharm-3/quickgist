package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/abhisheksharm-3/quickgist/internal/apperror"
	"github.com/abhisheksharm-3/quickgist/internal/cache"
	"github.com/abhisheksharm-3/quickgist/internal/repository"
	"github.com/abhisheksharm-3/quickgist/internal/storage"
)

// Handler holds dependencies for HTTP handlers.
type Handler struct {
	repo     repository.GistRepository
	storage  storage.FileStorage
	cache    cache.Cache
	infoLog  *log.Logger
	errorLog *log.Logger
}

// New creates a new Handler with the given dependencies.
func New(
	repo repository.GistRepository,
	storage storage.FileStorage,
	cache cache.Cache,
	infoLog *log.Logger,
	errorLog *log.Logger,
) *Handler {
	return &Handler{
		repo:     repo,
		storage:  storage,
		cache:    cache,
		infoLog:  infoLog,
		errorLog: errorLog,
	}
}

// respondJSON writes a JSON response.
func (h *Handler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// respondError writes an error response.
func (h *Handler) respondError(w http.ResponseWriter, err error) {
	status := apperror.StatusCode(err)
	
	var appErr *apperror.Error
	if e, ok := err.(*apperror.Error); ok {
		appErr = e
	} else {
		appErr = apperror.Internal(err)
	}

	if status >= 500 {
		h.errorLog.Printf("internal error: %v", err)
	}

	h.respondJSON(w, status, ErrorResponse{
		Code:    appErr.Code,
		Message: appErr.Message,
	})
}

// clientError writes a client error response.
func (h *Handler) clientError(w http.ResponseWriter, status int) {
	http.Error(w, http.StatusText(status), status)
}
