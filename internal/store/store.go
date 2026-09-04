// Package store is the only path to the database. It calls SQL functions and never
// assembles queries, so authorization stays in the database rather than being
// restated in Go.
package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/exaring/otelpgx"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/abhisheksharm-3/quickgist/internal/auth"
)

const (
	connectionLifetime = time.Hour
	connectionIdleTime = 30 * time.Minute
	healthCheckPeriod  = time.Minute
)

// Store holds the connection pool.
type Store struct {
	pool *pgxpool.Pool
}

// Open connects and verifies reachability before returning, so a bad DATABASE_URL
// fails at startup rather than on the first request.
func Open(ctx context.Context, databaseURL string, maxConns int32) (*Store, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse DATABASE_URL: %w", err)
	}

	cfg.MaxConns = maxConns
	cfg.MinConns = 1
	cfg.MaxConnLifetime = connectionLifetime
	cfg.MaxConnIdleTime = connectionIdleTime
	cfg.HealthCheckPeriod = healthCheckPeriod
	cfg.ConnConfig.Tracer = otelpgx.NewTracer()

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return &Store{pool: pool}, nil
}

// Close releases the pool.
func (s *Store) Close() { s.pool.Close() }

// Ping reports whether the database is reachable.
func (s *Store) Ping(ctx context.Context) error {
	if err := s.pool.Ping(ctx); err != nil {
		return fmt.Errorf("ping database: %w", err)
	}
	return nil
}

// asCaller runs fn in a transaction whose role and JWT claims match the caller, so
// auth.uid() and every row-level policy apply to this layer too.
//
// A nil identity runs as the anon role. The identity always comes from a verified
// token and never from a request body, which is what keeps a caller from acting as
// someone else.
func (s *Store) asCaller(ctx context.Context, id *auth.Identity, fn func(pgx.Tx) error) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := applyCallerRole(ctx, tx, id); err != nil {
		return err
	}

	if err := fn(tx); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}
	return nil
}

// applyCallerRole sets the transaction's database role and JWT claims.
//
// SET LOCAL takes no bind parameters, so the role name has to be inlined. Both
// values are compile-time constants, and the claims, the only caller-influenced
// input, go through set_config, which does bind.
func applyCallerRole(ctx context.Context, tx pgx.Tx, id *auth.Identity) error {
	if id == nil {
		if _, err := tx.Exec(ctx, "set local role anon"); err != nil {
			return fmt.Errorf("set anon role: %w", err)
		}
		return nil
	}

	claims, err := json.Marshal(map[string]string{
		"sub":   id.UserID,
		"role":  "authenticated",
		"email": id.Email,
	})
	if err != nil {
		return fmt.Errorf("encode jwt claims: %w", err)
	}

	if _, err := tx.Exec(ctx, "set local role authenticated"); err != nil {
		return fmt.Errorf("set authenticated role: %w", err)
	}
	if _, err := tx.Exec(ctx, "select set_config('request.jwt.claims', $1, true)", string(claims)); err != nil {
		return fmt.Errorf("set jwt claims: %w", err)
	}
	return nil
}

// queryJSON calls a SQL function returning jsonb and decodes it into out.
//
// A SQL NULL result means the row does not exist or is not visible to this caller,
// which the RPCs use as one indistinguishable answer, and it becomes ErrNotFound.
func (s *Store) queryJSON(ctx context.Context, id *auth.Identity, out any, sql string, args ...any) error {
	return s.asCaller(ctx, id, func(tx pgx.Tx) error {
		var raw []byte
		if err := tx.QueryRow(ctx, sql, args...).Scan(&raw); err != nil {
			return translate(err)
		}
		if raw == nil {
			return ErrNotFound
		}
		if err := json.Unmarshal(raw, out); err != nil {
			return fmt.Errorf("decode payload from %s: %w", sql, err)
		}
		return nil
	})
}
