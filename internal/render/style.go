// The One Light chroma style, registered at process startup for the light theme.
package render

import (
	"github.com/alecthomas/chroma/v2"
	"github.com/alecthomas/chroma/v2/styles"
)

// init registers One Light before anything in this package calls styles.Get, since
// chroma has no built-in light theme matching the product's palette the way
// onedark covers dark.
//
// A build failure here means one of the literal hex strings below is malformed, a
// mistake TestCSSCoversBothThemes and TestHashIsStable both catch immediately. Given
// that, leaving the fixed style unregistered and letting styles.Get fall back is a
// safer failure than taking the whole process down for what would be a typo, not a
// runtime condition.
func init() {
	if style, err := oneLightStyle(); err == nil {
		styles.Register(style)
	}
}

// oneLightStyle builds the One Light chroma style from the product's palette.
func oneLightStyle() (*chroma.Style, error) {
	return chroma.NewStyle(oneLightStyleName, chroma.StyleEntries{
		chroma.Background:    "#383a41 bg:#fafafa",
		chroma.Text:          "#383a41",
		chroma.Keyword:       "#a626a4",
		chroma.LiteralString: "#50a14f",
		chroma.NameFunction:  "#4078f2",
		chroma.Comment:       "italic #a0a1a7",
		chroma.LiteralNumber: "#986801",
		chroma.KeywordType:   "#c18401",
		chroma.NameClass:     "#c18401",
	})
}
