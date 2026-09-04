# 1. Server-rendered preview

Preview reuses the same `render.Renderer` instance, the same sanitizer policy, and
the same 1 MiB cap that gist files render under, rather than shipping a client-side
Markdown/syntax-highlighting library. A client renderer is a second implementation
of the same contract, and the moment its extension set, its lexer version, or its
sanitizer allowlist drifts from the server's, the preview a client-side author sees
before saving stops matching the page every reader gets after saving — a preview
that lies is worse than no preview. The r1-to-r2 bump is safe today because this is
a pre-launch codebase with an empty `rendered_html` cache column: every row is
already stale by definition, so nothing observable changes when the hash prefix
changes. On a populated database the same bump is dangerous for the opposite
reason — it invalidates every cached render at once, turning what should be an
isolated theme change into a thundering-herd re-render of the entire corpus behind
`cachedRenderIsCurrent`, at exactly the unauthenticated compute cost this ADR's
preview benchmark measures.
