// Route table and the middleware stack wrapping it.
package api

import (
	"net/http"

	"github.com/klauspost/compress/gzhttp"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

// Handler builds the routed, wrapped handler and a function stopping its background
// work.
//
// Routing is the standard library's ServeMux. Go 1.22 gave it method matching and
// {slug} and {filename...} wildcards, which is everything julienschmidt/httprouter
// was carried for, and handlers read parameters with r.PathValue.
func (a *API) Handler() (http.Handler, func()) {
	mux := http.NewServeMux()
	a.registerRoutes(mux)

	stop := make(chan struct{})
	go a.previewLimiter.run(stop)

	stack := a.middlewareStack(stop)

	return gzhttp.GzipHandler(stack(mux)), func() { close(stop) }
}

// registerRoutes maps every path this service answers.
func (a *API) registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /v1/health", a.Health)
	mux.HandleFunc("HEAD /v1/health", a.Health)
	mux.HandleFunc("GET /v1/highlight.css", a.HighlightCSS)
	mux.HandleFunc("GET /v1/me", a.Me)
	mux.Handle("POST /v1/preview", a.rateLimit(a.previewLimiter)(http.HandlerFunc(a.Preview)))

	mux.HandleFunc("GET /v1/gists/search", a.SearchGists)
	mux.HandleFunc("GET /v1/gists", a.ListGists)
	mux.HandleFunc("POST /v1/gists", a.CreateGist)
	mux.HandleFunc("GET /v1/gists/{slug}", a.GetGist)
	mux.HandleFunc("PATCH /v1/gists/{slug}", a.UpdateGist)
	mux.HandleFunc("DELETE /v1/gists/{slug}", a.DeleteGist)
	mux.HandleFunc("PUT /v1/gists/{slug}/files", a.ReplaceGistFiles)
	mux.HandleFunc("POST /v1/gists/{slug}/files", a.UploadFile)
	mux.HandleFunc("GET /v1/gists/{slug}/raw/{filename...}", a.RawFile)

	mux.HandleFunc("/", a.notFound)
}

// middlewareStack orders the layers around every request.
//
// Tracing sits outside logging so a span covers the whole request including the
// response write. Authentication is innermost, so a rejected token is still logged,
// traced, and given CORS headers like any other response.
//
// Compression is applied by the caller, outside everything, because gzhttp handles
// what is easy to get wrong by hand: dropping Content-Length, leaving small bodies
// alone, and not re-compressing an already-compressed one. Gists are Markdown,
// source, and JSON, which is the most compressible payload there is.
func (a *API) middlewareStack(stop chan struct{}) middleware {
	mw := []middleware{
		a.recovery,
		a.tracing,
		a.sentryScope,
		a.logging,
		a.securityHeaders,
		a.cors,
	}

	if a.cfg.RateLimitEnabled {
		l := newLimiter(a.cfg.RateLimitRPS, a.cfg.RateLimitBurst)
		go l.run(stop)
		mw = append(mw, a.rateLimit(l))
	}

	return chain(append(mw, a.authenticate)...)
}

// tracing wraps a request in an OpenTelemetry span.
func (a *API) tracing(next http.Handler) http.Handler {
	return otelhttp.NewHandler(next, a.cfg.ServiceName,
		otelhttp.WithSpanNameFormatter(spanName))
}

// notFound answers unmatched paths in this API's error shape rather than the
// standard library's plain text.
func (a *API) notFound(w http.ResponseWriter, r *http.Request) {
	a.fail(w, r, http.StatusNotFound, codeNotFound, nil)
}

// spanName uses the matched route pattern, not the URL, so every gist does not
// become its own span name and destroy any chance of aggregation.
func spanName(_ string, r *http.Request) string {
	if r.Pattern != "" {
		return r.Pattern
	}
	return r.Method + " " + r.URL.Path
}
