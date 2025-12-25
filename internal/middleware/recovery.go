package middleware

import (
	"log"
	"net/http"
)

// Recovery returns middleware that recovers from panics.
func Recovery(errorLog *log.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					w.Header().Set("Connection", "close")
					errorLog.Printf("panic recovered: %v", err)
					http.Error(w,
						http.StatusText(http.StatusInternalServerError),
						http.StatusInternalServerError,
					)
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}
