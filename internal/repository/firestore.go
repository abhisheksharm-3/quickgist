package repository

import (
	"context"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/abhisheksharm-3/quickgist/internal/apperror"
	"github.com/abhisheksharm-3/quickgist/internal/model"
)

const (
	collectionName     = "userSnippets"
	defaultQueryLimit  = 100
	operationTimeout   = 5 * time.Second
)

// FirestoreRepository implements GistRepository using Firestore.
type FirestoreRepository struct {
	client *firestore.Client
}

// NewFirestoreRepository creates a new Firestore repository.
func NewFirestoreRepository(client *firestore.Client) *FirestoreRepository {
	return &FirestoreRepository{client: client}
}

// Get retrieves a gist by ID.
func (r *FirestoreRepository) Get(ctx context.Context, id string) (*model.Gist, error) {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	doc, err := r.client.Collection(collectionName).Doc(id).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, apperror.NotFound("gist")
		}
		return nil, apperror.Database(err)
	}

	return model.GistFromMap(doc.Ref.ID, doc.Data()), nil
}

// Create saves a new gist and returns its ID.
func (r *FirestoreRepository) Create(ctx context.Context, gist *model.Gist) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	docRef := r.client.Collection(collectionName).NewDoc()
	if _, err := docRef.Set(ctx, gist.ToMap()); err != nil {
		return "", apperror.Database(err)
	}

	return docRef.ID, nil
}

// Update updates an existing gist.
func (r *FirestoreRepository) Update(ctx context.Context, gist *model.Gist) error {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	_, err := r.client.Collection(collectionName).Doc(gist.ID).Set(ctx, gist.ToMap(), firestore.MergeAll)
	if err != nil {
		return apperror.Database(err)
	}

	return nil
}

// ListByUser retrieves gists for a user with pagination.
func (r *FirestoreRepository) ListByUser(ctx context.Context, userID string, limit int) ([]*model.Gist, error) {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	if limit <= 0 || limit > defaultQueryLimit {
		limit = defaultQueryLimit
	}

	iter := r.client.Collection(collectionName).
		Where("userId", "==", userID).
		OrderBy("createdAt", firestore.Desc).
		Limit(limit).
		Documents(ctx)

	var gists []*model.Gist
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, apperror.Database(err)
		}

		gists = append(gists, model.GistFromMap(doc.Ref.ID, doc.Data()))
	}

	return gists, nil
}
