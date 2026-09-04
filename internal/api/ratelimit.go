// Per-client rate limiting and the client address resolution it depends on.
package api

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

const (
	visitorIdleTimeout = 3 * time.Minute
	evictInterval      = time.Minute
)

// limiter is a token bucket per client address.
type limiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	rate     rate.Limit
	burst    int
}

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// newLimiter builds a limiter allowing rps requests a second with the given burst.
func newLimiter(rps, burst int) *limiter {
	return &limiter{
		visitors: map[string]*visitor{},
		rate:     rate.Limit(rps),
		burst:    burst,
	}
}

// allow reports whether this key has budget remaining.
func (l *limiter) allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	v, ok := l.visitors[key]
	if !ok {
		v = &visitor{limiter: rate.NewLimiter(l.rate, l.burst)}
		l.visitors[key] = v
	}

	v.lastSeen = time.Now()
	return v.limiter.Allow()
}

// evict drops idle buckets. Without it the map grows by one entry per distinct
// client address and never shrinks.
func (l *limiter) evict(olderThan time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()

	for k, v := range l.visitors {
		if time.Since(v.lastSeen) > olderThan {
			delete(l.visitors, k)
		}
	}
}

// run evicts idle buckets until stop is closed.
func (l *limiter) run(stop <-chan struct{}) {
	ticker := time.NewTicker(evictInterval)
	defer ticker.Stop()

	for {
		select {
		case <-stop:
			return
		case <-ticker.C:
			l.evict(visitorIdleTimeout)
		}
	}
}

// rateLimit rejects a caller over budget with 429 and a Retry-After.
func (a *API) rateLimit(l *limiter) middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !l.allow(a.clientIP(r)) {
				w.Header().Set("Retry-After", "1")
				a.fail(w, r, http.StatusTooManyRequests, codeRateLimited, nil)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// clientIP resolves the caller's address for rate limiting.
//
// Two opposite mistakes are possible here. Keying on RemoteAddr alone means every
// caller behind a proxy shares one bucket, which makes the limit a global kill
// switch. Trusting X-Forwarded-For means any caller can forge a fresh bucket per
// request.
//
// So TRUSTED_PROXIES states how many proxy hops actually sit in front of this
// server, and the address is read from that position counting back from the right,
// which is the last entry a trusted proxy appended and the first a client cannot
// control. Zero trusts no header at all.
func (a *API) clientIP(r *http.Request) string {
	hops := a.cfg.TrustedProxies
	if hops <= 0 {
		return socketIP(r)
	}

	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded == "" {
		return socketIP(r)
	}

	parts := strings.Split(forwarded, ",")
	idx := len(parts) - hops
	if idx < 0 {
		idx = 0
	}

	ip := strings.TrimSpace(parts[idx])
	if net.ParseIP(ip) == nil {
		return socketIP(r)
	}
	return ip
}

// socketIP returns the peer address of the connection itself.
func socketIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
