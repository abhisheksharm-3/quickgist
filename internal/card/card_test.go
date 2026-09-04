package card

import (
	"bytes"
	"image/png"
	"strings"
	"testing"
)

func TestRenderProducesADecodablePNGOfTheRightSize(t *testing.T) {
	r, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	out, err := r.Render(Data{
		Title:      "Welcome to quickgist",
		Author:     "abhitiku2003",
		Files:      []string{"welcome.md", "hello.go"},
		Visibility: "public",
		FileCount:  2,
	})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}

	img, err := png.Decode(bytes.NewReader(out))
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	if got := img.Bounds().Dx(); got != width {
		t.Errorf("width = %d, want %d", got, width)
	}
	if got := img.Bounds().Dy(); got != height {
		t.Errorf("height = %d, want %d", got, height)
	}
}

func TestWrapKeepsTitlesInsideTheCard(t *testing.T) {
	r, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	cases := []struct {
		name  string
		title string
	}{
		{"empty", ""},
		{"short", "Notes"},
		{"long", strings.Repeat("a very long title indeed ", 12)},
		{"unbroken", strings.Repeat("x", 200)},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			lines := wrap(c.title, r.title, width-2*margin)
			if len(lines) == 0 {
				t.Fatal("wrap returned no lines")
			}
			if len(lines) > maxTitleLines {
				t.Errorf("lines = %d, want at most %d", len(lines), maxTitleLines)
			}
		})
	}
}
