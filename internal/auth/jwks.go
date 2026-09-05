// Fetching and caching the public keys Supabase signs access tokens with.
package auth

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Verifier validates access tokens against a cached JWKS.
type Verifier struct {
	jwksURL string
	issuer  string
	client  *http.Client

	mu        sync.RWMutex
	keys      map[string]*ecdsa.PublicKey
	fetchedAt time.Time
}

// NewVerifier builds a Verifier.
//
// Keys are fetched lazily on first use, so a slow or unreachable JWKS endpoint
// cannot stop the server from starting.
func NewVerifier(jwksURL, issuer string) *Verifier {
	return &Verifier{
		jwksURL: jwksURL,
		issuer:  issuer,
		client:  &http.Client{Timeout: fetchTimeout},
		keys:    map[string]*ecdsa.PublicKey{},
	}
}

// keyFor resolves the signing key a token names in its kid header.
//
// An unknown kid means either a key rotation or a forged header, so the key set is
// refetched at most once a minute. Without that backoff a stream of invented kids
// would turn this service into a request amplifier against the JWKS endpoint.
func (v *Verifier) keyFor(ctx context.Context) jwt.Keyfunc {
	return func(token *jwt.Token) (any, error) {
		kid, _ := token.Header["kid"].(string)
		if kid == "" {
			return nil, ErrUnauthenticated
		}

		key, found, stale := v.lookup(kid)
		if found {
			return key, nil
		}
		if !stale {
			return nil, ErrUnauthenticated
		}
		if err := v.refresh(ctx); err != nil {
			return nil, err
		}

		if key, found, _ = v.lookup(kid); !found {
			return nil, ErrUnauthenticated
		}
		return key, nil
	}
}

// lookup reads a cached key, also reporting whether the cache is old enough to be
// worth refetching.
func (v *Verifier) lookup(kid string) (key *ecdsa.PublicKey, found, stale bool) {
	v.mu.RLock()
	defer v.mu.RUnlock()

	key, found = v.keys[kid]
	return key, found, time.Since(v.fetchedAt) > refreshBackoff
}

// refresh replaces the cached key set from the JWKS endpoint.
func (v *Verifier) refresh(ctx context.Context) error {
	doc, err := v.fetchJWKS(ctx)
	if err != nil {
		return err
	}

	keys := parseKeys(doc)
	if len(keys) == 0 {
		return errors.New("jwks contained no usable P-256 keys")
	}

	v.mu.Lock()
	v.keys = keys
	v.fetchedAt = time.Now()
	v.mu.Unlock()

	return nil
}

// fetchJWKS downloads the key set.
func (v *Verifier) fetchJWKS(ctx context.Context) (*jwksDocument, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, v.jwksURL, nil)
	if err != nil {
		return nil, fmt.Errorf("build jwks request: %w", err)
	}

	resp, err := v.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch jwks: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("jwks endpoint returned %s", resp.Status)
	}

	var doc jwksDocument
	if err := json.NewDecoder(resp.Body).Decode(&doc); err != nil {
		return nil, fmt.Errorf("decode jwks: %w", err)
	}
	return &doc, nil
}

// parseKeys converts a key set into public keys, keeping only P-256 EC keys to
// match the single accepted signing method. A malformed entry is skipped rather
// than failing the whole set, so one bad key cannot lock every caller out.
func parseKeys(doc *jwksDocument) map[string]*ecdsa.PublicKey {
	keys := make(map[string]*ecdsa.PublicKey, len(doc.Keys))

	for _, k := range doc.Keys {
		if k.Kty != "EC" || k.Crv != "P-256" {
			continue
		}
		if key, err := parseP256Key(k.X, k.Y); err == nil {
			keys[k.Kid] = key
		}
	}

	return keys
}

// parseP256Key builds a public key from a JWK's base64url coordinates.
//
// ParseUncompressedPublicKey checks that the point is actually on the curve, which
// assigning X and Y directly cannot do; that raw-coordinate path is deprecated as
// of Go 1.26 for exactly this reason.
func parseP256Key(encodedX, encodedY string) (*ecdsa.PublicKey, error) {
	x, err := decodeCoordinate(encodedX)
	if err != nil {
		return nil, err
	}

	y, err := decodeCoordinate(encodedY)
	if err != nil {
		return nil, err
	}

	uncompressed := make([]byte, 0, 1+2*coordinateLength)
	uncompressed = append(uncompressed, 4)
	uncompressed = append(uncompressed, x...)
	uncompressed = append(uncompressed, y...)

	key, err := ecdsa.ParseUncompressedPublicKey(elliptic.P256(), uncompressed)
	if err != nil {
		return nil, fmt.Errorf("parse p-256 key: %w", err)
	}
	return key, nil
}

// decodeCoordinate decodes one coordinate and left-pads it, since an encoder may
// strip leading zero bytes that the fixed-width point encoding requires.
func decodeCoordinate(encoded string) ([]byte, error) {
	raw, err := base64.RawURLEncoding.DecodeString(encoded)
	if err != nil {
		return nil, fmt.Errorf("decode coordinate: %w", err)
	}
	if len(raw) > coordinateLength {
		return nil, errors.New("coordinate is too wide for p-256")
	}

	padded := make([]byte, coordinateLength)
	copy(padded[coordinateLength-len(raw):], raw)
	return padded, nil
}
