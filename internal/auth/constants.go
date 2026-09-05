// The fixed facts of Supabase token verification: the one algorithm accepted, the
// audience required, and the timings of the key fetch.
//
// Accepting exactly one signing method is what makes algorithm confusion impossible,
// so it is a constant rather than a setting.
package auth

import (
	"time"
)

// signingMethod is the only accepted algorithm, matching what Supabase signs access
// tokens with. Constraining it is what makes algorithm confusion impossible: a token
// asking to be verified as HS256 against the public key is refused before the key is
// looked up.
const signingMethod = "ES256"

// tokenAudience is the aud claim Supabase sets on a signed-in user's token.
const tokenAudience = "authenticated"

const (
	fetchTimeout   = 5 * time.Second
	refreshBackoff = time.Minute
)

// coordinateLength is the byte width of one P-256 coordinate.
const coordinateLength = 32
