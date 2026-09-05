/** One selected revision, compared with the gist as it stands now. */

import { useRestoreRevision, useRevision } from '@/api/useGistQueries';
import { ListSkeleton } from '@/components/chrome/ListSkeleton';
import { RouteError } from '@/components/chrome/RouteError';
import { FileDiff } from '@/components/history/FileDiff';
import { fileNames } from '@/logic/revision-files';
import type { RevisionDiffPropsType } from '@/types/history';

export function RevisionDiff({ slug, revision, gist, canRestore }: RevisionDiffPropsType) {
  const stored = useRevision(slug, revision);
  const restore = useRestoreRevision();

  if (stored.isPending) {
    return <ListSkeleton rows={2} />;
  }
  if (stored.isError) {
    return <RouteError error={stored.error} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-[var(--border)] px-5 py-3 sm:px-8">
        <p className="text-[12.5px] text-[var(--dim)]">
          <span className="text-[var(--heading)]">revision {stored.data.revision}</span> compared
          with the gist as it stands now
        </p>

        {canRestore ? (
          <button
            type="button"
            disabled={restore.isPending}
            onClick={() => restore.mutate({ slug, revision })}
            className="border border-[var(--border-strong)] bg-[var(--panel-2)] px-3 py-1 text-[11.5px] text-[var(--dim)] transition-colors hover:border-[var(--dim)] hover:text-[var(--heading)] disabled:opacity-50"
          >
            {restore.isPending ? 'Restoring…' : 'Restore this version'}
          </button>
        ) : null}
      </div>

      {restore.isError ? (
        <p role="alert" className="px-5 py-3 text-[12px] text-[var(--dim)] sm:px-8">
          {restore.error.message}
        </p>
      ) : null}

      <div className="space-y-8 px-5 py-6 sm:px-8">
        {fileNames(stored.data, gist).map((filename) => (
          <FileDiff key={filename} filename={filename} stored={stored.data} gist={gist} />
        ))}
      </div>
    </div>
  );
}
