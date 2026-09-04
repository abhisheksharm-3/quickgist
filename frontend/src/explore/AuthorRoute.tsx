/** One author's public gists, at `/u/:handle`. */
import { useNavigate, useParams } from 'react-router';
import { EmptyState } from '@/chrome/EmptyState';
import { ListSkeleton } from '@/chrome/ListSkeleton';
import { PageHeader } from '@/chrome/PageHeader';
import { RouteError } from '@/chrome/RouteError';
import { CommandPalette } from '@/command/CommandPalette';
import { GistList } from '@/explore/GistList';
import { useGistList } from '@/lib/use-gist-queries';

export function AuthorRoute() {
  const { handle = '' } = useParams();
  const navigate = useNavigate();
  const gists = useGistList({ author: handle });

  const publicCount = gists.data?.length ?? 0;

  return (
    <>
      <title>{`${handle} · quickgist`}</title>

      <PageHeader
        eyebrow="Author"
        title={handle}
        description="The public gists this person has published. Unlisted and private ones stay invisible to everyone but them."
        aside={
          gists.data ? (
            <p className="font-mono text-[11px] text-[var(--faint)]">
              {publicCount} {publicCount === 1 ? 'public gist' : 'public gists'}
            </p>
          ) : null
        }
      />

      {gists.isPending ? <ListSkeleton rows={3} /> : null}
      {gists.isError ? <RouteError error={gists.error} /> : null}
      {gists.data ? (
        <GistList
          gists={gists.data}
          empty={
            <EmptyState code="Empty" title="Nothing public here">
              This person has not published a public gist. Anything unlisted or private stays
              invisible to everyone but them.
            </EmptyState>
          }
        />
      ) : null}

      <CommandPalette onNew={() => navigate('/')} />
    </>
  );
}
