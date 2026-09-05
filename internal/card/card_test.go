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

func TestSiteCardIsADecodablePNGOfTheRightSize(t *testing.T) {
	r, err := New()
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	out, err := r.Site()
	if err != nil {
		t.Fatalf("Site: %v", err)
	}

	img, err := png.Decode(bytes.NewReader(out))
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	if img.Bounds().Dx() != width || img.Bounds().Dy() != height {
		t.Errorf("size = %dx%d, want %dx%d", img.Bounds().Dx(), img.Bounds().Dy(), width, height)
	}

	// The card is the blue field, not the dark ground a gist card uses: a corner
	// pixel is the cheapest way to catch the two being swapped.
	corner := img.At(4, 4)
	red, green, blue, _ := corner.RGBA()
	want := fieldBackground
	if uint8(red>>8) != want.R || uint8(green>>8) != want.G || uint8(blue>>8) != want.B {
		t.Errorf("corner = #%02x%02x%02x, want the blue field #%02x%02x%02x",
			uint8(red>>8), uint8(green>>8), uint8(blue>>8), want.R, want.G, want.B)
	}
}
