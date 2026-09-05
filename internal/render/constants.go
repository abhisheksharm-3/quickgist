// The renderer's fixed choices: which version its output is, which palettes it
// draws with, which selectors scope them, and what it recognises as Markdown.
//
// rendererVersion is the cache key for every stored render, so a change to anything
// here that alters output must change it too.
//
// Kind's own constants stay in kind.go: they are the values of that type rather than
// settings, and a type's values belong with the type.
package render

import (
	"regexp"
)

// rendererVersion identifies the output format. Any change to the goldmark
// extensions, the chroma options, or the sanitizer policy must bump it, because
// Hash derives the render cache key from it and stale rows are detected by nothing
// else.
const rendererVersion = "r5"

const (
	lightStyle = oneLightStyleName
	darkStyle  = "onedark"
)

const (
	darkAttributeSelector  = `[data-theme="dark"]`
	systemDarkSelector     = `:root:not([data-theme="light"])`
	lightAttributeSelector = `[data-theme="light"]`
	systemLightSelector    = `:root:not([data-theme="dark"])`
)

// oneLightStyleName is the style registered below and used as lightStyle.
const oneLightStyleName = "one-light"

// languagePattern is what may reach the data-language attribute. The fence info
// string is written by the gist's author, so the value is matched rather than
// trusted, both here and again by the sanitizer.
var languagePattern = regexp.MustCompile(`^[A-Za-z0-9_+#.-]{1,32}$`)

var markdownExtensions = map[string]struct{}{
	".md":       {},
	".markdown": {},
	".mdown":    {},
	".mkd":      {},
	".mdx":      {},
}
