package auth

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	testIssuer = "https://project.supabase.co/auth/v1"
	testKid    = "test-key-1"
	testSub    = "d409a813-403e-4353-a5ee-4c66133e1788"
)

// jwksServer serves a key set for one ECDSA key and counts how often it is fetched.
type jwksServer struct {
	*httptest.Server
	fetches *atomic.Int64
}

// uncompressedPoint returns the SEC 1 uncompressed encoding of a public key, which
// is 0x04 followed by the two fixed-width coordinates.
func uncompressedPoint(t *testing.T, key *ecdsa.PrivateKey) []byte {
	t.Helper()

	raw, err := key.PublicKey.Bytes()
	if err != nil {
		t.Fatalf("encode public key: %v", err)
	}
	if want := 1 + 2*coordinateLength; len(raw) != want {
		t.Fatalf("encoded length = %d, want %d", len(raw), want)
	}
	return raw
}

// newJWKSServer starts a JWKS endpoint publishing kid for the given key.
func newJWKSServer(t *testing.T, kid string, key *ecdsa.PrivateKey) *jwksServer {
	t.Helper()

	var fetches atomic.Int64
	point := uncompressedPoint(t, key)
	x, y := point[1:1+coordinateLength], point[1+coordinateLength:]

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		fetches.Add(1)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"keys": []map[string]string{{
				"kid": kid,
				"kty": "EC",
				"crv": "P-256",
				"x":   base64.RawURLEncoding.EncodeToString(x),
				"y":   base64.RawURLEncoding.EncodeToString(y),
			}},
		})
	}))
	t.Cleanup(srv.Close)

	return &jwksServer{Server: srv, fetches: &fetches}
}

// signToken issues a token with the given claims, signed by key under kid.
func signToken(t *testing.T, key *ecdsa.PrivateKey, kid string, claims jwt.MapClaims) string {
	t.Helper()

	token := jwt.NewWithClaims(jwt.SigningMethodES256, claims)
	token.Header["kid"] = kid

	signed, err := token.SignedString(key)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return signed
}

// validClaims are the claims Supabase puts on a signed-in user's access token.
func validClaims() jwt.MapClaims {
	return jwt.MapClaims{
		"sub":   testSub,
		"iss":   testIssuer,
		"aud":   "authenticated",
		"role":  "authenticated",
		"email": "person@example.com",
		"exp":   time.Now().Add(time.Hour).Unix(),
		"iat":   time.Now().Unix(),
	}
}

func newTestKey(t *testing.T) *ecdsa.PrivateKey {
	t.Helper()

	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	return key
}

func TestVerifyAcceptsAValidToken(t *testing.T) {
	key := newTestKey(t)
	srv := newJWKSServer(t, testKid, key)
	v := NewVerifier(srv.URL, testIssuer)

	id, err := v.Verify(context.Background(), signToken(t, key, testKid, validClaims()))
	if err != nil {
		t.Fatalf("Verify: %v", err)
	}

	if id.UserID != testSub {
		t.Errorf("UserID = %q, want %q", id.UserID, testSub)
	}
	if id.Email != "person@example.com" {
		t.Errorf("Email = %q, want person@example.com", id.Email)
	}
	if id.Role != "authenticated" {
		t.Errorf("Role = %q, want authenticated", id.Role)
	}
}

// Each case is a token a caller might present to become someone they are not.
func TestVerifyRejectsUntrustworthyTokens(t *testing.T) {
	key := newTestKey(t)
	other := newTestKey(t)

	tamper := func(mutate func(jwt.MapClaims)) jwt.MapClaims {
		c := validClaims()
		mutate(c)
		return c
	}

	cases := []struct {
		name  string
		token func(t *testing.T) string
	}{
		{
			name:  "signed by a different key",
			token: func(t *testing.T) string { return signToken(t, other, testKid, validClaims()) },
		},
		{
			name: "expired",
			token: func(t *testing.T) string {
				return signToken(t, key, testKid, tamper(func(c jwt.MapClaims) {
					c["exp"] = time.Now().Add(-time.Minute).Unix()
				}))
			},
		},
		{
			name: "no expiry at all",
			token: func(t *testing.T) string {
				return signToken(t, key, testKid, tamper(func(c jwt.MapClaims) {
					delete(c, "exp")
				}))
			},
		},
		{
			name: "wrong issuer",
			token: func(t *testing.T) string {
				return signToken(t, key, testKid, tamper(func(c jwt.MapClaims) {
					c["iss"] = "https://attacker.example/auth/v1"
				}))
			},
		},
		{
			name: "wrong audience",
			token: func(t *testing.T) string {
				return signToken(t, key, testKid, tamper(func(c jwt.MapClaims) {
					c["aud"] = "anon"
				}))
			},
		},
		{
			name: "no subject",
			token: func(t *testing.T) string {
				return signToken(t, key, testKid, tamper(func(c jwt.MapClaims) {
					delete(c, "sub")
				}))
			},
		},
		{
			name:  "unknown key id",
			token: func(t *testing.T) string { return signToken(t, key, "not-a-real-kid", validClaims()) },
		},
		{
			name: "no key id in the header",
			token: func(t *testing.T) string {
				token := jwt.NewWithClaims(jwt.SigningMethodES256, validClaims())
				signed, err := token.SignedString(key)
				if err != nil {
					t.Fatalf("sign: %v", err)
				}
				return signed
			},
		},
		{
			name: "unsigned, alg none",
			token: func(t *testing.T) string {
				token := jwt.NewWithClaims(jwt.SigningMethodNone, validClaims())
				token.Header["kid"] = testKid
				signed, err := token.SignedString(jwt.UnsafeAllowNoneSignatureType)
				if err != nil {
					t.Fatalf("sign: %v", err)
				}
				return signed
			},
		},
		{
			name:  "not a token at all",
			token: func(*testing.T) string { return "nonsense" },
		},
		{
			name:  "empty",
			token: func(*testing.T) string { return "" },
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			srv := newJWKSServer(t, testKid, key)
			v := NewVerifier(srv.URL, testIssuer)

			if _, err := v.Verify(context.Background(), tc.token(t)); !errors.Is(err, ErrUnauthenticated) {
				t.Errorf("got error %v, want ErrUnauthenticated", err)
			}
		})
	}
}

