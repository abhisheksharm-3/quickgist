# 1. Server-rendered preview

Preview reuses the same `render.Renderer` instance, the same sanitizer policy, and
the same 1 MiB cap that gist files render under, rather than shipping a client-side
Markdown/syntax-highlighting library. A client renderer is a second implementation
of the same contract, and the moment its extension set, its lexer version, or its
sanitizer allowlist drifts from the server's, the preview a client-side author sees
before saving stops matching the page every reader gets after saving — a preview
that lies is worse than no preview.

The renderer version has moved several times since — it is `r5` in
`internal/render/constants.go` — and each bump was safe for the same reason: a
pre-launch corpus small enough that invalidating every cached render costs nothing
anybody waits for. On a populated database a bump is the dangerous case, because it
invalidates every cached render at once and turns an isolated palette change into a
re-render of the whole corpus behind `cachedRenderIsCurrent`, at exactly the compute
cost this ADR's preview benchmark measures. What makes it survivable is that the
hash is checked per file: a gist is re-rendered when somebody opens it, not all at
once by a migration.
