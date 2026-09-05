// The card's geometry and palette.
//
// The size is what every chat client and crawler expects, and the colours are the
// application's dark theme, so a link preview looks like the page it opens.
package card

import (
	"embed"
	"image/color"
)

// The card is the size every chat client and crawler expects, and the palette is
// the application's dark theme so a preview looks like the page it opens.
const (
	width  = 1200
	height = 630

	margin   = 72
	gridStep = 26

	titleSize = 62
	metaSize  = 26
	markSize  = 34

	maxTitleLines = 3
	maxFileChips  = 4

	// The site card's own geometry: a wordmark large enough to bleed off the bottom
	// edge, the weave of the hatch behind it, and the tracking on the eyebrow.
	wordmarkSize    = 240
	markBleed       = -52
	hatchStep       = 9
	eyebrowTracking = 4

	// The vertical rhythm of the site card, measured from the top edge.
	eyebrowBaseline  = 112
	headlineBaseline = 224
	headlineLeading  = 14
	ruleDrop         = 30
	ruleWidth        = 96
	taglineDrop      = 26
)

// The blue field, as the footer paints it. Every value here is the flat result of
// compositing white over #2846e8 at the opacity the CSS uses, because a PNG has no
// layers to composite at draw time.
var (
	fieldBackground = color.RGBA{0x28, 0x46, 0xe8, 0xff}
	fieldGrid       = color.RGBA{0x3b, 0x56, 0xea, 0xff}
	fieldHatch      = color.RGBA{0x33, 0x50, 0xea, 0xff}
	fieldHeading    = color.RGBA{0xff, 0xff, 0xff, 0xff}
	fieldDim        = color.RGBA{0xd4, 0xdb, 0xfa, 0xff}
	fieldFaint      = color.RGBA{0xa9, 0xb8, 0xf5, 0xff}
	fieldOutline    = color.RGBA{0x6d, 0x83, 0xef, 0xff}
)

// What the card says. The headline is the editor's own hero line, so the first
// thing somebody reads in a chat is the first thing they read on the page.
const (
	siteEyebrow  = "MARKDOWN AND CODE, AS A LINK"
	siteTagline  = "Rendered on the server. No account needed."
	siteWordmark = "quickgist"
)

var siteHeadline = []string{"Paste it. Send it."}

var (
	background = color.RGBA{0x0d, 0x0f, 0x13, 0xff}
	gridLine   = color.RGBA{0x1a, 0x1d, 0x24, 0xff}
	heading    = color.RGBA{0xec, 0xee, 0xf2, 0xff}
	dim        = color.RGBA{0x8b, 0x90, 0x9a, 0xff}
	accent     = color.RGBA{0x3b, 0x82, 0xf6, 0xff}
)

//go:embed fonts/IBMPlexSans-SemiBold.ttf
var fonts embed.FS
