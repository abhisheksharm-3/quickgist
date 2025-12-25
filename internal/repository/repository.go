package repository

import (
	"context"

	"github.com/abhisheksharm-3/quickgist/internal/model"
)

// GistRepository defines the interface for gist data access.
type GistRepository interface {
	Get(ctx context.Context, id string) (*model.Gist, error)
	Create(ctx context.Context, gist *model.Gist) (string, error)
	Update(ctx context.Context, gist *model.Gist) error
	ListByUser(ctx context.Context, userID string, limit int) ([]*model.Gist, error)
}

