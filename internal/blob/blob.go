// Package blob stores gist uploads in a private Supabase Storage bucket over its
// REST API.
package blob

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"strconv"
	"strings"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

// ErrNotFound means no object exists at that path.
var ErrNotFound = errors.New("blob not found")

const (
	requestTimeout = 60 * time.Second
	idleTimeout    = 90 * time.Second
	maxIdleConns   = 50
	maxIdlePerHost = 10
	errorBodyLimit = 512
	drainLimit     = 4 << 10
)

// Store is a handle on one storage bucket.
//
// The bucket is private and only this service holds its key. Reads are proxied by
// the API, which checks a gist's visibility first, so a private gist's attachment is
// never world-readable by URL.
type Store struct {
	baseURL string
	bucket  string
	key     string
	client  *http.Client
}

// New builds a Store. supabaseURL is the project URL, with or without a trailing
// slash.
func New(supabaseURL, bucket, serviceKey string) *Store {
	return &Store{
		baseURL: strings.TrimSuffix(supabaseURL, "/") + "/storage/v1",
		bucket:  bucket,
		key:     serviceKey,
		client: &http.Client{
			Transport: otelhttp.NewTransport(&http.Transport{
				MaxIdleConns:        maxIdleConns,
				MaxIdleConnsPerHost: maxIdlePerHost,
				IdleConnTimeout:     idleTimeout,
			}),
			Timeout: requestTimeout,
		},
	}
}

// ObjectPath builds the storage key for a gist's file. The slug prefixes the path so
// objects group per gist and one gist's files cannot collide with another's.
func ObjectPath(slug, filename string) string {
	return path.Join(slug, path.Base(filename))
}

// Object is an open download. The caller must Close it.
type Object struct {
	Body          io.ReadCloser
	ContentType   string
	ContentLength int64
	ETag          string
	LastModified  string
}

// Close releases the underlying response body.
func (o *Object) Close() error { return o.Body.Close() }

// Upload stores content and returns the object path to record in the database.
//
// contentType is derived by the caller from the filename, never taken from the
// client, because a client-declared type is only a claim.
func (s *Store) Upload(ctx context.Context, objectPath, contentType string, content io.Reader, size int64) (string, error) {
	req, err := s.newRequest(ctx, http.MethodPost, objectPath, content)
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true")
	if size > 0 {
		req.ContentLength = size
		req.Header.Set("Content-Length", strconv.FormatInt(size, 10))
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("upload %s: %w", objectPath, err)
	}
	defer drain(resp)

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("upload %s returned %s: %s", objectPath, resp.Status, snippet(resp.Body))
	}

	return objectPath, nil
}

// Open streams an object out of the bucket, returning ErrNotFound if it is absent.
func (s *Store) Open(ctx context.Context, objectPath string) (*Object, error) {
	req, err := s.newRequest(ctx, http.MethodGet, objectPath, nil)
	if err != nil {
		return nil, err
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("download %s: %w", objectPath, err)
	}

	switch resp.StatusCode {
	case http.StatusOK:
	case http.StatusNotFound:
		drain(resp)
		return nil, ErrNotFound
	default:
		defer drain(resp)
		return nil, fmt.Errorf("download %s returned %s: %s", objectPath, resp.Status, snippet(resp.Body))
	}

	return &Object{
		Body:          resp.Body,
		ContentType:   resp.Header.Get("Content-Type"),
		ContentLength: resp.ContentLength,
		ETag:          resp.Header.Get("ETag"),
		LastModified:  resp.Header.Get("Last-Modified"),
	}, nil
}

// Delete removes an object.
//
// A missing object is not an error. The janitor retries, and a delete that already
// happened is the outcome it wanted.
func (s *Store) Delete(ctx context.Context, objectPath string) error {
	req, err := s.newRequest(ctx, http.MethodDelete, objectPath, nil)
	if err != nil {
		return err
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("delete %s: %w", objectPath, err)
	}
	defer drain(resp)

	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusNotFound {
		return nil
	}
	return fmt.Errorf("delete %s returned %s: %s", objectPath, resp.Status, snippet(resp.Body))
}

// newRequest builds an authenticated request against an object path.
func (s *Store) newRequest(ctx context.Context, method, objectPath string, body io.Reader) (*http.Request, error) {
	req, err := http.NewRequestWithContext(ctx, method, s.objectURL(objectPath), body)
	if err != nil {
		return nil, fmt.Errorf("build %s request for %s: %w", method, objectPath, err)
	}
	req.Header.Set("Authorization", "Bearer "+s.key)
	return req, nil
}

// objectURL escapes each path segment separately, so slashes in the key stay
// slashes rather than becoming %2F.
func (s *Store) objectURL(objectPath string) string {
	parts := strings.Split(objectPath, "/")
	for i, p := range parts {
		parts[i] = url.PathEscape(p)
	}
	return fmt.Sprintf("%s/object/%s/%s", s.baseURL, url.PathEscape(s.bucket), strings.Join(parts, "/"))
}

// drain consumes a bounded amount of a response body so the connection can be
// reused, then closes it.
func drain(resp *http.Response) {
	_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, drainLimit))
	_ = resp.Body.Close()
}

// snippet reads a bounded piece of an error body. Storage errors are short JSON, and
// an unbounded read on an error path is a denial of service waiting to happen.
func snippet(r io.Reader) string {
	b, _ := io.ReadAll(io.LimitReader(r, errorBodyLimit))
	return strings.TrimSpace(string(b))
}
