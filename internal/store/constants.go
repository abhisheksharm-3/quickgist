// The fixed values of the data layer: the limits the database also enforces, the
// SQLSTATE codes it raises, and the timeouts around it.
//
// The limits are duplicated in SQL on purpose. These let a caller fail fast with a
// clear message; the database's own constraints are what make the limit true.
package store

import (
	"time"
)

// Visibility values, matching the gist_visibility enum in 0001_init.sql.
const (
	VisibilityPublic   = "public"
	VisibilityUnlisted = "unlisted"
	VisibilityPrivate  = "private"
)

// MaxRetentionDays is the ceiling on how long an upload is kept. The
// blob_retention_within_ceiling constraint enforces it; this constant exists so the
// API can reject an out-of-range request with a clear error instead of letting the
// database clamp it silently.
const MaxRetentionDays = 30

// Postgres error codes this layer recognises. Anything else is a real fault and is
// returned unwrapped so it reaches the error reporter.
const (
	codeNotNullViolation    = "23502"
	codeForeignKeyViolation = "23503"
	codeUniqueViolation     = "23505"
	codeCheckViolation      = "23514"
	codeStringDataTooLong   = "22001"
	codeInvalidTextRepr     = "22P02"
	codeInsufficientPrivs   = "42501"
)

// blobClaimLimit bounds one janitor sweep, matching the ceiling in
// claim_orphaned_blobs.
const blobClaimLimit = 1000

const (
	connectionLifetime = time.Hour
	connectionIdleTime = 30 * time.Minute
	healthCheckPeriod  = time.Minute
)
