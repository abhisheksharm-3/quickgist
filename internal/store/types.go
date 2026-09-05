// The handle this package hands out.
//
// The records it reads and writes are in internal/domain, which every layer shares;
// this is the connection pool and the logger behind them.
package store

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store holds the connection pool.
type Store struct {
	pool *pgxpool.Pool
}
