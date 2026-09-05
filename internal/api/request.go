// Request body and query parsing shared by the handlers.
package api

import (
	"encoding/json"
	"errors"
	"github.com/abhisheksharm-3/quickgist/internal/domain"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// toNewFiles validates a client's file set and converts it for the store.
//
// Both create and replace accept the same shape, so the rules live here once rather
// than being restated per handler.
func toNewFiles(inputs []fileInput) ([]domain.NewFile, error) {
	if len(inputs) == 0 {
		return nil, errors.New("at least one file is required")
	}
	if len(inputs) > maxFilesPerGist {
		return nil, errors.New("a gist takes at most 20 files")
	}

	files := make([]domain.NewFile, 0, len(inputs))
	seen := make(map[string]struct{}, len(inputs))

	for _, in := range inputs {
		name := strings.TrimSpace(in.Filename)
		if name == "" {
			return nil, errors.New("every file needs a filename")
		}
		if _, dup := seen[name]; dup {
			return nil, errors.New("two files share the same name: " + name)
		}
		seen[name] = struct{}{}

		if len(in.Content) > maxTextFileSize {
			return nil, errors.New("file exceeds the 1 MiB text limit: " + name)
		}

		content := in.Content
		files = append(files, domain.NewFile{
			Filename: name,
			Language: in.Language,
			Content:  &content,
			ByteSize: int64(len(content)),
		})
	}

	return files, nil
}

// decodeJSON reads and validates a JSON body, writing the error response itself and
// reporting whether decoding succeeded.
//
// Unknown fields are rejected because they are almost always a client bug or a
// rename, and silently dropping one makes that impossible to notice.
func (a *API) decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	if !a.requireJSONContentType(w, r) {
		return false
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxJSONBody)

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			a.fail(w, r, http.StatusRequestEntityTooLarge, codeBodyTooLarge, err)
			return false
		}
		a.fail(w, r, http.StatusBadRequest, codeInvalidJSON, err)
		return false
	}

	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		a.fail(w, r, http.StatusBadRequest, codeInvalidJSON,
			errors.New("body must be a single JSON object"))
		return false
	}

	return true
}

// requireJSONContentType rejects a body that does not declare itself as JSON.
func (a *API) requireJSONContentType(w http.ResponseWriter, r *http.Request) bool {
	ct := r.Header.Get("Content-Type")
	if ct == "" {
		return true
	}

	if mt := strings.TrimSpace(strings.Split(ct, ";")[0]); mt != "application/json" {
		a.fail(w, r, http.StatusUnsupportedMediaType, codeUnsupportedMedia, nil)
		return false
	}
	return true
}

// pageSize clamps a requested page size into a range the database also enforces.
func pageSize(raw string) int {
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return defaultPageSize
	}
	if n > maxPageSize {
		return maxPageSize
	}
	return n
}

// parseCursor reads a keyset pagination cursor from the query.
//
// Both halves travel together: a timestamp without the slug that goes with it cannot
// order rows created in the same instant, and the page after such a boundary silently
// dropped every one of them.
func parseCursor(q url.Values) (domain.Cursor, error) {
	raw := q.Get("before")
	if raw == "" {
		return domain.Cursor{}, nil
	}

	at, err := time.Parse(time.RFC3339Nano, raw)
	if err != nil {
		return domain.Cursor{}, errors.New("before must be an RFC3339 timestamp")
	}

	cursor := domain.Cursor{Before: &at}

	if slug := q.Get("beforeSlug"); slug != "" {
		if err := validSlug(slug); err != nil {
			return domain.Cursor{}, err
		}
		cursor.BeforeSlug = &slug
	}

	return cursor, nil
}

// validSlug rejects anything that cannot be a slug this service issued.
func validSlug(slug string) error {
	if !slugPattern.MatchString(slug) {
		return errors.New("beforeSlug is not a slug")
	}
	return nil
}

// parseRetentionDays reads an upload's requested retention.
//
// An empty value means the default. Out-of-range values are rejected rather than
// clamped, so a client learns its request was not honoured; the database clamps as
// well, as a backstop.
func parseRetentionDays(raw string) (*int, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, nil
	}

	n, err := strconv.Atoi(raw)
	if err != nil {
		return nil, errors.New("retentionDays must be a whole number of days")
	}
	if n < 1 || n > domain.MaxRetentionDays {
		return nil, errors.New("retentionDays must be between 1 and 30")
	}
	return &n, nil
}
