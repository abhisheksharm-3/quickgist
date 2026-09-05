// Package card draws the image a chat client shows when a gist link is pasted.
package card

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"strings"

	"golang.org/x/image/font"
	"golang.org/x/image/font/opentype"
	"golang.org/x/image/math/fixed"
)

// New parses the embedded font once, at startup, so a request never pays for it.
func New() (*Renderer, error) {
	data, err := fonts.ReadFile("fonts/IBMPlexSans-SemiBold.ttf")
	if err != nil {
		return nil, fmt.Errorf("read embedded font: %w", err)
	}

	parsed, err := opentype.Parse(data)
	if err != nil {
		return nil, fmt.Errorf("parse embedded font: %w", err)
	}

	faces := make([]font.Face, 0, 3)
	for _, size := range []float64{titleSize, metaSize, markSize} {
		face, err := opentype.NewFace(parsed, &opentype.FaceOptions{Size: size, DPI: 72, Hinting: font.HintingFull})
		if err != nil {
			return nil, fmt.Errorf("build %gpt face: %w", size, err)
		}
		faces = append(faces, face)
	}

	return &Renderer{title: faces[0], meta: faces[1], mark: faces[2]}, nil
}

// Render draws one card as a PNG.
//
// The composition is the product's: a blueprint grid, a blue rule down the left
// edge, the title in the largest type the card can hold, and the facts underneath in
// the same order the gist header states them.
func (r *Renderer) Render(data Data) ([]byte, error) {
	canvas := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.Draw(canvas, canvas.Bounds(), &image.Uniform{background}, image.Point{}, draw.Src)

	drawGrid(canvas)
	fill(canvas, image.Rect(0, 0, 8, height), accent)

	lines := wrap(data.Title, r.title, width-2*margin)
	y := margin + titleSize

	for _, line := range lines {
		drawText(canvas, r.title, heading, margin, y, line)
		y += titleSize + 14
	}

	y += 18
	drawText(canvas, r.meta, dim, margin, y, meta(data))

	y += metaSize + 30
	drawChips(canvas, r.meta, data.Files, y)

	drawText(canvas, r.mark, accent, margin, height-margin, "quickgist")

	var buf bytes.Buffer
	if err := png.Encode(&buf, canvas); err != nil {
		return nil, fmt.Errorf("encode png: %w", err)
	}
	return buf.Bytes(), nil
}

// meta is the line under the title: who wrote it, how many files, how visible.
func meta(data Data) string {
	parts := make([]string, 0, 3)

	if data.Author != "" {
		parts = append(parts, data.Author)
	} else {
		parts = append(parts, "anonymous")
	}

	if data.FileCount == 1 {
		parts = append(parts, "1 file")
	} else {
		parts = append(parts, fmt.Sprintf("%d files", data.FileCount))
	}

	if data.Visibility != "" && data.Visibility != "public" {
		parts = append(parts, data.Visibility)
	}

	return strings.Join(parts, "  ·  ")
}

// wrap breaks a title into at most maxTitleLines lines that fit the given width,
// ending the last one with an ellipsis when the title does not fit at all.
func wrap(text string, face font.Face, limit int) []string {
	words := strings.Fields(text)
	if len(words) == 0 {
		return []string{"Untitled gist"}
	}

	lines := make([]string, 0, maxTitleLines)
	current := ""

	for _, word := range words {
		candidate := word
		if current != "" {
			candidate = current + " " + word
		}

		if textWidth(face, candidate) <= limit || current == "" {
			current = candidate
			continue
		}

		lines = append(lines, current)
		current = word

		if len(lines) == maxTitleLines {
			return truncateLast(lines, face, limit)
		}
	}

	return append(lines, current)
}

// truncateLast marks the last line as continuing, since the title did not fit.
func truncateLast(lines []string, face font.Face, limit int) []string {
	last := lines[len(lines)-1]
	for textWidth(face, last+"…") > limit && len(last) > 1 {
		last = strings.TrimRight(last[:len(last)-1], " ")
	}
	lines[len(lines)-1] = last + "…"
	return lines
}

// drawChips draws the filenames as bordered boxes, the way the feed lists them.
func drawChips(canvas *image.RGBA, face font.Face, files []string, y int) {
	x := margin
	shown := files
	if len(shown) > maxFileChips {
		shown = shown[:maxFileChips]
	}

	for _, filename := range shown {
		w := textWidth(face, filename) + 28
		box := image.Rect(x, y-metaSize-6, x+w, y+14)

		outline(canvas, box, gridLine)
		drawText(canvas, face, dim, x+14, y, filename)

		x = box.Max.X + 14
		if x > width-margin {
			return
		}
	}
}

func drawGrid(canvas *image.RGBA) {
	for x := 0; x < width; x += gridStep {
		fill(canvas, image.Rect(x, 0, x+1, height), gridLine)
	}
	for y := 0; y < height; y += gridStep {
		fill(canvas, image.Rect(0, y, width, y+1), gridLine)
	}
}

func fill(canvas *image.RGBA, rect image.Rectangle, c color.RGBA) {
	draw.Draw(canvas, rect, &image.Uniform{c}, image.Point{}, draw.Src)
}

func outline(canvas *image.RGBA, rect image.Rectangle, c color.RGBA) {
	fill(canvas, image.Rect(rect.Min.X, rect.Min.Y, rect.Max.X, rect.Min.Y+1), c)
	fill(canvas, image.Rect(rect.Min.X, rect.Max.Y-1, rect.Max.X, rect.Max.Y), c)
	fill(canvas, image.Rect(rect.Min.X, rect.Min.Y, rect.Min.X+1, rect.Max.Y), c)
	fill(canvas, image.Rect(rect.Max.X-1, rect.Min.Y, rect.Max.X, rect.Max.Y), c)
}

func drawText(canvas *image.RGBA, face font.Face, c color.RGBA, x, y int, text string) {
	drawer := &font.Drawer{
		Dst:  canvas,
		Src:  &image.Uniform{c},
		Face: face,
		Dot:  fixed.P(x, y),
	}
	drawer.DrawString(text)
}

func textWidth(face font.Face, text string) int {
	return font.MeasureString(face, text).Ceil()
}
