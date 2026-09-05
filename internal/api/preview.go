// The preview endpoint: server-rendered HTML for content not yet saved to a gist.
package api

import (
	"net/http"
)

// Preview handles POST /v1/preview.
//
// It never touches the store: rendering unsaved content needs no gist to exist and
// no caller to be known, so anonymous use is safe and there is nothing here to
// authorize.
//
// Because there is no store, there is also no gist_files row, and therefore none of
// the constraints that row would have enforced. The filename has to be bounded here
// instead: chroma's lexer matching costs time proportional to the name's length, so
// an unbounded one turns a single small request into minutes of CPU. That is the
// price of the no-database design and it is paid explicitly.
func (a *API) Preview(w http.ResponseWriter, r *http.Request) {
	var req fileInput
	if !a.decodeJSON(w, r, &req) {
		return
	}

	filename, err := previewFilename(req.Filename)
	if err != nil {
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidFilename, err)
		return
	}

	if len(req.Content) > maxTextFileSize {
		a.fail(w, r, http.StatusRequestEntityTooLarge, codeBodyTooLarge, nil)
		return
	}

	html, kind, err := a.renderer.Render(filename, req.Language, req.Content)
	if err != nil {
		a.fail(w, r, http.StatusInternalServerError, codeInternalError, err)
		return
	}

	a.respond(w, r, http.StatusOK, previewResponse{Kind: kind, HTML: html})
}

// previewFilename validates a filename that only steers lexer selection.
//
// Empty is allowed, unlike on the create path: content with no filename still
// renders, falling back to the language or to plain text. Anything non-empty is
// held to the same rules as a stored filename, which is what bounds its length.
func previewFilename(name string) (string, error) {
	if name == "" {
		return "", nil
	}
	return safeFilename(name)
}
