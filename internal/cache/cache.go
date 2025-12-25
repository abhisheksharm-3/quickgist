package cache

import (
	"time"

	"github.com/abhisheksharm-3/quickgist/internal/model"
)

// NewMemoryCache creates a new in-memory cache.
func NewMemoryCache(maxSize int) *MemoryCache {
	c := &MemoryCache{
		data:    make(map[string]*entry),
		maxSize: maxSize,
	}

	go c.cleanup()
	return c
}

// Get retrieves a gist from the cache.
func (c *MemoryCache) Get(key string) (*model.Gist, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	e, ok := c.data[key]
	if !ok {
		return nil, false
	}

	if time.Now().After(e.expiresAt) {
		return nil, false
	}

	return e.gist, true
}

// Set stores a gist in the cache.
func (c *MemoryCache) Set(key string, gist *model.Gist, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if len(c.data) >= c.maxSize {
		c.evictOldest()
	}

	c.data[key] = &entry{
		gist:      gist,
		expiresAt: time.Now().Add(ttl),
	}
}

// Delete removes a gist from the cache.
func (c *MemoryCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.data, key)
}

func (c *MemoryCache) evictOldest() {
	var oldestKey string
	var oldestTime time.Time

	for k, v := range c.data {
		if oldestKey == "" || v.expiresAt.Before(oldestTime) {
			oldestKey = k
			oldestTime = v.expiresAt
		}
	}

	if oldestKey != "" {
		delete(c.data, oldestKey)
	}
}

func (c *MemoryCache) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for k, v := range c.data {
			if now.After(v.expiresAt) {
				delete(c.data, k)
			}
		}
		c.mu.Unlock()
	}
}
