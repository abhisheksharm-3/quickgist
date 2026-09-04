// The HTML sanitizer policy applied to every rendered gist file.
package render

import (
	"github.com/microcosm-cc/bluemonday"
)

// newPolicy builds the sanitizer for rendered gist content.
//
// Everything it sees is written by an untrusted author, so the policy is an
// allowlist: any element or attribute not named here does not survive. The
// additions over bluemonday's UGC policy exist for two reasons only, chroma's
// highlight classes and the GFM elements goldmark emits.
//
// Schemes are limited to https and mailto. Allowing http would make every shared
// document a mixed-content warning, and data: URIs would turn an <img> into an
// exfiltration channel.
func newPolicy() *bluemonday.Policy {
	p := bluemonday.UGCPolicy()

	p.AllowAttrs("class").OnElements(
		"span", "code", "pre", "div", "table", "tbody", "tr", "td",
	)
	p.AllowAttrs("id").OnElements(
		"h1", "h2", "h3", "h4", "h5", "h6", "span", "a", "li", "div",
	)

	p.AllowAttrs("data-language").Matching(languagePattern).OnElements("div")

	p.AllowTables()
	p.AllowAttrs("align").OnElements("td", "th")
	p.AllowAttrs("type", "checked", "disabled").OnElements("input")
	p.AllowElements(
		"details", "summary", "kbd", "mark", "sup", "sub", "abbr", "figure", "figcaption",
	)
	p.AllowAttrs("title").OnElements("abbr", "a", "img")

	p.AllowImages()
	p.AllowStandardURLs()
	p.AllowURLSchemes("https", "mailto")
	p.RequireNoFollowOnLinks(true)
	p.RequireNoReferrerOnLinks(true)
	p.AddTargetBlankToFullyQualifiedLinks(true)

	return p
}
