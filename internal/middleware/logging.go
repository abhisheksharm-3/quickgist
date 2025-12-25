package middleware

import (
	"log"
	"net/http"
	"time"
)

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

// Logging returns middleware that logs HTTP requests.
func Logging(logger *log.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			wrapped := &responseWriter{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(wrapped, r)

			logger.Printf(
				"%s %s %s %d %v",
				r.RemoteAddr,
				r.Method,
				r.URL.Path,
				wrapped.status,
				time.Since(start),
			)
		})
	}
}
