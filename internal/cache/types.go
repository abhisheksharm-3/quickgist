package cache

import (
	"sync"
	"time"

	"github.com/abhisheksharm-3/quickgist/internal/model"
)

// Cache defines the interface for gist caching.
type Cache interface {
	Get(key string) (*model.Gist, bool)
	Set(key string, gist *model.Gist, ttl time.Duration)
	Delete(key string)
}

// MemoryCache implements an in-memory LRU cache.
type MemoryCache struct {
	data    map[string]*entry
	mu      sync.RWMutex
	maxSize int
}

type entry struct {
	gist      *model.Gist
	expiresAt time.Time
}
