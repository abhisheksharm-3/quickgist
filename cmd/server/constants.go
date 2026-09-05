// The timeouts and sizes this process serves with.
//
// version is not here: it is a variable the build stamps with -ldflags, which makes
// it neither constant nor configuration.
package main

import (
	"time"
)

const (
	databaseConnectTimeout = 15 * time.Second
	readHeaderTimeout      = 5 * time.Second
	telemetryFlushTimeout  = 5 * time.Second
	maxHeaderBytes         = 1 << 20
)
