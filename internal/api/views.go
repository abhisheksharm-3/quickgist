// Mapping from stored gists to the shape clients receive.
package api

import (
	"context"
	"github.com/abhisheksharm-3/quickgist/internal/domain"

	"github.com/abhisheksharm-3/quickgist/internal/render"
)

// view renders a gist for a client, filling the render cache on a miss.
func (a *API) view(ctx context.Context, g *domain.Gist) gistView {
	out := newGistView(g)

	for _, f := range g.Files {
		out.Files = append(out.Files, a.renderFile(ctx, g.Slug, f))
	}

	return out
}

// summaries strips file bodies from a listing.
//
// A feed of thirty gists does not need thirty rendered documents, and sending them
// would make the response enormous for no benefit.
func (a *API) summaries(gists []domain.Gist) []gistView {
	out := make([]gistView, 0, len(gists))

	for i := range gists {
		g := &gists[i]
		v := newGistView(g)

		for _, f := range g.Files {
			v.Files = append(v.Files, newFileView(g.Slug, f))
		}

		out = append(out, v)
	}

	return out
}

// newGistView copies a gist's metadata, leaving Files empty for the caller to fill.
func newGistView(g *domain.Gist) gistView {
	return gistView{
		Slug:        g.Slug,
		Title:       g.Title,
		Description: g.Description,
		Visibility:  g.Visibility,
		ViewCount:   g.ViewCount,
		CreatedAt:   g.CreatedAt,
		UpdatedAt:   g.UpdatedAt,
		ExpiresAt:   g.ExpiresAt,
		Author:      g.Author,
		Files:       make([]fileView, 0, len(g.Files)),
	}
}

// newFileView describes a file without rendering it.
func newFileView(slug string, f domain.File) fileView {
	v := fileView{
		Filename:      f.Filename,
		Language:      f.Language,
		ByteSize:      f.ByteSize,
		RawURL:        rawURL(slug, f.Filename),
		BlobExpiresAt: f.BlobExpiresAt,
	}

	if f.Content == nil {
		v.Kind = render.KindBinary
		return v
	}

	v.Kind = render.KindOf(f.Filename, languageOf(f.Language))
	return v
}

// renderFile produces a file's HTML, preferring a cached render from this renderer
// version and populating the cache when there is none.
func (a *API) renderFile(ctx context.Context, slug string, f domain.File) fileView {
	v := newFileView(slug, f)

	if f.Content == nil {
		return v
	}
	v.Content = f.Content

	if a.cachedRenderIsCurrent(f) {
		v.HTML = *f.RenderedHTML
		return v
	}

	html, kind, err := a.renderer.Render(f.Filename, f.Language, *f.Content)
	if err != nil {
		a.log.ErrorContext(ctx, "render file",
			"gist", slug, "file", f.Filename, "error", err)
		v.Kind = render.KindText
		return v
	}

	v.HTML = html
	v.Kind = kind
	a.cacheRenderInBackground(ctx, f.ID, html)

	return v
}

// cachedRenderIsCurrent reports whether a stored render came from this renderer
// version. One from an older version is ignored, which is what makes the renderer
// hash a working cache key rather than a comment.
func (a *API) cachedRenderIsCurrent(f domain.File) bool {
	return f.RenderedHTML != nil &&
		f.RendererHash != nil &&
		*f.RendererHash == a.renderer.Hash()
}

// cacheRenderInBackground writes the render cache without making the client wait.
//
// The request context is detached because it is about to be cancelled, and a cache
// write that fails costs a re-render rather than correctness.
func (a *API) cacheRenderInBackground(ctx context.Context, fileID, html string) {
	detached := context.WithoutCancel(ctx)

	go func() {
		writeCtx, cancel := context.WithTimeout(detached, cacheWriteTimeout)
		defer cancel()

		if err := a.store.CacheRender(writeCtx, fileID, html, a.renderer.Hash()); err != nil {
			a.log.ErrorContext(writeCtx, "cache render", "file", fileID, "error", err)
		}
	}()
}

// rawURL is where a file's unrendered source is served.
func rawURL(slug, filename string) string {
	return "/v1/gists/" + slug + "/raw/" + filename
}

// languageOf flattens an optional language for functions taking a plain string.
func languageOf(language *string) string {
	if language == nil {
		return ""
	}
	return *language
}
