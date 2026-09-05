// What this package returns when a caller is not who they say they are.
package auth

import (
	"errors"
)

// ErrUnauthenticated is returned for any token that cannot be trusted.
//
// It is deliberately opaque. Telling a caller which check their token failed helps
// an attacker more than it helps a client.
var ErrUnauthenticated = errors.New("unauthenticated")
