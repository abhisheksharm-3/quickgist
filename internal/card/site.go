// The card the product itself previews as, when its own link is shared.
package card

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"

	"golang.org/x/image/font"
)

// Site draws the product's own preview card as a PNG.
//
// A gist's card is dark, because a gist is a document and the reader is about to
// open a dark page. This one is the blue field the footer uses, because it is the
// product introducing itself rather than a document announcing its contents, and the
// two should not be mistaken for each other in a chat window.
//
// The wordmark is outlined and bled off the bottom edge, which is the signature the
// footer already carries. There is no way to stroke text with a font.Drawer, so it
// is drawn eight times around its own position and then punched out in the field
// colour, which leaves a one-pixel outline.
func (r *Renderer) Site() ([]byte, error) {
	canvas := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.Draw(canvas, canvas.Bounds(), &image.Uniform{fieldBackground}, image.Point{}, draw.Src)

	drawFieldGrid(canvas)
	drawHatch(canvas)

	drawTracked(canvas, r.meta, fieldFaint, margin, eyebrowBaseline, siteEyebrow, eyebrowTracking)

	y := headlineBaseline
	for _, line := range siteHeadline {
		drawText(canvas, r.title, fieldHeading, margin, y, line)
		y += titleSize + headlineLeading
	}

	drawRule(canvas, margin, y-titleSize+ruleDrop, ruleWidth)

	drawText(canvas, r.meta, fieldDim, margin, y+taglineDrop, siteTagline)

	drawOutlined(canvas, r.wordmark, fieldOutline, margin, height-markBleed, siteWordmark)

	var buf bytes.Buffer
	if err := png.Encode(&buf, canvas); err != nil {
		return nil, fmt.Errorf("encode png: %w", err)
	}
	return buf.Bytes(), nil
}

// drawRule is the short hairline the footer puts under its own heading.
func drawRule(canvas *image.RGBA, x, y, w int) {
	fill(canvas, image.Rect(x, y, x+w, y+1), fieldOutline)
}

// drawFieldGrid is the blueprint grid, at the contrast the blue needs.
//
// The dark card's grid is a near-invisible hairline; on the blue field the same
// value disappears, which is why the footer raises it to 9% white and this does too.
func drawFieldGrid(canvas *image.RGBA) {
	for x := 0; x < width; x += gridStep {
		fill(canvas, image.Rect(x, 0, x+1, height), fieldGrid)
	}
	for y := 0; y < height; y += gridStep {
		fill(canvas, image.Rect(0, y, width, y+1), fieldGrid)
	}
}

// drawHatch is the diagonal weave over the lower half, as the footer has it.
func drawHatch(canvas *image.RGBA) {
	top := height / 2

	for offset := -height; offset < width; offset += hatchStep {
		for y := top; y < height; y++ {
			x := offset + (y - top)
			if x >= 0 && x < width {
				fill(canvas, image.Rect(x, y, x+1, y+1), fieldHatch)
			}
		}
	}
}

// drawOutlined writes text as an outline: eight offset copies, then the field colour
// punched through the middle.
func drawOutlined(canvas *image.RGBA, face font.Face, edge color.RGBA, x, y int, text string) {
	for dx := -1; dx <= 1; dx++ {
		for dy := -1; dy <= 1; dy++ {
			if dx == 0 && dy == 0 {
				continue
			}
			drawText(canvas, face, edge, x+dx, y+dy, text)
		}
	}
	drawText(canvas, face, fieldBackground, x, y, text)
}

// drawTracked writes text with letter spacing, which a font.Drawer has no setting
// for: each rune is placed, then the pen is nudged on.
func drawTracked(canvas *image.RGBA, face font.Face, c color.RGBA, x, y int, text string, tracking int) {
	pen := x
	for _, r := range text {
		glyph := string(r)
		drawText(canvas, face, c, pen, y, glyph)
		pen += textWidth(face, glyph) + tracking
	}
}
