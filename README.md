# quickgist

Share Markdown and code fast. Paste, get a link, send it. No account needed.

Markdown and source are rendered on the server, so the browser downloads no syntax
highlighter: `goldmark` for CommonMark and GFM, `chroma` for around 250 languages,
`bluemonday` to sanitize the result. Rendered HTML is cached in Postgres and keyed to
a renderer version, so a deploy that changes rendering invalidates every cached row
without a migration.

## Stack

| Layer | Choice |
|---|---|
| API | Go 1.26, `net/http.ServeMux` |
| Database | Supabase Postgres, accessed only through SQL functions |
| Auth | Supabase Auth, ES256 access tokens verified against JWKS |
| Storage | Supabase Storage, private bucket proxied by the API |
| Rendering | goldmark, chroma, bluemonday |
| Frontend | React 19, TypeScript 7, Vite 8, Tailwind 4, TanStack Query |
| Tooling | Biome, golangci-lint |
| Observability | OpenTelemetry traces, Sentry errors |

## Where the rules live

Authorization is in the database, not in Go. Row-level security decides who can read
and write each gist, and the API calls SQL functions inside a transaction carrying
the caller's verified JWT claims, so `auth.uid()` and every policy apply to it too. A
handler that forgot a check still could not read someone else's private gist.

- `supabase/migrations/0001_init.sql` — tables, constraints, triggers
- `supabase/migrations/0002_rls.sql` — row-level security policies
- `supabase/migrations/0003_rpc.sql` — the SQL functions the API calls
- `supabase/migrations/0004_maintenance.sql` — scheduled cleanup, storage bucket
- `supabase/tests/smoke.sql` — 40 assertions covering the above

Three visibilities. `public` gists are listed and searchable. `unlisted` ones are
reachable only by their 12-character slug, which is 60 bits of entropy, and are
deliberately excluded from the SELECT policy so a direct query cannot enumerate them.
`private` ones need to be the author.

Uploads are retained for a caller-chosen number of days, capped at 30. The cap is a
CHECK constraint rather than a code path, so no insert can exceed it. Deleting any
file row queues its object for deletion by trigger, and a janitor in the API drains
that queue, because Postgres cannot reach the bucket.

## Running it

Requires Go 1.26 and Node 24.

```bash
cp .env.example .env.local           # fill in DATABASE_URL and the Supabase keys
psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
psql "$DATABASE_URL" -f supabase/migrations/0002_rls.sql
psql "$DATABASE_URL" -f supabase/migrations/0003_rpc.sql
psql "$DATABASE_URL" -f supabase/migrations/0004_maintenance.sql

go run ./cmd/server                  # API on :8000
```

```bash
cd frontend
cp .env.example .env.local           # fill in the Supabase URL and publishable key
npm install
npm run dev                          # app on :5173, proxying /v1 to :8000
```

`DATABASE_URL` must be the pooler connection string. The direct `db.<ref>.supabase.co`
host publishes an AAAA record only, so it is unreachable from an IPv4-only network.

## Checks

```bash
go test ./... && golangci-lint run ./...
psql "$DATABASE_URL" -f supabase/tests/smoke.sql   # runs in a transaction, rolls back

cd frontend && npm run typecheck && npm run lint && npm run build
```

## API

| Method | Path | Auth |
|---|---|---|
| `GET` | `/v1/health` | — |
| `GET` | `/v1/highlight.css` | — |
| `GET` | `/v1/me` | required |
| `POST` | `/v1/preview` | — |
| `POST` | `/v1/paste` | optional, required for `private` |
| `GET` | `/v1/gists` | optional |
| `GET` | `/v1/gists/search?q=` | — |
| `POST` | `/v1/gists` | optional, required for `private` |
| `GET` | `/v1/gists/{slug}` | optional |
| `PATCH` | `/v1/gists/{slug}` | author |
| `DELETE` | `/v1/gists/{slug}` | author |
| `PUT` | `/v1/gists/{slug}/files` | author |
| `POST` | `/v1/gists/{slug}/files` | author |
| `GET` | `/v1/gists/{slug}/raw/{filename}` | optional |
| `GET` | `/v1/gists/{slug}/revisions` | optional |
| `GET` | `/v1/gists/{slug}/revisions/{n}` | optional |
| `POST` | `/v1/gists/{slug}/revisions/{n}/restore` | author |
| `GET` | `/v1/gists/{slug}/og.png` | optional |
| `GET` | `/v1/gists/{slug}/preview.html` | optional |

### From a shell

`POST /v1/paste` takes the body as the file and answers with the link as plain text,
so it works in a pipe with no JSON to compose:

```sh
cat notes.md | curl --data-binary @- 'http://localhost:8000/v1/paste?filename=notes.md'
```

`scripts/quickgist` wraps that with a filename, visibility and expiry:

```sh
scripts/quickgist notes.md              # unlisted, keeping the filename
cat notes.md | scripts/quickgist        # from a pipe, as paste.md
scripts/quickgist -v public -e 7 bug.go # public, deleted after a week
```

`QUICKGIST_API` points it at a different deployment and `QUICKGIST_TOKEN` signs the
gist as you, which is only needed for `private`.

### Link previews

Crawlers do not run JavaScript, so a gist link pasted into a chat would preview as
nothing. `preview.html` is the document they get instead, and `og.png` is the card it
names, drawn per request from the gist's own title and files. The frontend's
`vercel.json` routes crawler user agents to the first of those.

Every error has one shape:

```json
{ "error": { "code": "not_found", "message": "Not Found" } }
```

A gist that does not exist and one that is private to somebody else both answer 404,
because a 403 would confirm the slug is real.
