// What a card says, as the API hands it over.
//
// Renderer stays in card.go with the drawing it does.
package card

// Data is what a card says.
type Data struct {
	Title      string
	Author     string
	Files      []string
	Visibility string
	FileCount  int
}
