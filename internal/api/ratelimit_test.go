package api

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/abhisheksharm-3/quickgist/internal/config"
)

// clientIP has to fail safe in both directions: keying on the socket alone puts the
// whole internet in one bucket behind a proxy, and trusting a forwarding header
// lets any caller mint a fresh bucket per request.
func TestClientIP(t *testing.T) {
	cases := []struct {
		name           string
		trustedProxies int
		remoteAddr     string
		forwardedFor   string
		want           string
	}{
		{
			name:           "no proxies trusted, header ignored",
			trustedProxies: 0,
			remoteAddr:     "203.0.113.9:5555",
			forwardedFor:   "1.1.1.1",
			want:           "203.0.113.9",
		},
		{
			name:           "one proxy, single entry",
			trustedProxies: 1,
			remoteAddr:     "10.0.0.1:5555",
			forwardedFor:   "203.0.113.9",
			want:           "203.0.113.9",
		},
		{
			name:           "one proxy, forged entries prepended",
			trustedProxies: 1,
			remoteAddr:     "10.0.0.1:5555",
			forwardedFor:   "1.1.1.1, 2.2.2.2, 203.0.113.9",
			want:           "203.0.113.9",
		},
		{
			name:           "two proxies",
			trustedProxies: 2,
			remoteAddr:     "10.0.0.1:5555",
			forwardedFor:   "203.0.113.9, 10.0.0.2",
			want:           "203.0.113.9",
		},
		{
			name:           "more hops trusted than present",
			trustedProxies: 5,
			remoteAddr:     "10.0.0.1:5555",
			forwardedFor:   "203.0.113.9",
			want:           "203.0.113.9",
		},
		{
			name:           "header absent falls back to socket",
			trustedProxies: 1,
			remoteAddr:     "203.0.113.9:5555",
			want:           "203.0.113.9",
		},
		{
			name:           "unparseable address falls back to socket",
			trustedProxies: 1,
			remoteAddr:     "203.0.113.9:5555",
			forwardedFor:   "not-an-ip",
			want:           "203.0.113.9",
		},
		{
			name:           "ipv6 socket",
			trustedProxies: 0,
			remoteAddr:     "[2001:db8::1]:5555",
			want:           "2001:db8::1",
		},
		{
			name:           "ipv6 forwarded",
			trustedProxies: 1,
			remoteAddr:     "10.0.0.1:5555",
			forwardedFor:   "2001:db8::1",
			want:           "2001:db8::1",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			a := &API{cfg: &config.Config{TrustedProxies: tc.trustedProxies}}

			r := httptest.NewRequest(http.MethodGet, "/", nil)
			r.RemoteAddr = tc.remoteAddr
			if tc.forwardedFor != "" {
				r.Header.Set("X-Forwarded-For", tc.forwardedFor)
			}

			if got := a.clientIP(r); got != tc.want {
				t.Errorf("clientIP() = %q, want %q", got, tc.want)
			}
		})
	}
}

// Two callers must not share a budget, which was the bug in the previous limiter.
func TestLimiterIsolatesCallers(t *testing.T) {
	l := newLimiter(1, 1)

	if !l.allow("1.1.1.1") {
		t.Fatal("the first request from a new caller was rejected")
	}
	if l.allow("1.1.1.1") {
		t.Error("a second immediate request from the same caller was allowed")
	}
	if !l.allow("2.2.2.2") {
		t.Error("a different caller was rejected because of the first caller's usage")
	}
}

func TestLimiterEvictsIdleCallers(t *testing.T) {
	l := newLimiter(1, 1)
	l.allow("1.1.1.1")

	l.evict(time.Hour)
	if len(l.visitors) != 1 {
		t.Errorf("a recently seen caller was evicted; %d remain", len(l.visitors))
	}

	l.evict(0)
	if len(l.visitors) != 0 {
		t.Errorf("an idle caller was not evicted; %d remain", len(l.visitors))
	}
}

func TestLevelForStatus(t *testing.T) {
	cases := []struct {
		status int
		want   string
	}{
		{status: http.StatusOK, want: "INFO"},
		{status: http.StatusNoContent, want: "INFO"},
		{status: http.StatusNotModified, want: "INFO"},
		{status: http.StatusBadRequest, want: "WARN"},
		{status: http.StatusNotFound, want: "WARN"},
		{status: http.StatusTooManyRequests, want: "WARN"},
		{status: http.StatusInternalServerError, want: "ERROR"},
		{status: http.StatusBadGateway, want: "ERROR"},
	}

	for _, tc := range cases {
		t.Run(http.StatusText(tc.status), func(t *testing.T) {
			if got := levelFor(tc.status).String(); got != tc.want {
				t.Errorf("levelFor(%d) = %s, want %s", tc.status, got, tc.want)
			}
		})
	}
}
