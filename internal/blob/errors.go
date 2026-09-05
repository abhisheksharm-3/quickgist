// What this package returns when an object is not there.
package blob

import (
	"errors"
)

// ErrNotFound means no object exists at that path.
var ErrNotFound = errors.New("blob not found")
