package api

import (
	"strings"
	"testing"
)

func TestSafeFilename(t *testing.T) {
	cases := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{name: "plain", input: "README.md", want: "README.md"},
		{name: "trims space", input: "  notes.txt  ", want: "notes.txt"},
		{name: "dots inside", input: "archive.tar.gz", want: "archive.tar.gz"},
		{name: "unicode", input: "notes-日本語.md", want: "notes-日本語.md"},
		{name: "leading dot", input: ".gitignore", want: ".gitignore"},

		{name: "empty", input: "", wantErr: true},
		{name: "only space", input: "   ", wantErr: true},
		{name: "parent traversal", input: "../etc/passwd", wantErr: true},
		{name: "bare parent", input: "..", wantErr: true},
		{name: "absolute path", input: "/etc/passwd", wantErr: true},
		{name: "nested path", input: "a/b.txt", wantErr: true},
		{name: "windows path", input: `a\b.txt`, wantErr: true},
		{name: "current directory", input: ".", wantErr: true},
		{name: "null byte", input: "a\x00b.txt", wantErr: true},
		{name: "newline", input: "a\nb.txt", wantErr: true},
		{name: "delete character", input: "a\x7fb.txt", wantErr: true},
		{name: "too long", input: strings.Repeat("a", 256), wantErr: true},
		{name: "at the length limit", input: strings.Repeat("a", 255), want: strings.Repeat("a", 255)},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := safeFilename(tc.input)

			if tc.wantErr {
				if err == nil {
					t.Errorf("safeFilename(%q) = %q, want an error", tc.input, got)
				}
				return
			}
			if err != nil {
				t.Fatalf("safeFilename(%q): %v", tc.input, err)
			}
			if got != tc.want {
				t.Errorf("safeFilename(%q) = %q, want %q", tc.input, got, tc.want)
			}
		})
	}
}

// Anything a browser would execute must be reported as active, so it is served as a
// download rather than a document on this origin.
func TestIsActiveType(t *testing.T) {
	cases := []struct {
		contentType string
		want        bool
	}{
		{contentType: "text/html", want: true},
		{contentType: "text/html; charset=utf-8", want: true},
		{contentType: "image/svg+xml", want: true},
		{contentType: "application/xhtml+xml", want: true},
		{contentType: "text/javascript", want: true},
		{contentType: "application/pdf", want: true},
		{contentType: "application/atom+xml", want: true},
		{contentType: "not a media type", want: true},
		{contentType: "", want: true},

		{contentType: "text/plain", want: false},
		{contentType: "image/png", want: false},
		{contentType: "application/json", want: false},
		{contentType: "application/zip", want: false},
	}

	for _, tc := range cases {
		t.Run(tc.contentType, func(t *testing.T) {
			if got := isActiveType(tc.contentType); got != tc.want {
				t.Errorf("isActiveType(%q) = %v, want %v", tc.contentType, got, tc.want)
			}
		})
	}
}

func TestDownloadContentType(t *testing.T) {
	cases := []struct {
		name     string
		stored   string
		filename string
		want     string
	}{
		{name: "safe stored type is kept", stored: "image/png", filename: "a.png", want: "image/png"},
		{name: "html is neutered", stored: "text/html", filename: "a.html", want: "application/octet-stream"},
		{name: "svg is neutered", stored: "image/svg+xml", filename: "a.svg", want: "application/octet-stream"},
		{name: "empty falls back to extension", stored: "", filename: "a.png", want: "image/png"},
		{name: "unknown extension", stored: "", filename: "a.zzz", want: "application/octet-stream"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := downloadContentType(tc.stored, tc.filename)
			if !strings.HasPrefix(got, tc.want) {
				t.Errorf("downloadContentType(%q, %q) = %q, want %q", tc.stored, tc.filename, got, tc.want)
			}
		})
	}
}

func TestUploadContentTypeNeverStoresAnActiveType(t *testing.T) {
	for _, filename := range []string{"a.html", "a.svg", "a.js", "a.xhtml", "a.pdf", "a.xml"} {
		t.Run(filename, func(t *testing.T) {
			if got := uploadContentType(filename); got != "application/octet-stream" {
				t.Errorf("uploadContentType(%q) = %q, want application/octet-stream", filename, got)
			}
		})
	}
}

// A quote or a comma in a filename must not be able to terminate the header value.
func TestContentDispositionEncodesDangerousCharacters(t *testing.T) {
	cases := []struct {
		name     string
		filename string
		absent   []string
	}{
		{name: "quote", filename: `a"b.txt`, absent: []string{`"`}},
		{name: "semicolon and comma", filename: "a;b,c.txt", absent: []string{";b", ",c"}},
		{name: "space", filename: "my file.txt", absent: []string{" file"}},
		{name: "newline", filename: "a\nb.txt", absent: []string{"\n"}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := contentDisposition(tc.filename)

			for _, bad := range tc.absent {
				if strings.Contains(strings.TrimPrefix(got, "inline; filename*=UTF-8''"), bad) {
					t.Errorf("contentDisposition(%q) = %q, still contains %q", tc.filename, got, bad)
				}
			}
			if !strings.HasPrefix(got, "inline; filename*=UTF-8''") {
				t.Errorf("contentDisposition(%q) = %q, missing the RFC 5987 prefix", tc.filename, got)
			}
		})
	}
}
