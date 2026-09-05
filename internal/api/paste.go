// The paste endpoint: create a gist from a raw body and answer with its URL.
package api

import (
	"errors"
	"github.com/abhisheksharm-3/quickgist/internal/domain"
	"io"
	"net/http"
	"strconv"
	"time"
)

// Paste handles POST /v1/paste.
//
// It exists so a shell can use this service without composing JSON:
//
//	cat notes.md | curl --data-binary @- 'https://api/v1/paste?filename=notes.md'
//
// The body is the file and the response is the link, as text with a trailing
// newline, so it can be piped into pbcopy or read by a human. Everything else is a
// query parameter with a default, because a pipe has nowhere to put a payload.
func (a *API) Paste(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	filename, err := pasteFilename(query.Get("filename"))
	if err != nil {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidFilename, err)
		return
	}

	visibility, err := resolveVisibility(query.Get("visibility"))
	if err != nil {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidRequest, err)
		return
	}

	identity := a.identity(r)
	if visibility == domain.VisibilityPrivate && identity == nil {
		a.fail(w, r, http.StatusUnauthorized, codeUnauthenticated, nil)
		return
	}

	expiresAt, err := pasteExpiry(query.Get("expires"))
	if err != nil {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidRequest, err)
		return
	}

	content, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxTextFileSize))
	if err != nil {
		a.fail(w, r, http.StatusRequestEntityTooLarge, codeBodyTooLarge, err)
		return
	}
	if len(content) == 0 {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidRequest, errors.New("the body is empty"))
		return
	}

	title := query.Get("title")
	if title == "" {
		title = filename
	}

	gist, err := a.store.CreateGist(r.Context(), identity, domain.CreateGistInput{
		Title:      title,
		Visibility: visibility,
		ExpiresAt:  expiresAt,
		Files: []domain.NewFile{{
			Filename: filename,
			Content:  ptr(string(content)),
			ByteSize: int64(len(content)),
		}},
	})
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	url := a.cfg.PublicBaseURL + "/g/" + gist.Slug

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Location", url)
	w.WriteHeader(http.StatusCreated)

	if _, err := io.WriteString(w, url+"\n"); err != nil {
		a.log.DebugContext(r.Context(), "client closed connection before the link", "error", err)
	}
}

// pasteFilename validates the requested name, defaulting to Markdown.
//
// Markdown is the default because an extensionless name renders as plain text, and
// somebody piping a file into this service is far likelier to be sending notes than
// a file whose type they want ignored.
func pasteFilename(name string) (string, error) {
	if name == "" {
		return defaultPasteFilename, nil
	}
	return safeFilename(name)
}

// pasteExpiry reads the optional lifetime in days.
func pasteExpiry(value string) (*time.Time, error) {
	if value == "" {
		return nil, nil
	}

	days, err := strconv.Atoi(value)
	if err != nil || days < 1 || days > maxPasteExpiryDays {
		return nil, errors.New("expires must be a whole number of days between 1 and 365")
	}

	at := time.Now().Add(time.Duration(days) * 24 * time.Hour)
	return &at, nil
}

// ptr returns a pointer to a value, for the optional fields the store takes.
func ptr[T any](value T) *T { return &value }
