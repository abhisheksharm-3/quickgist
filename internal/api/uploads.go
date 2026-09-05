// The upload handler: accepting a file into an existing gist.
package api

import (
	"errors"
	"github.com/abhisheksharm-3/quickgist/internal/domain"
	"net/http"

	"github.com/abhisheksharm-3/quickgist/internal/auth"
	"github.com/abhisheksharm-3/quickgist/internal/blob"
	"github.com/abhisheksharm-3/quickgist/internal/store"
)

// UploadFile handles POST /v1/gists/{slug}/files.
//
// Uploads are a separate endpoint so a text gist never touches multipart parsing.
// Retention comes from the optional retentionDays field, capped at 30 days by the
// database whatever a caller asks for.
func (a *API) UploadFile(w http.ResponseWriter, r *http.Request) {
	id, ok := a.requireIdentity(w, r)
	if !ok {
		return
	}

	slug := r.PathValue("slug")

	gist, err := a.ownedGist(r, id, slug)
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}
	if len(gist.Files) >= maxFilesPerGist {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidRequest,
			errors.New("this gist already holds the maximum number of files"))
		return
	}

	if !a.parseUploadForm(w, r) {
		return
	}
	defer func() {
		if r.MultipartForm != nil {
			_ = r.MultipartForm.RemoveAll()
		}
	}()

	retention, err := parseRetentionDays(r.FormValue("retentionDays"))
	if err != nil {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidRequest, err)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		a.fail(w, r, http.StatusBadRequest, codeInvalidRequest, errors.New("a file part is required"))
		return
	}
	defer func() { _ = file.Close() }()

	if header.Size > maxUploadSize {
		a.fail(w, r, http.StatusRequestEntityTooLarge, codeFileTooLarge, nil)
		return
	}

	filename, err := safeFilename(header.Filename)
	if err != nil {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidFilename, err)
		return
	}

	objectPath := blob.ObjectPath(slug, filename)
	if _, err := a.blobs.Upload(r.Context(), objectPath, uploadContentType(filename), file, header.Size); err != nil {
		a.fail(w, r, http.StatusBadGateway, codeStorageUnavailable, err)
		return
	}

	files := appendUpload(gist.Files, domain.NewFile{
		Filename:      filename,
		StoragePath:   &objectPath,
		ByteSize:      header.Size,
		RetentionDays: retention,
	})

	updated, err := a.store.ReplaceFiles(r.Context(), id, slug, files)
	if err != nil {
		a.discardUpload(r, objectPath)
		a.failFromStore(w, r, err)
		return
	}

	a.respond(w, r, http.StatusCreated, a.view(r.Context(), updated))
}

// ownedGist loads a gist the caller may write to.
//
// Ownership is confirmed before a single byte is accepted, because uploading first
// and checking after would let anyone burn storage against someone else's gist.
func (a *API) ownedGist(r *http.Request, id *auth.Identity, slug string) (*domain.Gist, error) {
	gist, err := a.store.GetGist(r.Context(), id, slug)
	if err != nil {
		return nil, err
	}
	if gist.Author == nil || gist.Author.Handle == "" {
		return nil, store.ErrNotFound
	}
	return gist, nil
}

// parseUploadForm reads the multipart body, writing the error response itself.
func (a *API) parseUploadForm(w http.ResponseWriter, r *http.Request) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	if err := r.ParseMultipartForm(multipartMemory); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			a.fail(w, r, http.StatusRequestEntityTooLarge, codeFileTooLarge, err)
			return false
		}
		a.fail(w, r, http.StatusBadRequest, codeInvalidForm, err)
		return false
	}
	return true
}

// discardUpload removes an object whose row was never written.
//
// The janitor only sees paths the database enqueued, so an object that never got a
// row would otherwise be invisible to it and billed forever.
func (a *API) discardUpload(r *http.Request, objectPath string) {
	if err := a.blobs.Delete(r.Context(), objectPath); err != nil {
		a.log.ErrorContext(r.Context(), "could not remove an unreferenced upload",
			"path", objectPath, "error", err)
	}
}

// appendUpload returns the existing file set plus one new upload.
func appendUpload(existing []domain.File, added domain.NewFile) []domain.NewFile {
	files := make([]domain.NewFile, 0, len(existing)+1)

	for _, f := range existing {
		files = append(files, domain.NewFile{
			Filename:    f.Filename,
			Language:    f.Language,
			Content:     f.Content,
			StoragePath: f.StoragePath,
			ByteSize:    f.ByteSize,
		})
	}

	return append(files, added)
}
