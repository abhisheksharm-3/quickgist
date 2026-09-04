package api

import (
	"strings"
	"testing"

	"github.com/abhisheksharm-3/quickgist/internal/store"
)

func TestPageSize(t *testing.T) {
	cases := []struct {
		raw  string
		want int
	}{
		{raw: "", want: defaultPageSize},
		{raw: "abc", want: defaultPageSize},
		{raw: "0", want: defaultPageSize},
		{raw: "-5", want: defaultPageSize},
		{raw: "1", want: 1},
		{raw: "50", want: 50},
		{raw: "100", want: maxPageSize},
		{raw: "1000", want: maxPageSize},
	}

	for _, tc := range cases {
		t.Run("limit="+tc.raw, func(t *testing.T) {
			if got := pageSize(tc.raw); got != tc.want {
				t.Errorf("pageSize(%q) = %d, want %d", tc.raw, got, tc.want)
			}
		})
	}
}

// Out-of-range retention is rejected rather than clamped, so a client learns its
// request was not honoured instead of silently getting a different answer.
func TestParseRetentionDays(t *testing.T) {
	cases := []struct {
		name    string
		raw     string
		want    *int
		wantErr bool
	}{
		{name: "absent means default", raw: "", want: nil},
		{name: "whitespace means default", raw: "  ", want: nil},
		{name: "one day", raw: "1", want: intPtr(1)},
		{name: "at the ceiling", raw: "30", want: intPtr(store.MaxRetentionDays)},
		{name: "over the ceiling", raw: "31", wantErr: true},
		{name: "far over", raw: "3650", wantErr: true},
		{name: "zero", raw: "0", wantErr: true},
		{name: "negative", raw: "-1", wantErr: true},
		{name: "not a number", raw: "thirty", wantErr: true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := parseRetentionDays(tc.raw)

			if tc.wantErr {
				if err == nil {
					t.Errorf("parseRetentionDays(%q) accepted an out-of-range value", tc.raw)
				}
				return
			}
			if err != nil {
				t.Fatalf("parseRetentionDays(%q): %v", tc.raw, err)
			}
			switch {
			case tc.want == nil && got != nil:
				t.Errorf("got %d, want nil", *got)
			case tc.want != nil && got == nil:
				t.Errorf("got nil, want %d", *tc.want)
			case tc.want != nil && *got != *tc.want:
				t.Errorf("got %d, want %d", *got, *tc.want)
			}
		})
	}
}

func TestParseBefore(t *testing.T) {
	cases := []struct {
		name    string
		raw     string
		wantNil bool
		wantErr bool
	}{
		{name: "absent", raw: "", wantNil: true},
		{name: "rfc3339", raw: "2026-09-04T12:00:00Z"},
		{name: "rfc3339 with offset", raw: "2026-09-04T12:00:00+05:30"},
		{name: "date only", raw: "2026-09-04", wantErr: true},
		{name: "nonsense", raw: "yesterday", wantErr: true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := parseBefore(tc.raw)

			if tc.wantErr {
				if err == nil {
					t.Errorf("parseBefore(%q) accepted an unparseable value", tc.raw)
				}
				return
			}
			if err != nil {
				t.Fatalf("parseBefore(%q): %v", tc.raw, err)
			}
			if tc.wantNil != (got == nil) {
				t.Errorf("parseBefore(%q) nil = %v, want %v", tc.raw, got == nil, tc.wantNil)
			}
		})
	}
}

func TestToNewFiles(t *testing.T) {
	cases := []struct {
		name    string
		inputs  []fileInput
		wantErr string
	}{
		{
			name:   "one file",
			inputs: []fileInput{{Filename: "a.md", Content: "# hi"}},
		},
		{
			name:   "trims the filename",
			inputs: []fileInput{{Filename: "  a.md  ", Content: "x"}},
		},
		{
			name:    "no files",
			inputs:  nil,
			wantErr: "at least one file",
		},
		{
			name:    "too many files",
			inputs:  manyFiles(maxFilesPerGist + 1),
			wantErr: "at most 20",
		},
		{
			name:    "blank filename",
			inputs:  []fileInput{{Filename: "   ", Content: "x"}},
			wantErr: "needs a filename",
		},
		{
			name: "duplicate filenames",
			inputs: []fileInput{
				{Filename: "a.md", Content: "x"},
				{Filename: "a.md", Content: "y"},
			},
			wantErr: "same name",
		},
		{
			name:    "content over the text limit",
			inputs:  []fileInput{{Filename: "big.txt", Content: strings.Repeat("a", maxTextFileSize+1)}},
			wantErr: "1 MiB",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			files, err := toNewFiles(tc.inputs)

			if tc.wantErr != "" {
				if err == nil {
					t.Fatalf("expected an error containing %q", tc.wantErr)
				}
				if !strings.Contains(err.Error(), tc.wantErr) {
					t.Errorf("error = %q, want it to contain %q", err, tc.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("toNewFiles: %v", err)
			}
			if len(files) != len(tc.inputs) {
				t.Fatalf("got %d files, want %d", len(files), len(tc.inputs))
			}
			if files[0].Filename != strings.TrimSpace(tc.inputs[0].Filename) {
				t.Errorf("filename = %q, want it trimmed", files[0].Filename)
			}
			if files[0].ByteSize != int64(len(tc.inputs[0].Content)) {
				t.Errorf("byteSize = %d, want %d", files[0].ByteSize, len(tc.inputs[0].Content))
			}
		})
	}
}

// An empty visibility must default to unlisted, never to public, so a client that
// omits the field cannot accidentally publish.
func TestResolveVisibility(t *testing.T) {
	cases := []struct {
		requested string
		want      string
		wantErr   bool
	}{
		{requested: "", want: store.VisibilityUnlisted},
		{requested: "public", want: store.VisibilityPublic},
		{requested: "unlisted", want: store.VisibilityUnlisted},
		{requested: "private", want: store.VisibilityPrivate},
		{requested: "Public", wantErr: true},
		{requested: "secret", wantErr: true},
		{requested: "draft", wantErr: true},
	}

	for _, tc := range cases {
		t.Run("visibility="+tc.requested, func(t *testing.T) {
			got, err := resolveVisibility(tc.requested)

			if tc.wantErr {
				if err == nil {
					t.Errorf("resolveVisibility(%q) = %q, want an error", tc.requested, got)
				}
				return
			}
			if err != nil {
				t.Fatalf("resolveVisibility(%q): %v", tc.requested, err)
			}
			if got != tc.want {
				t.Errorf("resolveVisibility(%q) = %q, want %q", tc.requested, got, tc.want)
			}
		})
	}
}

func intPtr(n int) *int { return &n }

func manyFiles(n int) []fileInput {
	files := make([]fileInput, 0, n)
	for i := 0; i < n; i++ {
		files = append(files, fileInput{Filename: string(rune('a'+i)) + ".txt", Content: "x"})
	}
	return files
}
