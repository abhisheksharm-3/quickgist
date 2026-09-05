// Command ogimage writes the product's own link-preview card to a file.
//
// The card is a static asset rather than an endpoint: it never changes per request,
// and a crawler asking Vercel for it should not wait on a Render instance waking up.
// It is generated rather than drawn by hand so the brand card and the gist cards
// cannot drift apart, since both come from internal/card.
//
//	go run ./cmd/ogimage frontend/public/og.png
package main

import (
	"fmt"
	"os"

	"github.com/abhisheksharm-3/quickgist/internal/card"
)

const defaultPath = "frontend/public/og.png"

func main() {
	path := defaultPath
	if len(os.Args) > 1 {
		path = os.Args[1]
	}

	if err := write(path); err != nil {
		fmt.Fprintln(os.Stderr, "ogimage:", err)
		os.Exit(1)
	}

	fmt.Println("wrote", path)
}

func write(path string) error {
	renderer, err := card.New()
	if err != nil {
		return err
	}

	png, err := renderer.Site()
	if err != nil {
		return err
	}

	return os.WriteFile(path, png, 0o644)
}
