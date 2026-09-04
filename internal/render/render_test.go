package render

import (
	"strings"
	"testing"
)

func ptr(s string) *string { return &s }

// The sanitizer is the boundary between user content and every viewer's browser,
// so these cases are the ones that matter most in the package.
func TestRenderStripsActiveContent(t *testing.T) {
	r := New()

	cases := []struct {
		name     string
		filename string
		content  string
		absent   []string
	}{
		{
			name:     "script tag in markdown",
			filename: "a.md",
			content:  "# hi\n\n<script>alert(1)</script>\n",
			absent:   []string{"<script", "alert(1)"},
		},
		{
			name:     "inline event handler",
			filename: "a.md",
			content:  `<div onclick="steal()">click</div>`,
			absent:   []string{"onclick", "steal()"},
		},
		{
			name:     "javascript url in link",
			filename: "a.md",
			content:  `[x](javascript:alert(1))`,
			absent:   []string{"javascript:"},
		},
		{
			name:     "data uri image",
			filename: "a.md",
			content:  `![x](data:text/html;base64,PHNjcmlwdD4=)`,
			absent:   []string{"data:text/html"},
		},
		{
			name:     "iframe",
			filename: "a.md",
			content:  `<iframe src="https://evil.example"></iframe>`,
			absent:   []string{"<iframe"},
		},
		{
			name:     "svg with script",
			filename: "a.md",
			content:  `<svg><script>alert(1)</script></svg>`,
			absent:   []string{"<script", "<svg"},
		},
		{
			name:     "style block",
			filename: "a.md",
			content:  `<style>body{display:none}</style>`,
			absent:   []string{"<style"},
		},
		{
			name:     "html in a plain text file is escaped not executed",
			filename: "notes.txt",
			content:  `<script>alert(1)</script>`,
			absent:   []string{"<script>"},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			out, _, err := r.Render(tc.filename, nil, tc.content)
			if err != nil {
				t.Fatalf("Render: %v", err)
			}
			for _, bad := range tc.absent {
				if strings.Contains(out, bad) {
					t.Errorf("output retained %q\ngot: %s", bad, out)
				}
			}
		})
	}
}

// Heading anchors matter because they make a shared document linkable section by
// section.
func TestRenderMarkdown(t *testing.T) {
	r := New()

	out, kind, err := r.Render("README.md", nil, "# Title\n\nSome **bold** text.\n")
	if err != nil {
		t.Fatalf("Render: %v", err)
	}
	if kind != KindMarkdown {
		t.Errorf("kind = %q, want %q", kind, KindMarkdown)
	}
	if !strings.Contains(out, `id="title"`) {
		t.Errorf("heading anchor missing\ngot: %s", out)
	}
	if !strings.Contains(out, "<strong>bold</strong>") {
		t.Errorf("emphasis not rendered\ngot: %s", out)
	}
}

func TestRenderMarkdownGFM(t *testing.T) {
	r := New()

	out, _, err := r.Render("t.md", nil, "| a | b |\n|---|---|\n| 1 | 2 |\n")
	if err != nil {
		t.Fatalf("Render: %v", err)
	}
	if !strings.Contains(out, "<table>") {
		t.Errorf("GFM table not rendered\ngot: %s", out)
	}
}

// A fenced code block inside Markdown has to come out highlighted, not as a bare
// <pre>, or Markdown files lose the feature the whole package exists for.
func TestRenderMarkdownHighlightsFencedCode(t *testing.T) {
	r := New()

	out, _, err := r.Render("t.md", nil, "```go\nfunc main() {}\n```\n")
	if err != nil {
		t.Fatalf("Render: %v", err)
	}
	if !strings.Contains(out, `class=`) || !strings.Contains(out, "<span") {
		t.Errorf("fenced code was not highlighted\ngot: %s", out)
	}
}

// Linkable line numbers matter because they are how someone points at one line of a
// shared file.
func TestRenderCode(t *testing.T) {
	r := New()

	out, kind, err := r.Render("main.go", nil, "package main\n\nfunc main() {}\n")
	if err != nil {
		t.Fatalf("Render: %v", err)
	}
	if kind != KindCode {
		t.Errorf("kind = %q, want %q", kind, KindCode)
	}
	if !strings.Contains(out, "<span") {
		t.Errorf("no highlight spans\ngot: %s", out)
	}
	if !strings.Contains(out, `id="L1"`) {
		t.Errorf("linkable line numbers missing\ngot: %s", out)
	}
}

