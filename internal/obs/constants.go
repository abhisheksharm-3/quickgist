// How long a shutdown waits for buffered telemetry.
package obs

import (
	"time"
)

const flushTimeout = 5 * time.Second
