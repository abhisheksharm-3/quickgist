// What this package hands to the rest of the service, and what it reads off the
// wire while working it out.
//
// Verifier stays with the verification it performs: a type whose only reason to
// exist is the methods in one file belongs beside them.
package auth

// Identity is a verified caller.
type Identity struct {
	UserID string
	Email  string
	Role   string
}

type contextKey struct{}

// jwksDocument is the subset of a JWKS this verifier reads.
type jwksDocument struct {
	Keys []struct {
		Kid string `json:"kid"`
		Kty string `json:"kty"`
		Crv string `json:"crv"`
		X   string `json:"x"`
		Y   string `json:"y"`
	} `json:"keys"`
}
