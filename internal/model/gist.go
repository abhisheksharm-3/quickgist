package model

import "time"

// Gist represents a code snippet or file share.
type Gist struct {
	ID            string
	Title         string
	Description   string
	Content       string
	IsDraft       bool
	CreatedAt     time.Time
	UserID        string
	FileName      string
	FileURL       string
	PublicFileURL string
}

// NewGist creates a new Gist with the current timestamp.
func NewGist(title, description, content string, isDraft bool) *Gist {
	return &Gist{
		Title:       title,
		Description: description,
		Content:     content,
		IsDraft:     isDraft,
		CreatedAt:   time.Now().UTC(),
	}
}

// WithUser sets the user ID for the gist.
func (g *Gist) WithUser(userID string) *Gist {
	g.UserID = userID
	return g
}

// WithFile sets file information for the gist.
func (g *Gist) WithFile(fileName, fileURL, publicFileURL string) *Gist {
	g.FileName = fileName
	g.FileURL = fileURL
	g.PublicFileURL = publicFileURL
	return g
}

// ToMap converts the gist to a map for Firestore storage.
func (g *Gist) ToMap() map[string]interface{} {
	m := map[string]interface{}{
		"title":       g.Title,
		"description": g.Description,
		"content":     g.Content,
		"isDraft":     g.IsDraft,
		"createdAt":   g.CreatedAt,
	}

	if g.UserID != "" {
		m["userId"] = g.UserID
	}
	if g.FileName != "" {
		m["fileName"] = g.FileName
		m["fileURL"] = g.FileURL
		m["publicFileURL"] = g.PublicFileURL
	}

	return m
}

// GistFromMap creates a Gist from Firestore document data.
func GistFromMap(id string, data map[string]interface{}) *Gist {
	g := &Gist{ID: id}

	if v, ok := data["title"].(string); ok {
		g.Title = v
	}
	if v, ok := data["description"].(string); ok {
		g.Description = v
	}
	if v, ok := data["content"].(string); ok {
		g.Content = v
	}
	if v, ok := data["isDraft"].(bool); ok {
		g.IsDraft = v
	}
	if v, ok := data["createdAt"].(time.Time); ok {
		g.CreatedAt = v
	}
	if v, ok := data["userId"].(string); ok {
		g.UserID = v
	}
	if v, ok := data["fileName"].(string); ok {
		g.FileName = v
	}
	if v, ok := data["fileURL"].(string); ok {
		g.FileURL = v
	}
	if v, ok := data["publicFileURL"].(string); ok {
		g.PublicFileURL = v
	}

	return g
}
