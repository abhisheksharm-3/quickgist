package handler

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/julienschmidt/httprouter"

	"github.com/abhisheksharm-3/quickgist/internal/apperror"
	"github.com/abhisheksharm-3/quickgist/internal/model"
)

const (
	maxFileSize    = 10 << 20
	maxContentSize = 1 << 20
	fileURLPattern = "/files/%s/%s"
	cacheTTL       = 5 * time.Minute
)

// View handles GET /gist/view/:id
func (h *Handler) View(w http.ResponseWriter, r *http.Request) {
	params := httprouter.ParamsFromContext(r.Context())
	id := strings.TrimSpace(params.ByName("id"))

	if id == "" {
		h.respondError(w, apperror.BadRequest("gist ID is required"))
		return
	}

	if cached, ok := h.cache.Get(id); ok {
		h.respondJSON(w, http.StatusOK, h.gistToResponse(cached))
		return
	}

	gist, err := h.repo.Get(r.Context(), id)
	if err != nil {
		h.respondError(w, err)
		return
	}

	h.cache.Set(id, gist, cacheTTL)
	h.respondJSON(w, http.StatusOK, h.gistToResponse(gist))
}

// Create handles POST /gist/create
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxFileSize)
	if err := r.ParseMultipartForm(maxFileSize); err != nil {
		h.respondError(w, apperror.BadRequest("request too large or invalid form"))
		return
	}
	defer r.MultipartForm.RemoveAll()

	title := strings.TrimSpace(r.FormValue("title"))
	description := strings.TrimSpace(r.FormValue("description"))
	content := strings.TrimSpace(r.FormValue("content"))
	isDraft := r.FormValue("isDraft") == "true"
	userID := strings.TrimSpace(r.FormValue("userId"))

	if title == "" {
		h.respondError(w, apperror.Validation("title is required"))
		return
	}
	if content == "" {
		h.respondError(w, apperror.Validation("content is required"))
		return
	}
	if len(content) > maxContentSize {
		h.respondError(w, apperror.Validation("content exceeds maximum size"))
		return
	}

	gist := model.NewGist(title, description, content, isDraft)
	if userID != "" {
		gist.WithUser(userID)
	}

	id, err := h.repo.Create(r.Context(), gist)
	if err != nil {
		h.respondError(w, err)
		return
	}
	gist.ID = id

	file, header, err := r.FormFile("file")
	if err == nil {
		defer file.Close()
		
		if header.Size > maxFileSize {
			h.respondError(w, apperror.Validation("file exceeds maximum size"))
			return
		}

		fileInfo, err := h.storage.Upload(r.Context(), id, header.Filename, file, header.Size)
		if err != nil {
			h.errorLog.Printf("file upload failed: %v", err)
		} else {
			gist.WithFile(fileInfo.FileName, fileInfo.FileURL, fileInfo.PublicFileURL)
			if err := h.repo.Update(r.Context(), gist); err != nil {
				h.errorLog.Printf("failed to update gist with file info: %v", err)
			}
		}
	}

	h.respondJSON(w, http.StatusCreated, h.gistToResponse(gist))
}

// ListByUser handles GET /gist/user-gists
func (h *Handler) ListByUser(w http.ResponseWriter, r *http.Request) {
	userID := strings.TrimSpace(r.URL.Query().Get("userId"))

	if userID == "" {
		h.respondError(w, apperror.BadRequest("userId is required"))
		return
	}

	gists, err := h.repo.ListByUser(r.Context(), userID, 100)
	if err != nil {
		h.respondError(w, err)
		return
	}

	responses := make([]GistResponse, len(gists))
	for i, g := range gists {
		responses[i] = h.gistToResponse(g)
	}

	h.respondJSON(w, http.StatusOK, responses)
}

func (h *Handler) gistToResponse(g *model.Gist) GistResponse {
	resp := GistResponse{
		SnippetID:   g.ID,
		Title:       g.Title,
		Description: g.Description,
		Content:     g.Content,
		IsDraft:     g.IsDraft,
		CreatedAt:   g.CreatedAt,
		UserID:      g.UserID,
		FileName:    g.FileName,
	}

	if g.PublicFileURL != "" {
		resp.FileURL = g.PublicFileURL
	} else if g.FileName != "" {
		resp.FileURL = fmt.Sprintf(fileURLPattern, g.ID, url.PathEscape(g.FileName))
	}

	return resp
}
