// Where configuration is read from.
//
// The default values themselves stay inline at their single point of use in Load,
// where the name and the fallback read as one statement.
package config

// envFiles are read in order, so a real credential in .env.local overrides a shared
// default in .env. Only .env.local is gitignored.
var envFiles = []string{".env.local", ".env"}
