// Upload and raw-download handlers for gist files.
package api

import (
	"errors"
	"io"
	"net/http"
	"strconv"

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

	files := appendUpload(gist.Files, store.NewFile{
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
func (a *API) ownedGist(r *http.Request, id *auth.Identity, slug string) (*store.Gist, error) {
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
func appendUpload(existing []store.File, added store.NewFile) []store.NewFile {
	files := make([]store.NewFile, 0, len(existing)+1)

	for _, f := range existing {
		files = append(files, store.NewFile{
			Filename:    f.Filename,
			Language:    f.Language,
			Content:     f.Content,
			StoragePath: f.StoragePath,
			ByteSize:    f.ByteSize,
		})
	}

	return append(files, added)
}

// RawFile handles GET /v1/gists/{slug}/raw/{filename...}.
//
// Text is served from Postgres and an upload is streamed from the private bucket.
// Either way the gist's visibility is checked first, which a public bucket would
// have made impossible.
//
// The previous equivalent fetched whatever URL was stored on the record with no
// check that it pointed at our own bucket, one bad write away from a server-side
// request forgery. Here the only input is a storage key and the host is ours by
// construction.
func (a *API) RawFile(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	requested, err := safeFilename(r.PathValue("filename"))
	if err != nil {
		a.fail(w, r, http.StatusBadRequest, codeInvalidFilename, err)
		return
	}

	gist, err := a.store.GetGist(r.Context(), a.identity(r), slug)
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	for _, f := range gist.Files {
		if f.Filename != requested {
			continue
		}
		if f.Content != nil {
			a.serveText(w, r, requested, *f.Content)
			return
		}
		if f.StoragePath != nil {
			a.streamBlob(w, r, requested, *f.StoragePath)
			return
		}
	}

	a.fail(w, r, http.StatusNotFound, codeNotFound, nil)
}

// serveText writes a text file's source.
//
// The type is always text/plain. Serving a shared .html or .svg as its own type
// would run the author's markup on this origin, which is stored cross-site
// scripting with extra steps.
func (a *API) serveText(w http.ResponseWriter, r *http.Request, filename, content string) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Content-Disposition", contentDisposition(filename))
	w.Header().Set("Content-Length", strconv.Itoa(len(content)))
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "private, no-cache")
	w.WriteHeader(http.StatusOK)

	if _, err := io.WriteString(w, content); err != nil {
		a.log.DebugContext(r.Context(), "client closed connection mid-file", "error", err)
	}
}

// streamBlob proxies an upload out of the bucket, never as an executable type.
func (a *API) streamBlob(w http.ResponseWriter, r *http.Request, filename, objectPath string) {
	object, err := a.blobs.Open(r.Context(), objectPath)
	if err != nil {
		a.failBlobOpen(w, r, objectPath, err)
		return
	}
	defer func() { _ = object.Close() }()

	w.Header().Set("Content-Type", downloadContentType(object.ContentType, filename))
	w.Header().Set("Content-Disposition", contentDisposition(filename))
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "private, max-age=300")

	if object.ETag != "" {
		w.Header().Set("ETag", object.ETag)
	}
	if object.ContentLength > 0 {
		w.Header().Set("Content-Length", strconv.FormatInt(object.ContentLength, 10))
	}

	w.WriteHeader(http.StatusOK)
	if _, err := io.Copy(w, object.Body); err != nil {
		a.log.DebugContext(r.Context(), "stream interrupted", "path", objectPath, "error", err)
	}
}

// failBlobOpen answers a failed bucket read.
//
// A missing object behind a live row is logged as an error because the janitor
// cannot repair it: the row still references the path, so nothing enqueues it.
func (a *API) failBlobOpen(w http.ResponseWriter, r *http.Request, objectPath string, err error) {
	if errors.Is(err, blob.ErrNotFound) {
		a.log.ErrorContext(r.Context(), "a file row references a missing object", "path", objectPath)
		a.fail(w, r, http.StatusNotFound, codeNotFound, err)
		return
	}
	a.fail(w, r, http.StatusBadGateway, codeStorageUnavailable, err)
}
