// Stylesheet generation for the highlight classes the renderer emits.
package render

import (
	"bytes"
	"fmt"
	"strings"

	chromahtml "github.com/alecthomas/chroma/v2/formatters/html"
	"github.com/alecthomas/chroma/v2/styles"
)

const (
	darkAttributeSelector = `[data-theme="dark"]`
	systemDarkSelector    = `:root:not([data-theme="light"])`
)

// CSS returns the stylesheet for rendered code in both themes.
//
// It covers three theme states, because there are three: an explicit dark choice, an
// explicit light choice, and the default of following the operating system. Emitting
// only the [data-theme="dark"] rules would leave a system-dark reader who never
// touched a toggle looking at dark-on-light code.
func (r *Renderer) CSS() (string, error) {
	light, err := themeCSS(lightStyle)
	if err != nil {
		return "", err
	}

	dark, err := themeCSS(darkStyle)
	if err != nil {
		return "", err
	}

	var b strings.Builder
	fmt.Fprintf(&b, "/* quickgist highlight theme: %s */\n", r.hash)
	b.WriteString(light)
	b.WriteString("\n@media (prefers-color-scheme: dark) {\n")
	b.WriteString(scopeCSS(dark, systemDarkSelector))
	b.WriteString("\n}\n")
	b.WriteString(scopeCSS(dark, darkAttributeSelector))
	b.WriteString("\n")

	return b.String(), nil
}

// themeCSS renders one chroma style as class-based CSS.
func themeCSS(style string) (string, error) {
	var buf bytes.Buffer
	if err := chromahtml.New(chromahtml.WithClasses(true)).WriteCSS(&buf, styles.Get(style)); err != nil {
		return "", fmt.Errorf("write css for style %s: %w", style, err)
	}
	return buf.String(), nil
}

// scopeCSS prefixes every selector with an ancestor so one theme's rules apply only
// under a condition.
//
// Chroma writes each rule as a comment followed by the selector on one line, so the
// selector begins after the comment rather than at the start of the line.
func scopeCSS(css, prefix string) string {
	lines := strings.Split(css, "\n")
	out := make([]string, 0, len(lines))

	for _, line := range lines {
		end := strings.Index(line, "*/")
		if end < 0 {
			out = append(out, line)
			continue
		}

		comment, selector := line[:end+2], strings.TrimLeft(line[end+2:], " ")
		if selector == "" {
			out = append(out, line)
			continue
		}

		out = append(out, comment+" "+prefix+" "+selector)
	}

	return strings.Join(out, "\n")
}
