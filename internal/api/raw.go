// The raw handler: serving a file's unrendered source, text or upload.
package api

import (
	"errors"
	"io"
	"net/http"
	"strconv"

	"github.com/abhisheksharm-3/quickgist/internal/blob"
)

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
