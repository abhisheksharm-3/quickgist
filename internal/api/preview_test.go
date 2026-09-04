package api

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/abhisheksharm-3/quickgist/internal/config"
	"github.com/abhisheksharm-3/quickgist/internal/render"
)

// testPreviewAPI builds an API with only what Preview touches, so a case that
// forgets the store still runs rather than skipping the scenario it exists to
// prove.
func testPreviewAPI() *API {
	return &API{
		cfg:            &config.Config{},
		renderer:       render.New(),
		previewLimiter: newLimiter(1000, 1000),
		log:            slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
}

// postPreview drives the handler through its rate-limit middleware, which is where
// the limit lives in production. Calling a.Preview directly would test a path no
// request takes.
func postPreview(t *testing.T, a *API, body []byte) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(http.MethodPost, "/v1/preview", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	a.rateLimit(a.previewLimiter)(http.HandlerFunc(a.Preview)).ServeHTTP(rec, req)
	return rec
}

func decodeErrorCode(t *testing.T, rec *httptest.ResponseRecorder) string {
	t.Helper()

	var body errorBody
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode error body: %v (body: %s)", err, rec.Body.String())
	}
	return body.Error.Code
}

func TestPreviewContentCap(t *testing.T) {
	cases := []struct {
		name       string
		contentLen int
		wantStatus int
		wantCode   string
	}{
		{
			name:       "at the 1 MiB limit",
			contentLen: maxTextFileSize,
			wantStatus: http.StatusOK,
		},
		{
			name:       "one byte over the 1 MiB limit",
			contentLen: maxTextFileSize + 1,
			wantStatus: http.StatusRequestEntityTooLarge,
			wantCode:   codeBodyTooLarge,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			a := testPreviewAPI()

			payload, err := json.Marshal(fileInput{
				Content: strings.Repeat("a", tc.contentLen),
			})
			if err != nil {
				t.Fatalf("marshal request: %v", err)
			}

			rec := postPreview(t, a, payload)

			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d (body: %s)", rec.Code, tc.wantStatus, rec.Body.String())
			}
			if tc.wantCode != "" && decodeErrorCode(t, rec) != tc.wantCode {
				t.Errorf("code = %q, want %q", decodeErrorCode(t, rec), tc.wantCode)
			}
		})
	}
}

func TestPreviewBodyOverJSONCap(t *testing.T) {
	a := testPreviewAPI()

	payload, err := json.Marshal(fileInput{
		Content: strings.Repeat("a", maxJSONBody+1),
	})
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}

	rec := postPreview(t, a, payload)

	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusRequestEntityTooLarge)
	}
	if got := decodeErrorCode(t, rec); got != codeBodyTooLarge {
		t.Errorf("code = %q, want %q", got, codeBodyTooLarge)
	}
}

func TestPreviewUnknownLanguageDegradesToText(t *testing.T) {
	a := testPreviewAPI()

	lang := "not-a-real-language"
	payload, err := json.Marshal(fileInput{
		Filename: "notes",
		Language: &lang,
		Content:  "just some prose",
	})
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}

	rec := postPreview(t, a, payload)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}

	var resp previewResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Kind != render.KindText {
		t.Errorf("kind = %q, want %q, so an unrecognised language errored instead of degrading", resp.Kind, render.KindText)
	}
	if resp.HTML == "" {
		t.Error("html is empty for content that should have rendered as plain text")
	}
}

// A nil store must never be dereferenced: Preview promises zero store access, and
// this is the case that would panic the moment that promise was broken.
func TestPreviewNeverTouchesStore(t *testing.T) {
	a := &API{
		cfg:            &config.Config{},
		renderer:       render.New(),
		previewLimiter: newLimiter(1000, 1000),
		log:            slog.New(slog.NewTextHandler(io.Discard, nil)),
		store:          nil,
	}

	payload, err := json.Marshal(fileInput{
		Filename: "main.go",
		Content:  "package main\n\nfunc main() {}\n",
	})
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}

	rec := postPreview(t, a, payload)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}

	var resp previewResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Kind != render.KindCode {
		t.Errorf("kind = %q, want %q", resp.Kind, render.KindCode)
	}
}

func TestPreviewOwnLimiterRejectsIndependentlyOfContent(t *testing.T) {
	a := &API{
		cfg:            &config.Config{},
		renderer:       render.New(),
		previewLimiter: newLimiter(1, 1),
		log:            slog.New(slog.NewTextHandler(io.Discard, nil)),
	}

	payload, err := json.Marshal(fileInput{Content: "x"})
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}

	first := postPreview(t, a, payload)
	if first.Code != http.StatusOK {
		t.Fatalf("first request status = %d, want 200", first.Code)
	}

	second := postPreview(t, a, payload)
	if second.Code != http.StatusTooManyRequests {
		t.Fatalf("second request status = %d, want %d", second.Code, http.StatusTooManyRequests)
	}
	if got := decodeErrorCode(t, second); got != codeRateLimited {
		t.Errorf("code = %q, want %q", got, codeRateLimited)
	}
}

// BenchmarkPreviewLargeMarkdown makes the CPU cost of rendering an unauthenticated
// caller's maximum-size document a measured number.
func BenchmarkPreviewLargeMarkdown(b *testing.B) {
	a := testPreviewAPI()

	var sb strings.Builder
	for sb.Len() < maxTextFileSize-100 {
		sb.WriteString("# Heading\n\nSome **bold** prose with `inline code` and a list:\n\n- one\n- two\n\n```go\nfunc add(a, b int) int {\n\treturn a + b\n}\n```\n\n")
	}
	content := sb.String()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, _, err := a.renderer.Render("doc.md", nil, content); err != nil {
			b.Fatalf("render: %v", err)
		}
	}
}
