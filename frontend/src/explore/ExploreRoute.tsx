/** The public feed and full-text search over it, at `/explore`. */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { EmptyState } from '@/chrome/EmptyState';
import { ListSkeleton } from '@/chrome/ListSkeleton';
import { OfflineBand } from '@/chrome/OfflineBand';
import { PageHeader } from '@/chrome/PageHeader';
import { CommandPalette } from '@/command/CommandPalette';
import { GistList } from '@/explore/GistList';
import { SearchField } from '@/explore/SearchField';
import { isNetworkError } from '@/lib/network-error';
import { useGistList, useGistSearch } from '@/lib/use-gist-queries';

export function ExploreRoute() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const searchFieldRef = useRef<HTMLInputElement>(null);
  const isSearching = query.trim().length > 0;

  const feed = useGistList({ limit: 30 });
  const search = useGistSearch(query);
  const active = isSearching ? search : feed;

  return (
    <>
      <title>Explore · quickgist</title>
      <meta name="description" content="Public gists on quickgist." />

      <PageHeader
        eyebrow="Public feed"
        title="Explore"
        description="Only public gists appear here. Unlisted and private ones are never listed or searchable."
        aside={
          feed.data ? (
            <p className="font-mono text-[11px] text-[var(--faint)]">
              {feed.data.length} {feed.data.length === 1 ? 'gist' : 'gists'}
            </p>
          ) : null
        }
      >
        <div className="border-t border-[var(--border)] px-5 py-3 sm:px-8">
          <SearchField ref={searchFieldRef} value={query} onChange={setQuery} />
        </div>
      </PageHeader>

      {active.isPending ? <ListSkeleton rows={5} /> : null}
      {active.isError ? (
        isNetworkError(active.error) ? (
          <OfflineBand />
        ) : (
          <p className="px-5 py-6 text-[12.5px] text-[var(--body)] sm:px-8">
            {active.error.message}
          </p>
        )
      ) : null}

      {active.data ? (
        <GistList
          gists={active.data}
          empty={
            isSearching ? (
              <EmptyState code="No results" title="Nothing matches that">
                Search covers titles, descriptions and the text inside public gists. Unlisted and
                private ones are never searchable, by anyone.
              </EmptyState>
            ) : (
              <EmptyState
                code="Empty"
                title="No public gists yet"
                actions={[{ label: 'Publish the first one', to: '/', primary: true }]}
              >
                Gists are unlisted by default, so only the ones someone chose to make public show up
                here.
              </EmptyState>
            )
          }
        />
      ) : null}

      <CommandPalette
        onNew={() => navigate('/')}
        onFocusSearch={() => searchFieldRef.current?.focus()}
      />
    </>
  );
}
