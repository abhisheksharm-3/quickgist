package model

import "time"

// User represents an application user.
type User struct {
	ID        string
	Email     string
	Name      string
	CreatedAt time.Time
}
