package store

import (
	"errors"
	"fmt"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// translate is what keeps SQLSTATE out of the handlers, so every code it claims to
// recognise has to map to the sentinel the handlers branch on.
func TestTranslate(t *testing.T) {
	cases := []struct {
		name string
		err  error
		want error
	}{
		{name: "no rows", err: pgx.ErrNoRows, want: ErrNotFound},
		{name: "wrapped no rows", err: fmt.Errorf("query: %w", pgx.ErrNoRows), want: ErrNotFound},

		{name: "check violation", err: &pgconn.PgError{Code: codeCheckViolation}, want: ErrInvalid},
		{name: "unique violation", err: &pgconn.PgError{Code: codeUniqueViolation}, want: ErrInvalid},
		{name: "not null violation", err: &pgconn.PgError{Code: codeNotNullViolation}, want: ErrInvalid},
		{name: "string too long", err: &pgconn.PgError{Code: codeStringDataTooLong}, want: ErrInvalid},
		{name: "invalid text representation", err: &pgconn.PgError{Code: codeInvalidTextRepr}, want: ErrInvalid},
		{name: "foreign key violation", err: &pgconn.PgError{Code: codeForeignKeyViolation}, want: ErrInvalid},

		{name: "insufficient privilege", err: &pgconn.PgError{Code: codeInsufficientPrivs}, want: ErrForbidden},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := translate(tc.err); !errors.Is(got, tc.want) {
				t.Errorf("translate(%v) = %v, want %v", tc.err, got, tc.want)
			}
		})
	}
}

// An unrecognised database fault must stay a real error, not be softened into a
// client mistake that nobody investigates.
func TestTranslatePassesUnknownErrorsThrough(t *testing.T) {
	original := &pgconn.PgError{Code: "08006", Message: "connection failure"}

	got := translate(original)
	for _, sentinel := range []error{ErrNotFound, ErrInvalid, ErrForbidden} {
		if errors.Is(got, sentinel) {
			t.Errorf("a connection failure was translated to %v", sentinel)
		}
	}
	if !errors.Is(got, original) {
		t.Errorf("the original error was lost: %v", got)
	}
}

// The message from a validation failure reaches the client, so it must survive.
func TestTranslateKeepsTheValidationMessage(t *testing.T) {
	got := translate(&pgconn.PgError{
		Code:    codeCheckViolation,
		Message: "a gist needs at least one file",
	})

	if !errors.Is(got, ErrInvalid) {
		t.Fatalf("got %v, want ErrInvalid", got)
	}
	if want := "a gist needs at least one file"; !strings.Contains(got.Error(), want) {
		t.Errorf("error = %q, want it to contain %q", got, want)
	}
}

func TestValidVisibility(t *testing.T) {
	cases := map[string]bool{
		VisibilityPublic:   true,
		VisibilityUnlisted: true,
		VisibilityPrivate:  true,
		"":                 false,
		"Public":           false,
		"draft":            false,
		"secret":           false,
	}

	for value, want := range cases {
		t.Run("visibility="+value, func(t *testing.T) {
			if got := ValidVisibility(value); got != want {
				t.Errorf("ValidVisibility(%q) = %v, want %v", value, got, want)
			}
		})
	}
}
