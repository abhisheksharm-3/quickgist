// Response and error writing, and the single error shape the whole API returns.
package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/abhisheksharm-3/quickgist/internal/obs"
	"github.com/abhisheksharm-3/quickgist/internal/store"
)

// respond writes a JSON response.
//
// The body is encoded into a buffer before the status is written, because encoding
// straight to the ResponseWriter commits a 200 and can then fail mid-body, leaving
// the client with truncated JSON under a success status.
func (a *API) respond(w http.ResponseWriter, r *http.Request, status int, payload any) {
	var buf bytes.Buffer

	if payload != nil {
		enc := json.NewEncoder(&buf)
		enc.SetEscapeHTML(true)
		if err := enc.Encode(payload); err != nil {
			a.log.ErrorContext(r.Context(), "encode response", "error", err)
			obs.CaptureError(r.Context(), err)
			a.fail(w, r, http.StatusInternalServerError, codeInternalError, nil)
			return
		}
	}

	writeJSONHeaders(w, status)
	if buf.Len() > 0 {
		if _, err := w.Write(buf.Bytes()); err != nil {
			a.log.DebugContext(r.Context(), "client closed connection mid-response", "error", err)
		}
	}
}

// fail writes an error response.
//
// The client-visible message is always one this service chose. The cause is logged
// and reported but never sent, so a database or storage message cannot leak.
func (a *API) fail(w http.ResponseWriter, r *http.Request, status int, code string, cause error) {
	a.recordFailure(r, status, code, cause)

	var body errorBody
	body.Error.Code = code
	body.Error.Message = clientMessage(status, code, cause)

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(body); err != nil {
		http.Error(w, http.StatusText(status), status)
		return
	}

	writeJSONHeaders(w, status)
	_, _ = w.Write(buf.Bytes())
}

// recordFailure logs a failed request, reporting server faults to the error tracker
// and leaving client mistakes at debug level.
func (a *API) recordFailure(r *http.Request, status int, code string, cause error) {
	if status >= http.StatusInternalServerError {
		a.log.ErrorContext(r.Context(), "request failed",
			"status", status, "code", code, "error", cause,
			"method", r.Method, "path", r.URL.Path)
		obs.CaptureError(r.Context(), cause)
		return
	}

	if cause != nil {
		a.log.DebugContext(r.Context(), "request rejected",
			"status", status, "code", code, "error", cause)
	}
}

// failFromStore maps a store error onto a status, so the mapping lives in one place
// and no handler inspects SQLSTATE.
//
// A gist that is private to someone else and one that does not exist both return
// 404, because a 403 would confirm that the slug is real.
func (a *API) failFromStore(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, store.ErrNotFound):
		a.fail(w, r, http.StatusNotFound, codeNotFound, err)
	case errors.Is(err, store.ErrForbidden):
		a.fail(w, r, http.StatusForbidden, codeForbidden, err)
	case errors.Is(err, store.ErrInvalid):
		a.fail(w, r, http.StatusUnprocessableEntity, codeInvalidRequest, err)
	case r.Context().Err() != nil:
		a.log.DebugContext(r.Context(), "client went away before the response", "error", err)
	default:
		a.fail(w, r, http.StatusInternalServerError, codeInternalError, err)
	}
}

// clientMessage picks the text a client sees.
//
// A validation failure carries the database's own reason, which is written for
// humans and safe to show. Everything else falls back to the status text, so no
// internal detail escapes.
func clientMessage(status int, code string, cause error) string {
	if code == codeInvalidRequest && cause != nil && errors.Is(cause, store.ErrInvalid) {
		return cause.Error()
	}
	if code == codeInvalidRequest && cause != nil {
		return cause.Error()
	}
	return http.StatusText(status)
}

// writeJSONHeaders sets the content type and sniffing guard, then the status.
func writeJSONHeaders(w http.ResponseWriter, status int) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
}