// An explicit language wins over the extension, so a file named .txt can still be
// shared as Python.
func TestRenderLanguageOverridesExtension(t *testing.T) {
	r := New()

	out, kind, err := r.Render("snippet.txt", ptr("python"), "def f():\n    return 1\n")
	if err != nil {
		t.Fatalf("Render: %v", err)
	}
	if kind != KindCode {
		t.Errorf("kind = %q, want %q", kind, KindCode)
	}
	if !strings.Contains(out, "<span") {
		t.Errorf("explicit language was ignored\ngot: %s", out)
	}
}

func TestRenderUnknownExtensionFallsBackToText(t *testing.T) {
	r := New()

	_, kind, err := r.Render("file.zzzunknown", nil, "just words here\n")
	if err != nil {
		t.Fatalf("Render: %v", err)
	}
	if kind != KindCode && kind != KindText {
		t.Errorf("kind = %q, want code or text", kind)
	}
}

func TestHashIsStable(t *testing.T) {
	first, second := New().Hash(), New().Hash()

	if first != second {
		t.Errorf("Hash differs between instances (%q vs %q), so every request would miss the cache", first, second)
	}
	if first == "" {
		t.Error("Hash is empty, so stale renders could never be detected")
	}
}

func TestCSSCoversBothThemes(t *testing.T) {
	css, err := New().CSS()
	if err != nil {
		t.Fatalf("CSS: %v", err)
	}
	if !strings.Contains(css, ".chroma") {
		t.Error("no chroma rules emitted")
	}
	if !strings.Contains(css, `[data-theme="dark"]`) {
		t.Error("dark theme rules were not scoped, so dark mode would be unstyled")
	}
}

// Concurrent use is the normal case for an HTTP handler.
func TestRendererIsConcurrencySafe(t *testing.T) {
	r := New()
	done := make(chan struct{})

	for i := 0; i < 8; i++ {
		go func() {
			defer func() { done <- struct{}{} }()
			for j := 0; j < 20; j++ {
				if _, _, err := r.Render("a.md", nil, "# x\n\n```go\nvar a = 1\n```\n"); err != nil {
					t.Errorf("Render: %v", err)
					return
				}
			}
		}()
	}
	for i := 0; i < 8; i++ {
		<-done
	}
}

func TestCSSCoversSystemDarkPreference(t *testing.T) {
	css, err := New().CSS()
	if err != nil {
		t.Fatalf("CSS: %v", err)
	}
	if !strings.Contains(css, "@media (prefers-color-scheme: dark)") {
		t.Error("no prefers-color-scheme block, so system-dark viewers are unstyled")
	}
	if !strings.Contains(css, `:root:not([data-theme="light"])`) {
		t.Error("system-dark rules are not guarded against an explicit light choice")
	}
}

func TestScopeCSSPrefixesSelectorAfterComment(t *testing.T) {
	in := "/* Background */ .bg { color: #fff; }\n/* Error */ .chroma .err { color: red }"
	got := scopeCSS(in, ".x")

	for _, want := range []string{"/* Background */ .x .bg {", "/* Error */ .x .chroma .err {"} {
		if !strings.Contains(got, want) {
			t.Errorf("missing %q\ngot: %s", want, got)
		}
	}
}

// KindOf runs on listings where Render never does, so the two must not disagree.
func TestKindOfAgreesWithRender(t *testing.T) {
	cases := []struct {
		filename string
		language string
		content  string
	}{
		{"README.md", "", "# hi"},
		{"main.go", "", "package main"},
		{"styles.css", "", "a{color:red}"},
		{"snippet.txt", "python", "def f(): pass"},
		{"Dockerfile", "", "FROM alpine"},
	}

	r := New()
	for _, tc := range cases {
		t.Run(tc.filename, func(t *testing.T) {
			var lang *string
			if tc.language != "" {
				lang = &tc.language
			}

			_, rendered, err := r.Render(tc.filename, lang, tc.content)
			if err != nil {
				t.Fatalf("Render: %v", err)
			}
			if got := KindOf(tc.filename, tc.language); got != rendered {
				t.Errorf("KindOf = %q but Render = %q", got, rendered)
			}
		})
	}
}
