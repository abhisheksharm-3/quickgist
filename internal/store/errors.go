// Domain errors and the mapping from Postgres error codes onto them.
package store

import (
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// Sentinel errors callers inspect with errors.Is. Nothing below the store layer
// knows about HTTP status codes.
var (
	ErrNotFound  = errors.New("not found")
	ErrForbidden = errors.New("forbidden")
	ErrInvalid   = errors.New("invalid")
)

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

// translate maps a database error onto a sentinel so handlers never inspect SQLSTATE
// and no database message reaches a client unexamined.
func translate(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}

	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return err
	}

	switch pgErr.Code {
	case codeCheckViolation, codeUniqueViolation, codeNotNullViolation,
		codeStringDataTooLong, codeInvalidTextRepr, codeForeignKeyViolation:
		return fmt.Errorf("%w: %s", ErrInvalid, pgErr.Message)
	case codeInsufficientPrivs:
		return fmt.Errorf("%w: %s", ErrForbidden, pgErr.Message)
	default:
		return err
	}
}
