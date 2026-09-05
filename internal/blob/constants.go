// The timings and sizes of talking to object storage, and of sweeping it.
package blob

import (
	"time"
)

const (
	requestTimeout = 60 * time.Second
	idleTimeout    = 90 * time.Second
	maxIdleConns   = 50
	maxIdlePerHost = 10
	errorBodyLimit = 512
	drainLimit     = 4 << 10
)

const (
	sweepInterval = 10 * time.Minute
	sweepBatch    = 100
)
