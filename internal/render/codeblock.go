// The wrapper written around every fenced code block in rendered Markdown.
package render

import (
	highlighting "github.com/yuin/goldmark-highlighting/v2"
	"github.com/yuin/goldmark/util"
)

// wrapCodeBlock writes the element around a fenced block, carrying the language the
// fence declared.
//
// The language is what lets the browser find the blocks it has to draw rather than
// print: chroma has no mermaid lexer and never will, so a mermaid fence arrives here
// unhighlighted and would otherwise be indistinguishable from any other plain block
// by the time it reaches the page.
//
// A block chroma did highlight already carries its own pre and code elements, so
// only the unhighlighted branch writes them.
func wrapCodeBlock(w util.BufWriter, ctx highlighting.CodeBlockContext, entering bool) {
	if !entering {
		if ctx.Highlighted() {
			_, _ = w.WriteString("</div>")
			return
		}
		_, _ = w.WriteString("</code></pre></div>")
		return
	}

	_, _ = w.WriteString(`<div class="code-block"`)

	if language, ok := ctx.Language(); ok && languagePattern.Match(language) {
		_, _ = w.WriteString(` data-language="`)
		_, _ = w.Write(language)
		_, _ = w.WriteString(`"`)
	}

	if ctx.Highlighted() {
		_, _ = w.WriteString(">")
		return
	}
	_, _ = w.WriteString(`><pre class="chroma"><code>`)
}