// An HS256 token whose secret is the ES256 public key is the classic algorithm
// confusion attack, and WithValidMethods is what stops it.
func TestVerifyRejectsAlgorithmConfusion(t *testing.T) {
	key := newTestKey(t)
	srv := newJWKSServer(t, testKid, key)
	v := NewVerifier(srv.URL, testIssuer)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, validClaims())
	token.Header["kid"] = testKid

	forged, err := token.SignedString(uncompressedPoint(t, key))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	if _, err := v.Verify(context.Background(), forged); !errors.Is(err, ErrUnauthenticated) {
		t.Errorf("an HS256 token was accepted: %v", err)
	}
}

// A caller sending invented key ids must not be able to turn this service into a
// request amplifier against the JWKS endpoint.
func TestVerifyThrottlesRefetchOnUnknownKeyID(t *testing.T) {
	key := newTestKey(t)
	srv := newJWKSServer(t, testKid, key)
	v := NewVerifier(srv.URL, testIssuer)

	for i := 0; i < 20; i++ {
		_, _ = v.Verify(context.Background(), signToken(t, key, "bogus-kid", validClaims()))
	}

	if fetches := srv.fetches.Load(); fetches > 1 {
		t.Errorf("jwks fetched %d times for 20 bogus key ids, want at most 1", fetches)
	}
}

func TestVerifyFailsWhenJWKSIsUnavailable(t *testing.T) {
	key := newTestKey(t)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer srv.Close()

	v := NewVerifier(srv.URL, testIssuer)

	if _, err := v.Verify(context.Background(), signToken(t, key, testKid, validClaims())); err == nil {
		t.Error("a token was accepted while the key set was unreachable")
	}
}

func TestBearerToken(t *testing.T) {
	cases := []struct {
		name   string
		header string
		want   string
	}{
		{name: "standard", header: "Bearer abc.def.ghi", want: "abc.def.ghi"},
		{name: "lowercase scheme", header: "bearer abc", want: "abc"},
		{name: "mixed case scheme", header: "BeArEr abc", want: "abc"},
		{name: "surrounding space", header: "Bearer   abc  ", want: "abc"},
		{name: "absent", header: "", want: ""},
		{name: "wrong scheme", header: "Basic abc", want: ""},
		{name: "scheme only", header: "Bearer", want: ""},
		{name: "scheme and space only", header: "Bearer ", want: ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodGet, "/", nil)
			if tc.header != "" {
				r.Header.Set("Authorization", tc.header)
			}

			if got := BearerToken(r); got != tc.want {
				t.Errorf("BearerToken() = %q, want %q", got, tc.want)
			}
		})
	}
}

func TestIdentityRoundTripsThroughContext(t *testing.T) {
	want := Identity{UserID: testSub, Email: "a@b.c", Role: "authenticated"}

	got, ok := FromContext(WithIdentity(context.Background(), want))
	if !ok {
		t.Fatal("identity was not found on the context")
	}
	if got != want {
		t.Errorf("got %+v, want %+v", got, want)
	}

	if _, ok := FromContext(context.Background()); ok {
		t.Error("an empty context reported an identity")
	}
}

// A coordinate with stripped leading zeros still has to produce a usable key, since
// the fixed-width point encoding requires the padding back.
func TestDecodeCoordinatePadsToWidth(t *testing.T) {
	got, err := decodeCoordinate(base64.RawURLEncoding.EncodeToString([]byte{0x01, 0x02}))
	if err != nil {
		t.Fatalf("decodeCoordinate: %v", err)
	}
	if len(got) != coordinateLength {
		t.Fatalf("length = %d, want %d", len(got), coordinateLength)
	}
	if got[coordinateLength-2] != 0x01 || got[coordinateLength-1] != 0x02 {
		t.Errorf("value was not right-aligned: %x", got)
	}
}

func TestParseP256KeyRejectsBadInput(t *testing.T) {
	valid := base64.RawURLEncoding.EncodeToString(make([]byte, coordinateLength))

	cases := []struct {
		name string
		x, y string
	}{
		{name: "not base64", x: "!!!", y: valid},
		{name: "coordinate too wide", x: base64.RawURLEncoding.EncodeToString(make([]byte, 40)), y: valid},
		{name: "point not on the curve", x: valid, y: valid},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := parseP256Key(tc.x, tc.y); err == nil {
				t.Error("expected an error")
			}
		})
	}
}
