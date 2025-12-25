package apperror

import (
	"errors"
	"fmt"
	"net/http"
)

// Error represents an application error with HTTP status and user-safe message.
type Error struct {
	Code    string
	Message string
	Status  int
	Err     error
}

func (e *Error) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func (e *Error) Unwrap() error {
	return e.Err
}

// Standard error codes
const (
	CodeNotFound      = "NOT_FOUND"
	CodeBadRequest    = "BAD_REQUEST"
	CodeUnauthorized  = "UNAUTHORIZED"
	CodeForbidden     = "FORBIDDEN"
	CodeInternal      = "INTERNAL_ERROR"
	CodeValidation    = "VALIDATION_ERROR"
	CodeRateLimit     = "RATE_LIMIT_EXCEEDED"
	CodeStorageError  = "STORAGE_ERROR"
	CodeDatabaseError = "DATABASE_ERROR"
)

// NotFound creates a not found error.
func NotFound(resource string) *Error {
	return &Error{
		Code:    CodeNotFound,
		Message: fmt.Sprintf("%s not found", resource),
		Status:  http.StatusNotFound,
	}
}

// BadRequest creates a bad request error.
func BadRequest(message string) *Error {
	return &Error{
		Code:    CodeBadRequest,
		Message: message,
		Status:  http.StatusBadRequest,
	}
}

// Unauthorized creates an unauthorized error.
func Unauthorized(message string) *Error {
	return &Error{
		Code:    CodeUnauthorized,
		Message: message,
		Status:  http.StatusUnauthorized,
	}
}

// Forbidden creates a forbidden error.
func Forbidden(message string) *Error {
	return &Error{
		Code:    CodeForbidden,
		Message: message,
		Status:  http.StatusForbidden,
	}
}

// Internal creates an internal server error.
func Internal(err error) *Error {
	return &Error{
		Code:    CodeInternal,
		Message: "An internal error occurred",
		Status:  http.StatusInternalServerError,
		Err:     err,
	}
}

// Validation creates a validation error.
func Validation(message string) *Error {
	return &Error{
		Code:    CodeValidation,
		Message: message,
		Status:  http.StatusBadRequest,
	}
}

// RateLimit creates a rate limit error.
func RateLimit() *Error {
	return &Error{
		Code:    CodeRateLimit,
		Message: "Rate limit exceeded",
		Status:  http.StatusTooManyRequests,
	}
}

// Storage creates a storage error.
func Storage(err error) *Error {
	return &Error{
		Code:    CodeStorageError,
		Message: "Storage operation failed",
		Status:  http.StatusInternalServerError,
		Err:     err,
	}
}

// Database creates a database error.
func Database(err error) *Error {
	return &Error{
		Code:    CodeDatabaseError,
		Message: "Database operation failed",
		Status:  http.StatusInternalServerError,
		Err:     err,
	}
}

// Wrap wraps an error with additional context.
func Wrap(err error, message string) *Error {
	var appErr *Error
	if errors.As(err, &appErr) {
		return &Error{
			Code:    appErr.Code,
			Message: message,
			Status:  appErr.Status,
			Err:     err,
		}
	}
	return Internal(fmt.Errorf("%s: %w", message, err))
}

// Is checks if an error matches a specific error code.
func Is(err error, code string) bool {
	var appErr *Error
	if errors.As(err, &appErr) {
		return appErr.Code == code
	}
	return false
}

// StatusCode extracts the HTTP status code from an error.
func StatusCode(err error) int {
	var appErr *Error
	if errors.As(err, &appErr) {
		return appErr.Status
	}
	return http.StatusInternalServerError
}
