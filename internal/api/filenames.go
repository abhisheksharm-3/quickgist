// Filename validation and the content-type decisions for serving user files.
package api

import (
	"errors"
	"fmt"
	"mime"
	"path/filepath"
	"strings"
)

// safeFilename validates a client-supplied filename.
//
// It must be a single path segment: no directories, no traversal, no absolute path.
// Rejection happens before any cleaning, so "../x" is an error rather than quietly
// becoming "x".
//
// The previous code declared a regexp for this and never used it, so nothing was
// validated at all.
func safeFilename(name string) (string, error) {
	name = strings.TrimSpace(name)

	if name == "" {
		return "", errors.New("filename is required")
	}
	if len(name) > maxFilenameLength {
		return "", errors.New("filename is too long")
	}
	if strings.ContainsAny(name, `/\`) || strings.Contains(name, "..") {
		return "", errors.New("filename must not contain a path")
	}
	if name == "." {
		return "", errors.New("filename is invalid")
	}
	if err := rejectControlCharacters(name); err != nil {
		return "", err
	}

	return name, nil
}

// rejectControlCharacters refuses names containing a NUL or other control byte,
// which is never legitimate and can truncate a path in whatever handles it next.
func rejectControlCharacters(name string) error {
	for _, r := range name {
		if r < 0x20 || r == 0x7f {
			return errors.New("filename contains a control character")
		}
	}
	return nil
}

// contentDisposition builds the header with an RFC 5987 encoded filename, so a
// comma or a quote in the name cannot terminate the value early.
func contentDisposition(filename string) string {
	return fmt.Sprintf("inline; filename*=UTF-8''%s", encodeHeaderFilename(filename))
}

// encodeHeaderFilename percent-encodes everything outside RFC 5987 attr-char.
func encodeHeaderFilename(name string) string {
	const unreserved = "!#$&+-.^_`|~"

	var b strings.Builder
	for _, c := range []byte(name) {
		switch {
		case c >= 'a' && c <= 'z',
			c >= 'A' && c <= 'Z',
			c >= '0' && c <= '9',
			strings.IndexByte(unreserved, c) >= 0:
			b.WriteByte(c)
		default:
			fmt.Fprintf(&b, "%%%02X", c)
		}
	}
	return b.String()
}

// uploadContentType picks the type to store, derived from the extension rather than
// taken from the client, because a client-declared type is only a claim.
func uploadContentType(filename string) string {
	if ct := mime.TypeByExtension(filepath.Ext(filename)); ct != "" && !isActiveType(ct) {
		return ct
	}
	return "application/octet-stream"
}

// downloadContentType decides what to serve. An active type becomes a download
// instead of a document, so shared content can never script on this origin.
func downloadContentType(stored, filename string) string {
	candidate := stored
	if candidate == "" {
		candidate = mime.TypeByExtension(filepath.Ext(filename))
	}
	if candidate == "" || isActiveType(candidate) {
		return "application/octet-stream"
	}
	return candidate
}

// isActiveType reports whether a browser would execute the content. An unparseable
// type counts as active, because it cannot be shown to be safe.
func isActiveType(contentType string) bool {
	mt, _, err := mime.ParseMediaType(contentType)
	if err != nil {
		return true
	}
	if _, ok := activeTypes[mt]; ok {
		return true
	}
	return strings.HasSuffix(mt, "+xml")
}
