// Request body and query parsing shared by the handlers.
package api

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/abhisheksharm-3/quickgist/internal/store"
)

const (
	maxJSONBody     = 2 << 20
	maxTextFileSize = 1 << 20
	maxUploadSize   = 10 << 20
	maxFilesPerGist = 20
	defaultPageSize = 30
	maxPageSize     = 100
	multipartMemory = 4 << 20
)

// fileInput is a text file as a client sends it, on create and on replace alike.
type fileInput struct {
	Filename string  `json:"filename"`
	Language *string `json:"language"`
	Content  string  `json:"content"`
}

// toNewFiles validates a client's file set and converts it for the store.
//
// Both create and replace accept the same shape, so the rules live here once rather
// than being restated per handler.
func toNewFiles(inputs []fileInput) ([]store.NewFile, error) {
	if len(inputs) == 0 {
		return nil, errors.New("at least one file is required")
	}
	if len(inputs) > maxFilesPerGist {
		return nil, errors.New("a gist takes at most 20 files")
	}

	files := make([]store.NewFile, 0, len(inputs))
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
		files = append(files, store.NewFile{
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

// parseBefore reads a keyset pagination cursor.
func parseBefore(raw string) (*time.Time, error) {
	if raw == "" {
		return nil, nil
	}

	t, err := time.Parse(time.RFC3339, raw)
	if err != nil {
		return nil, errors.New("before must be an RFC3339 timestamp")
	}
	return &t, nil
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
	if n < 1 || n > store.MaxRetentionDays {
		return nil, errors.New("retentionDays must be between 1 and 30")
	}
	return &n, nil
}
