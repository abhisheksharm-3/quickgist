/** A gist's version history, at `/g/:slug/history`. */
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { EmptyState } from '@/chrome/EmptyState';
import { ListSkeleton } from '@/chrome/ListSkeleton';
import { PageHeader } from '@/chrome/PageHeader';
import { RouteError } from '@/chrome/RouteError';
import { RevisionDiff } from '@/history/RevisionDiff';
import { cn } from '@/lib/cn';
import { useGist, useRevisions } from '@/lib/use-gist-queries';
import { useMyProfile } from '@/lib/use-my-profile';

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/**
 * The history page.
 *
 * A gist's files are replaced wholesale on every save, so a revision is a complete
 * file set and the comparison worth showing is that set against the current one. The
 * list is on the left, the diff of the selected version is on the right, which keeps
 * the answer to "what changed" one click from the question.
 */
export function HistoryRoute() {
  const { slug = '' } = useParams();
  const gist = useGist(slug);
  const revisions = useRevisions(slug);
  const profile = useMyProfile();
  const [selected, setSelected] = useState<number | null>(null);

  const isAuthor = Boolean(
    gist.data?.author && profile.data && gist.data.author.handle === profile.data.handle,
  );

  return (
    <>
      <title>{`History · ${gist.data?.title ?? 'gist'} · quickgist`}</title>
      <meta name="robots" content="noindex" />

      <PageHeader
        eyebrow="History"
        title={gist.data?.title ?? 'Gist history'}
        description="Every save keeps the file set it replaced. Pick a version to see what changed between it and the gist as it stands now."
        aside={
          <Link
            to={`/g/${slug}`}
            className="font-mono text-[11px] text-[var(--dim)] underline underline-offset-[3px] hover:text-[var(--heading)]"
          >
            Back to the gist
          </Link>
        }
      />

      {revisions.isPending ? <ListSkeleton rows={3} /> : null}
      {revisions.isError ? <RouteError error={revisions.error} /> : null}

      {revisions.data?.length === 0 ? (
        <EmptyState
          code="No history"
          title="This gist has never been edited"
          actions={[{ label: 'Read it', to: `/g/${slug}`, primary: true }]}
        >
          A version appears here the first time its author saves a change. The gist as published is
          still its only version.
        </EmptyState>
      ) : null}

      {revisions.data && revisions.data.length > 0 ? (
        <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)]">
          <ul className="divide-y divide-[var(--border)] border-b border-[var(--border)] lg:border-r lg:border-b-0">
            {revisions.data.map((revision) => (
              <li key={revision.revision}>
                <button
                  type="button"
                  onClick={() =>
                    setSelected((current) =>
                      current === revision.revision ? null : revision.revision,
                    )
                  }
                  aria-pressed={selected === revision.revision}
                  className={cn(
                    'block w-full border-l-2 px-5 py-3.5 text-left transition-colors sm:px-6',
                    selected === revision.revision
                      ? 'border-[var(--blue-action)] bg-[var(--panel)]'
                      : 'border-transparent hover:bg-[var(--panel)]',
                  )}
                >
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[11px] text-[var(--heading)]">
                      revision {revision.revision}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--faint)]">
                      {revision.fileCount} {revision.fileCount === 1 ? 'file' : 'files'}
                    </span>
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--dim)]">
                    {dateTime.format(new Date(revision.createdAt))}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <div className="min-w-0">
            {selected === null ? (
              <p className="px-5 py-8 text-[12.5px] text-[var(--dim)] sm:px-8">
                Pick a version on the left.
              </p>
            ) : (
              <RevisionDiff
                slug={slug}
                revision={selected}
                gist={gist.data}
                canRestore={isAuthor}
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
