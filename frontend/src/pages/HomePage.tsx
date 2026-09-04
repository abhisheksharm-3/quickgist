/** The public feed and full-text search over it. */
import { useState } from 'react';
import { Link } from 'react-router';
import { useGistList, useGistSearch } from '@/lib/use-gist-queries';
import type { GistType } from '@/types';

export function HomePage() {
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length > 0;

  const feed = useGistList({ limit: 30 });
  const search = useGistSearch(query);
  const active = isSearching ? search : feed;

  return (
    <main>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search public gists"
        aria-label="Search public gists"
        className="mb-6 w-full rounded border px-3 py-2"
      />

      {active.isPending ? <p>Loading…</p> : null}
      {active.isError ? <p>{active.error.message}</p> : null}
      {active.data?.length === 0 ? (
        <p>{isSearching ? 'No gists match that.' : 'No public gists yet.'}</p>
      ) : null}

      <ul className="space-y-4">
        {active.data?.map((gist) => (
          <li key={gist.slug}>
            <GistSummary gist={gist} />
          </li>
        ))}
      </ul>
    </main>
  );
}

type GistSummaryPropsType = {
  gist: GistType;
};

function GistSummary({ gist }: GistSummaryPropsType) {
  return (
    <article>
      <Link to={`/g/${gist.slug}`} className="font-medium underline">
        {gist.title}
      </Link>
      {gist.description ? <p className="text-sm">{gist.description}</p> : null}
      <p className="text-xs opacity-70">
        {gist.author ? `${gist.author.handle} · ` : ''}
        {gist.files.length} {gist.files.length === 1 ? 'file' : 'files'} · {gist.viewCount} views
      </p>
    </article>
  );
}
