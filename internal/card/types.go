// What a card says, as the API hands it over.
//
// Renderer stays in card.go with the drawing it does.
package card

import (
	"golang.org/x/image/font"
)

// Data is what a card says.
type Data struct {
	Title      string
	Author     string
	Files      []string
	Visibility string
	FileCount  int
}

// Renderer draws cards. Safe for concurrent use: the faces it holds are read-only
// after New, and each Render draws onto its own image.
type Renderer struct {
	title font.Face
	meta  font.Face
	mark  font.Face
}
