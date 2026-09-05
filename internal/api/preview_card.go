// Link previews: the card image, and the HTML document that points a crawler at it.
package api

import (
	"html"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/abhisheksharm-3/quickgist/internal/card"
	"github.com/abhisheksharm-3/quickgist/internal/store"
)

// OGImage handles GET /v1/gists/{slug}/og.png.
//
// The image is drawn per request rather than stored. Drawing costs about a
// millisecond, and storing it would mean invalidating it on every edit, which is
// more machinery than the thing it saves.
func (a *API) OGImage(w http.ResponseWriter, r *http.Request) {
	gist, err := a.store.GetGistMeta(r.Context(), a.identity(r), r.PathValue("slug"))
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	png, err := a.cards.Render(cardData(gist))
	if err != nil {
		a.fail(w, r, http.StatusInternalServerError, codeInternalError, err)
		return
	}

	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Content-Length", strconv.Itoa(len(png)))
	w.Header().Set("Cache-Control", previewCacheControl)
	w.WriteHeader(http.StatusOK)

	if _, err := w.Write(png); err != nil {
		a.log.DebugContext(r.Context(), "client closed connection mid-card", "error", err)
	}
}

// PreviewHTML handles GET /v1/gists/{slug}/preview.html.
//
// Crawlers do not run JavaScript, so the metadata React renders on the gist page is
// invisible to them and a link pasted into a chat previews as nothing. This is the
// document they get instead: the same facts as meta tags, and a redirect for a
// person who somehow follows the URL. The frontend routes crawler user agents here.
func (a *API) PreviewHTML(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	gist, err := a.store.GetGistMeta(r.Context(), a.identity(r), slug)
	if err != nil {
		a.failFromStore(w, r, err)
		return
	}

	pageURL := a.cfg.PublicBaseURL + "/g/" + slug
	imageURL := a.apiBaseURL(r) + "/v1/gists/" + slug + "/og.png"

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", previewCacheControl)
	w.Header().Set("Vary", "Host")
	w.WriteHeader(http.StatusOK)

	if _, err := io.WriteString(w, previewDocument(gist, pageURL, imageURL)); err != nil {
		a.log.DebugContext(r.Context(), "client closed connection mid-preview", "error", err)
	}
}

// previewDocument builds the metadata document.
//
// Every value is escaped as HTML text and then sits inside a quoted attribute, since
// a gist's title and description are written by whoever made it.
func previewDocument(gist *store.Gist, pageURL, imageURL string) string {
	title := html.EscapeString(gist.Title)
	description := html.EscapeString(previewDescription(gist))

	var b strings.Builder
	b.WriteString("<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n")
	b.WriteString("<title>" + title + " · quickgist</title>\n")
	b.WriteString(`<meta name="description" content="` + description + "\">\n")
	b.WriteString(`<meta property="og:type" content="article">` + "\n")
	b.WriteString(`<meta property="og:site_name" content="quickgist">` + "\n")
	b.WriteString(`<meta property="og:title" content="` + title + "\">\n")
	b.WriteString(`<meta property="og:description" content="` + description + "\">\n")
	b.WriteString(`<meta property="og:url" content="` + html.EscapeString(pageURL) + "\">\n")
	b.WriteString(`<meta property="og:image" content="` + html.EscapeString(imageURL) + "\">\n")
	b.WriteString(`<meta property="og:image:width" content="1200">` + "\n")
	b.WriteString(`<meta property="og:image:height" content="630">` + "\n")
	b.WriteString(`<meta name="twitter:card" content="summary_large_image">` + "\n")
	b.WriteString(`<link rel="canonical" href="` + html.EscapeString(pageURL) + "\">\n")
	b.WriteString(`<meta http-equiv="refresh" content="0; url=` + html.EscapeString(pageURL) + "\">\n")
	b.WriteString("</head>\n<body>\n")
	b.WriteString(`<p><a href="` + html.EscapeString(pageURL) + `">` + title + "</a></p>\n")
	b.WriteString("</body>\n</html>\n")

	return b.String()
}

// apiBaseURL is where this service is reachable, for naming the card in a document
// that is cacheable.
//
// API_BASE_URL is preferred and the request's own Host is only a fallback, because
// Host is the client's to choose and this document is served with a public
// Cache-Control. A shared cache keyed on the path alone would otherwise let one
// crafted request store a preview whose og:image points wherever its sender liked,
// for every crawler that asked afterwards. The fallback still ships Vary: Host, so
// a cache that honours it keys the two apart.
func (a *API) apiBaseURL(r *http.Request) string {
	if a.cfg.APIBaseURL != "" {
		return a.cfg.APIBaseURL
	}
	return requestBaseURL(r)
}

// requestBaseURL is the origin the request itself reports.
func requestBaseURL(r *http.Request) string {
	scheme := "http"
	if forwarded := r.Header.Get("X-Forwarded-Proto"); forwarded != "" {
		scheme = forwarded
	} else if r.TLS != nil {
		scheme = "https"
	}
	return scheme + "://" + r.Host
}

// previewDescription is the gist's own description, or its shape when it has none.
func previewDescription(gist *store.Gist) string {
	if strings.TrimSpace(gist.Description) != "" {
		return gist.Description
	}

	names := make([]string, 0, len(gist.Files))
	for _, f := range gist.Files {
		names = append(names, f.Filename)
	}

	if len(names) == 0 {
		return "A gist on quickgist."
	}
	return strings.Join(names, ", ") + " · rendered on quickgist."
}

// cardData flattens a gist into what the card draws.
func cardData(gist *store.Gist) card.Data {
	data := card.Data{
		Title:      gist.Title,
		Visibility: gist.Visibility,
		FileCount:  len(gist.Files),
	}

	if gist.Author != nil {
		data.Author = gist.Author.Handle
	}
	for _, f := range gist.Files {
		data.Files = append(data.Files, f.Filename)
	}

	return data
}
