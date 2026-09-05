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
)

var (
	background = color.RGBA{0x0d, 0x0f, 0x13, 0xff}
	gridLine   = color.RGBA{0x1a, 0x1d, 0x24, 0xff}
	heading    = color.RGBA{0xec, 0xee, 0xf2, 0xff}
	dim        = color.RGBA{0x8b, 0x90, 0x9a, 0xff}
	accent     = color.RGBA{0x3b, 0x82, 0xf6, 0xff}
)

//go:embed fonts/IBMPlexSans-SemiBold.ttf
var fonts embed.FS
