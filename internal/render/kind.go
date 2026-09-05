// Kind classification and lexer selection for gist file content.
package render

import (
	"path/filepath"
	"strings"

	"github.com/alecthomas/chroma/v2"
	"github.com/alecthomas/chroma/v2/lexers"
)

// Kind is how a file was interpreted, so a client knows what it received.
type Kind string

const (
	KindMarkdown Kind = "markdown"
	KindCode     Kind = "code"
	KindText     Kind = "text"
	KindBinary   Kind = "binary"
)

// KindOf classifies a file from its metadata alone, for listings that carry no
// content. It agrees with Render for the same filename and language.
func KindOf(filename, language string) Kind {
	lang := strings.ToLower(strings.TrimSpace(language))

	if isMarkdown(filename, lang) {
		return KindMarkdown
	}
	if pickLexerByName(filename, lang) != nil {
		return KindCode
	}
	return KindText
}

// normalizeLanguage lowercases and trims a caller-supplied language, treating a nil
// pointer as unspecified.
func normalizeLanguage(language *string) string {
	if language == nil {
		return ""
	}
	return strings.ToLower(strings.TrimSpace(*language))
}

// isMarkdown reports whether content should be parsed as Markdown. An explicit
// language wins over the extension, so a file named .txt can be shared as Markdown.
func isMarkdown(filename, lang string) bool {
	if lang == "markdown" || lang == "md" {
		return true
	}
	_, ok := markdownExtensions[strings.ToLower(filepath.Ext(filename))]
	return ok
}

// pickLexer resolves a lexer for content, falling back to content analysis.
//
// Analysis is last because it is a guess, and a wrong guess renders worse than plain
// text for a file whose extension already told us nothing.
func pickLexer(filename, lang, content string) chroma.Lexer {
	if l := pickLexerByName(filename, lang); l != nil {
		return l
	}
	return lexers.Analyse(content)
}

// pickLexerByName resolves a lexer from metadata alone, preferring an explicit
// language over the filename.
func pickLexerByName(filename, lang string) chroma.Lexer {
	if lang != "" {
		if l := lexers.Get(lang); l != nil {
			return l
		}
	}
	return lexers.Match(filename)
}
