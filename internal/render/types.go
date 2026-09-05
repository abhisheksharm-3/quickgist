// What this package produces and how it labels it.
//
// Renderer's methods stay in render.go, which Go allows: a type and its methods
// share a package, not a file.
package render

import (
	chromahtml "github.com/alecthomas/chroma/v2/formatters/html"
	"github.com/microcosm-cc/bluemonday"
	"github.com/yuin/goldmark"
)

// Kind is how a file was interpreted, so a client knows what it received.
type Kind string

// Renderer converts file content to HTML. Safe for concurrent use.
type Renderer struct {
	md     goldmark.Markdown
	code   *chromahtml.Formatter
	policy *bluemonday.Policy
	hash   string
}
