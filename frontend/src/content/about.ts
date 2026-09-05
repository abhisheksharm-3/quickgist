/** What the landing page says.
 *
 * Copy lives apart from the components that lay it out, so a wording change is an
 * edit to prose rather than to markup.
 */
import type { FeatureType, HeroSpecType, ShortcutRowType, StackRowType } from '@/types/about';

export const FEATURES: FeatureType[] = [
  {
    index: '01',
    title: 'Rendered before it reaches you',
    detail:
      'goldmark and chroma run on the server and the HTML is cached in Postgres, so the page arrives finished. Your browser downloads no highlighter, and the preview you wrote against is the page your reader opens.',
  },
  {
    index: '02',
    title: 'One link, three visibilities',
    detail:
      'A gist is unlisted by default: anyone with the link can read it, and nothing lists it. Public puts it in the feed and in search. Private is yours alone, and everyone else gets the same 404 as a link that never existed.',
  },
  {
    index: '03',
    title: 'A gist is a set of files',
    detail:
      'Up to twenty of them, each a tab, each rendered by its own extension. Drop files in from disk; anything that is not text is uploaded and kept for at most 30 days, which the database enforces rather than the interface suggesting it.',
  },
];

export const SPECS: HeroSpecType[] = [
  { label: 'Rendered', value: 'on the server' },
  { label: 'Account', value: 'not required' },
  { label: 'Files per gist', value: 'up to 20' },
  { label: 'Uploads kept', value: '30 days, capped' },
];

export const SOURCE = `# Deploy notes

Two things to check **before** the release:

| Step | Owner |
| --- | --- |
| Migrate | backend |
| Smoke test | anyone |

\`\`\`go
func main() {
	fmt.Println("ready")
}
\`\`\``;

/**
 * The stack, with the reason for each choice rather than a badge wall.
 *
 * A list of logos says nothing a reader could disagree with; a reason can be argued
 * with, which is the point of writing it down.
 */
export const STACK: StackRowType[] = [
  {
    layer: 'API',
    choice: 'Go 1.26, net/http.ServeMux',
    reason:
      'The standard library has done method matching and path wildcards since Go 1.22, so a third-party router earns nothing.',
  },
  {
    layer: 'Database',
    choice: 'Supabase Postgres, reached only through SQL functions',
    reason:
      'Authorization is row-level security, and the API passes the caller’s verified JWT claims into each transaction, so a handler that forgets a check still cannot read a private gist.',
  },
  {
    layer: 'Auth',
    choice: 'Supabase Auth, ES256 tokens verified against JWKS',
    reason:
      'No shared secret to leak, and key rotation needs no deploy. Constraining the accepted algorithm to one is what makes algorithm confusion impossible.',
  },
  {
    layer: 'Rendering',
    choice: 'goldmark, chroma, bluemonday, on the server',
    reason:
      'The browser downloads no syntax highlighter at all. Output is cached in Postgres under a renderer version, so changing how things render invalidates every cached row without a migration. Mermaid is the one exception, drawn in the browser from a chunk only a document containing a diagram loads.',
  },
  {
    layer: 'Storage',
    choice: 'Supabase Storage, a private bucket proxied by the API',
    reason:
      'The API checks a gist’s visibility before streaming a byte, which a public bucket would make impossible. Uploads are kept for up to 30 days, and the cap is a database constraint rather than a code path.',
  },
  {
    layer: 'Frontend',
    choice: 'React 19.2, TypeScript 7, Vite 8, Tailwind 4, TanStack Query',
    reason:
      'Document metadata comes from React itself rather than a helmet library, and the preview pane stays mounted through <Activity> so toggling it keeps scroll and state.',
  },
  {
    layer: 'Observability',
    choice: 'OpenTelemetry traces, Sentry errors',
    reason:
      'Sentry’s own tracing is off so one picture is not paid for twice, and no request bodies are collected because a body here can be an entire private gist.',
  },
  {
    layer: 'Tooling',
    choice: 'Biome, golangci-lint',
    reason:
      'One formatter and linter per language, both run to zero findings rather than to a warning count somebody stopped reading.',
  },
];

export const SHORTCUTS: ShortcutRowType[] = [
  { keys: '⌘K', action: 'Command palette' },
  { keys: '⌘↵', action: 'Create the gist' },
  { keys: '⌘⇧P', action: 'Toggle preview' },
  { keys: '⌘S', action: 'Save an edit' },
  { keys: '1 – 9', action: 'Switch to file n' },
  { keys: '?', action: 'Show this list' },
];
