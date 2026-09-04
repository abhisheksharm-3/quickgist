// The caller's own profile.
package store

import (
	"context"

	"github.com/abhisheksharm-3/quickgist/internal/auth"
)

// MyProfile returns the signed-in caller's profile.
//
// It reports ErrNotFound when the caller has no profile row, which should not happen
// because handle_new_user() creates one for every account, but is worth answering
// honestly rather than inventing a handle.
func (s *Store) MyProfile(ctx context.Context, id *auth.Identity) (*Author, error) {
	var author Author
	if err := s.queryJSON(ctx, id, &author, "select my_profile()"); err != nil {
		return nil, err
	}
	return &author, nil
}
