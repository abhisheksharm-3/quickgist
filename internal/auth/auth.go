// Package auth verifies Supabase access tokens. Every identity in the system
// originates here and nowhere else.
package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// ErrUnauthenticated is returned for any token that cannot be trusted.
//
// It is deliberately opaque. Telling a caller which check their token failed helps
// an attacker more than it helps a client.
var ErrUnauthenticated = errors.New("unauthenticated")

// signingMethod is the only accepted algorithm, matching what Supabase signs access
// tokens with. Constraining it is what makes algorithm confusion impossible: a token
// asking to be verified as HS256 against the public key is refused before the key is
// looked up.
const signingMethod = "ES256"

// tokenAudience is the aud claim Supabase sets on a signed-in user's token.
const tokenAudience = "authenticated"

// Identity is a verified caller.
type Identity struct {
	UserID string
	Email  string
	Role   string
}

type contextKey struct{}

// WithIdentity stores a verified identity on the context.
func WithIdentity(ctx context.Context, id Identity) context.Context {
	return context.WithValue(ctx, contextKey{}, id)
}

// FromContext returns the verified identity, if the request carried one.
func FromContext(ctx context.Context) (Identity, bool) {
	id, ok := ctx.Value(contextKey{}).(Identity)
	return id, ok
}

// BearerToken extracts a token from the Authorization header, returning an empty
// string when the request carries none.
func BearerToken(r *http.Request) string {
	const prefix = "bearer "

	h := r.Header.Get("Authorization")
	if len(h) <= len(prefix) || !strings.EqualFold(h[:len(prefix)], prefix) {
		return ""
	}
	return strings.TrimSpace(h[len(prefix):])
}

// Verify validates a token and returns the identity it asserts, or
// ErrUnauthenticated.
func (v *Verifier) Verify(ctx context.Context, raw string) (Identity, error) {
	token, err := jwt.Parse(raw, v.keyFor(ctx),
		jwt.WithValidMethods([]string{signingMethod}),
		jwt.WithIssuer(v.issuer),
		jwt.WithAudience(tokenAudience),
		jwt.WithExpirationRequired(),
	)
	if err != nil || !token.Valid {
		return Identity{}, ErrUnauthenticated
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return Identity{}, ErrUnauthenticated
	}

	return identityFromClaims(claims)
}

// identityFromClaims reads the caller out of verified claims. A token without a
// subject identifies nobody and is rejected.
func identityFromClaims(claims jwt.MapClaims) (Identity, error) {
	sub, _ := claims["sub"].(string)
	if sub == "" {
		return Identity{}, ErrUnauthenticated
	}

	email, _ := claims["email"].(string)
	role, _ := claims["role"].(string)
	if role == "" {
		role = tokenAudience
	}

	return Identity{UserID: sub, Email: email, Role: role}, nil
}
