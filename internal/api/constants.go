// Every value this layer treats as fixed: the sizes it refuses, the error codes it
// answers with, the timeouts it waits for, and the patterns it matches.
//
// They are together because most of them are limits, and a limit is only meaningful
// beside the others: the JSON body cap has to exceed the text file cap, and the
// preview rate has to exceed the editor's debounce. Scattered across handlers, those
// relationships were invisible.
package api

import (
	"regexp"
	"time"
)

// slugPattern is what generate_slug() produces: twelve characters from a 32-symbol
// alphabet. A cursor's slug is checked against it rather than passed through, so a
// crafted value reaches the query as a rejected request instead of a comparison.
var slugPattern = regexp.MustCompile(`^[a-z0-9]{4,32}$`)

const (
	maxJSONBody     = 2 << 20
	maxTextFileSize = 1 << 20
	maxUploadSize   = 10 << 20
	maxFilesPerGist = 20
	defaultPageSize = 30
	maxPageSize     = 100
	multipartMemory = 4 << 20
)

// Error codes clients can branch on. The message beside them is for humans and may
// change; these do not.
const (
	codeNotFound           = "not_found"
	codeForbidden          = "forbidden"
	codeUnauthenticated    = "unauthenticated"
	codeInvalidRequest     = "invalid_request"
	codeInvalidJSON        = "invalid_json"
	codeInvalidForm        = "invalid_form"
	codeInvalidFilename    = "invalid_filename"
	codeUnsupportedMedia   = "unsupported_media_type"
	codeBodyTooLarge       = "body_too_large"
	codeFileTooLarge       = "file_too_large"
	codeRateLimited        = "rate_limited"
	codeStorageUnavailable = "storage_unavailable"
	codeInternalError      = "internal_error"
)

const maxFilenameLength = 255

// activeTypes are media types a browser would execute or render as a document. User
// content is never served as one of these.
var activeTypes = map[string]struct{}{
	"text/html":                {},
	"application/xhtml+xml":    {},
	"image/svg+xml":            {},
	"application/xml":          {},
	"text/xml":                 {},
	"application/javascript":   {},
	"text/javascript":          {},
	"application/x-javascript": {},
	"application/pdf":          {},
}

// previewRateLimitRPS and previewRateLimitBurst are deliberately tighter than the
// global limit, and are enforced even when RATE_LIMIT_ENABLED is false. Rendering
// is CPU-bound and this is the only endpoint that runs it for an anonymous caller,
// so its budget is a safety limit rather than a fairness one.
//
// The rate must stay at or above the editor's debounce, or ordinary typing earns a
// 429. The debounce is 400ms, so a typist can ask for 2.5 renders a second.
const (
	previewRateLimitRPS   = 4
	previewRateLimitBurst = 8
)

const (
	defaultPasteFilename = "paste.md"
	maxPasteExpiryDays   = 365
)

// A crawler refetches a preview often and the card only changes when the gist does,
// so it is cached for an hour rather than forever: a renamed gist should not keep
// showing its old title in every chat it was ever pasted into.
const previewCacheControl = "public, max-age=3600"

const cacheWriteTimeout = 5 * time.Second

const (
	visitorIdleTimeout = 3 * time.Minute
	evictInterval      = time.Minute
)
