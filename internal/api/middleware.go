// Cross-cutting request middleware: recovery, tracing scope, logging, headers,
// CORS, and authentication.
package api

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/getsentry/sentry-go"

	"github.com/abhisheksharm-3/quickgist/internal/auth"
)

// chain applies middleware so the first argument is the outermost layer.
func chain(mw ...middleware) middleware {
	return func(next http.Handler) http.Handler {
		for i := len(mw) - 1; i >= 0; i-- {
			next = mw[i](next)
		}
		return next
	}
}

func (rec *recorder) WriteHeader(code int) {
	if rec.status == 0 {
		rec.status = code
		rec.ResponseWriter.WriteHeader(code)
	}
}

func (rec *recorder) Write(b []byte) (int, error) {
	if rec.status == 0 {
		rec.status = http.StatusOK
	}
	n, err := rec.ResponseWriter.Write(b)
	rec.bytes += n
	return n, err
}

// Unwrap exposes the real writer to http.ResponseController, so a handler that
// needs to flush a stream still can through this wrapper.
func (rec *recorder) Unwrap() http.ResponseWriter { return rec.ResponseWriter }

// statusOr returns the recorded status, defaulting to 200 for a handler that wrote
// nothing.
func (rec *recorder) statusOr() int {
	if rec.status == 0 {
		return http.StatusOK
	}
	return rec.status
}

// recovery turns a panic into a 500 rather than a dropped connection.
func (a *API) recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer a.recoverRequest(w, r)
		next.ServeHTTP(w, r)
	})
}

// recoverRequest handles a panicking request.
//
// http.ErrAbortHandler is re-panicked because the standard library defines it as the
// way to abandon a response deliberately; treating it as a fault would report a
// deliberate abort as a crash. This is the one place a panic is correct.
func (a *API) recoverRequest(w http.ResponseWriter, r *http.Request) {
	rec := recover()
	if rec == nil {
		return
	}
	// net/http documents ErrAbortHandler as the way to abandon a response, and only
	// propagating the panic aborts the connection as intended.
	if rec == http.ErrAbortHandler {
		panic(rec)
	}

	a.log.ErrorContext(r.Context(), "panic recovered",
		"panic", rec, "method", r.Method, "path", r.URL.Path)

	if hub := sentry.GetHubFromContext(r.Context()); hub != nil {
		hub.Recover(rec)
	} else {
		sentry.CurrentHub().Recover(rec)
	}

	a.fail(w, r, http.StatusInternalServerError, codeInternalError, nil)
}

// logging records one line per request at a level matching its status.
func (a *API) logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &recorder{ResponseWriter: w}

		next.ServeHTTP(rec, r)

		status := rec.statusOr()

		if isProbe(r) && status < http.StatusBadRequest {
			return
		}

		a.log.Log(r.Context(), levelFor(status), "request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", status,
			"bytes", rec.bytes,
			"duration", time.Since(start).String(),
			"ip", a.clientIP(r),
		)
	})
}

// isProbe reports whether a request is a platform health check.
//
// A successful one is logged at nothing. Render polls every ten seconds forever, so
// logging it buries every real request under 8,640 lines a day. A failing probe is
// still logged, because that is the case somebody needs to see.
func isProbe(r *http.Request) bool {
	if r.URL.Path != "/" && r.URL.Path != "/v1/health" {
		return false
	}
	return r.Method == http.MethodGet || r.Method == http.MethodHead
}

// levelFor maps an HTTP status onto a log level.
func levelFor(status int) slog.Level {
	switch {
	case status >= http.StatusInternalServerError:
		return slog.LevelError
	case status >= http.StatusBadRequest:
		return slog.LevelWarn
	default:
		return slog.LevelInfo
	}
}

// sentryScope gives each request its own hub, so a report carries that request's
// context and concurrent requests cannot mix scopes.
func (a *API) sentryScope(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if sentry.CurrentHub().Client() == nil {
			next.ServeHTTP(w, r)
			return
		}

		hub := sentry.CurrentHub().Clone()
		hub.Scope().SetRequest(r)
		next.ServeHTTP(w, r.WithContext(sentry.SetHubOnContext(r.Context(), hub)))
	})
}

// securityHeaders applies the strictest policy a JSON API can, since it never
// serves a document that should load anything.
func (a *API) securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Cross-Origin-Resource-Policy", "same-site")

		if !a.cfg.Development() {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		next.ServeHTTP(w, r)
	})
}

// cors echoes only origins from the configured allowlist.
//
// A preflight answers 204 because it has no body, and Vary: Origin stops a cache
// from serving one origin's CORS headers to another.
func (a *API) cors(next http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(a.cfg.AllowedOrigins))
	for _, o := range a.cfg.AllowedOrigins {
		allowed[o] = struct{}{}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if origin := r.Header.Get("Origin"); origin != "" {
			if _, ok := allowed[origin]; ok {
				setCORSHeaders(w, origin)
			}
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// setCORSHeaders grants one origin access.
func setCORSHeaders(w http.ResponseWriter, origin string) {
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
	w.Header().Set("Access-Control-Max-Age", "86400")
	w.Header().Add("Vary", "Origin")
}

// authenticate verifies a bearer token when the request carries one.
//
// No credentials means anonymous, which is a valid caller: anyone may create and
// read a gist without an account. Invalid credentials are a hard 401, because a
// caller who sent a token intended to be someone.
func (a *API) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := auth.BearerToken(r)
		if token == "" {
			next.ServeHTTP(w, r)
			return
		}

		id, err := a.verifier.Verify(r.Context(), token)
		if err != nil {
			a.fail(w, r, http.StatusUnauthorized, codeUnauthenticated, err)
			return
		}

		if hub := sentry.GetHubFromContext(r.Context()); hub != nil {
			hub.Scope().SetUser(sentry.User{ID: id.UserID})
		}

		next.ServeHTTP(w, r.WithContext(auth.WithIdentity(r.Context(), id)))
	})
}
