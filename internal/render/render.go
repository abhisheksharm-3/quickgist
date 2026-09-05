// Package render converts gist file content into sanitized HTML on the server, so
// the browser ships no syntax highlighter.
package render

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/alecthomas/chroma/v2"
	chromahtml "github.com/alecthomas/chroma/v2/formatters/html"
	"github.com/alecthomas/chroma/v2/styles"
	"github.com/yuin/goldmark"
	highlighting "github.com/yuin/goldmark-highlighting/v2"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	goldmarkhtml "github.com/yuin/goldmark/renderer/html"
)

// New builds a Renderer with the Markdown extensions, highlighter, and sanitizer
// policy fixed for the life of the process.
func New() *Renderer {
	formatter := chromahtml.New(
		chromahtml.WithClasses(true),
		chromahtml.WithLineNumbers(true),
		chromahtml.LineNumbersInTable(true),
		chromahtml.WithLinkableLineNumbers(true, "L"),
	)

	return &Renderer{
		md:     newMarkdown(),
		code:   formatter,
		policy: newPolicy(),
		hash:   fmt.Sprintf("%s-%s-%s", rendererVersion, lightStyle, darkStyle),
	}
}

// newMarkdown builds the Markdown parser.
//
// Raw HTML is enabled and then removed by the sanitizer. Disabling it here instead
// would mangle legitimate Markdown containing a <kbd> or a <details>, rather than
// stripping only what is dangerous.
//
// Hard wraps are off, which is how a .md file renders everywhere else. With them on,
// a document whose author wrapped their paragraphs at 80 columns rendered with a
// line break at every one of those columns.
func newMarkdown() goldmark.Markdown {
	return goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,
			extension.Footnote,
			extension.DefinitionList,
			extension.Typographer,
			highlighting.NewHighlighting(
				highlighting.WithStyle(lightStyle),
				highlighting.WithFormatOptions(
					chromahtml.WithClasses(true),
					chromahtml.WithLineNumbers(false),
				),
				highlighting.WithWrapperRenderer(wrapCodeBlock),
			),
		),
		goldmark.WithParserOptions(parser.WithAutoHeadingID()),
		goldmark.WithRendererOptions(goldmarkhtml.WithUnsafe()),
	)
}

// Hash identifies this renderer's output format. Cached HTML stored under a
// different hash is stale and must be re-rendered.
func (r *Renderer) Hash() string { return r.hash }

// Render converts content to sanitized HTML and reports how it was interpreted.
//
// A lexer that fails on its input degrades to plain text rather than returning an
// error, because a file the reader could still read is worth serving.
func (r *Renderer) Render(filename string, language *string, content string) (string, Kind, error) {
	lang := normalizeLanguage(language)

	if isMarkdown(filename, lang) {
		out, err := r.renderMarkdown(content)
		return out, KindMarkdown, err
	}

	lexer := pickLexer(filename, lang, content)
	if lexer == nil {
		return r.renderPlain(content), KindText, nil
	}

	out, err := r.renderCode(lexer, content)
	if err != nil {
		return r.renderPlain(content), KindText, nil
	}
	return out, KindCode, nil
}

func (r *Renderer) renderMarkdown(content string) (string, error) {
	var buf bytes.Buffer
	if err := r.md.Convert([]byte(content), &buf); err != nil {
		return "", fmt.Errorf("render markdown: %w", err)
	}
	return r.policy.Sanitize(buf.String()), nil
}

func (r *Renderer) renderCode(lexer chroma.Lexer, content string) (string, error) {
	iterator, err := chroma.Coalesce(lexer).Tokenise(nil, content)
	if err != nil {
		return "", fmt.Errorf("tokenise %s: %w", lexer.Config().Name, err)
	}

	var buf bytes.Buffer
	if err := r.code.Format(&buf, styles.Get(lightStyle), iterator); err != nil {
		return "", fmt.Errorf("format %s: %w", lexer.Config().Name, err)
	}
	return r.policy.Sanitize(buf.String()), nil
}

// renderPlain is the fallback for content no lexer claims. Escaping happens before
// sanitizing, so the sanitizer sees a document whose only tags are the two added here.
func (r *Renderer) renderPlain(content string) string {
	var buf bytes.Buffer
	buf.WriteString(`<pre class="chroma"><code>`)
	buf.WriteString(escapeText(content))
	buf.WriteString(`</code></pre>`)
	return r.policy.Sanitize(buf.String())
}

// escapeText HTML-escapes content destined for a text node.
func escapeText(s string) string {
	var b strings.Builder
	b.Grow(len(s))

	for _, r := range s {
		switch r {
		case '&':
			b.WriteString("&amp;")
		case '<':
			b.WriteString("&lt;")
		case '>':
			b.WriteString("&gt;")
		case '"':
			b.WriteString("&#34;")
		case '\'':
			b.WriteString("&#39;")
		default:
			b.WriteRune(r)
		}
	}

	return b.String()
}
