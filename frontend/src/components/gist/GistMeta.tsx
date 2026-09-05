/** The gist's title, byline and actions, above the file tabs. */
import { Check, Copy, FileCode, GitFork, History, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { action } from '@/constants/gist';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import { savePersistedDraft } from '@/hooks/useDraftPersistence';
import { createDraftFromGist } from '@/logic/editor-reducer';
import type { GistMetaPropsType } from '@/types/gist';

/**
 * The gist header.
 *
 * Inset to the same edge as every other row on the page, rather than centred in a
 * container of its own, which left the title floating while the tab strip below it
 * started at the window edge.
 *
 * Visibility is a bordered chip because whether a link is public is the one fact on
 * this line somebody might act on.
 */
export function GistMeta({ gist, rawUrl, editUrl, revisionCount, onDelete }: GistMetaPropsType) {
  const navigate = useNavigate();
  const { justCopied, copy } = useCopyFeedback();

  /**
   * Forking loads the gist into the new-gist draft and opens the editor.
   *
   * It creates nothing until the fork is published, so it needs no account and no
   * endpoint of its own: the draft is the same one the editor would have persisted
   * had the text been typed.
   */
  const handleFork = (): void => {
    savePersistedDraft('new', createDraftFromGist(gist));
    navigate('/');
  };

  return (
    <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 border-b border-[var(--border)] px-5 py-4 sm:px-8 sm:py-5">
      <div className="min-w-0">
        <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--heading)]">
          {gist.title}
        </h1>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10.5px] text-[var(--faint)]">
          <span className="border border-[var(--border-strong)] bg-[var(--panel-2)] px-1.5 py-0.5 text-[var(--dim)]">
            {gist.visibility}
          </span>
          {gist.author ? (
            <Link
              to={`/u/${gist.author.handle}`}
              className="underline underline-offset-[3px] hover:text-[var(--heading)]"
            >
              {gist.author.handle}
            </Link>
          ) : (
            <span>anonymous</span>
          )}
          <span aria-hidden>·</span>
          <span>
            {gist.files.length} {gist.files.length === 1 ? 'file' : 'files'}
          </span>
          <span aria-hidden>·</span>
          <span>
            {gist.viewCount} {gist.viewCount === 1 ? 'view' : 'views'}
          </span>
        </p>

        {gist.description ? (
          <p className="mt-2.5 max-w-[68ch] text-[12.5px] leading-[1.65] text-[var(--dim)]">
            {gist.description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-none items-center gap-2">
        <button type="button" onClick={() => copy(window.location.href)} className={action}>
          {justCopied ? (
            <Check className="size-3 text-[var(--blue-action)]" aria-hidden />
          ) : (
            <Copy className="size-3" aria-hidden />
          )}
          {justCopied ? 'Copied' : 'Copy link'}
        </button>

        {revisionCount > 0 ? (
          <Link to={`/g/${gist.slug}/history`} className={action}>
            <History className="size-3" aria-hidden />
            {revisionCount === 1 ? '1 revision' : `${revisionCount} revisions`}
          </Link>
        ) : null}

        <button type="button" onClick={handleFork} className={action}>
          <GitFork className="size-3" aria-hidden />
          Fork
        </button>

        {rawUrl ? (
          <a href={rawUrl} className={action}>
            <FileCode className="size-3" aria-hidden />
            Raw
          </a>
        ) : null}

        {editUrl ? (
          <Link to={editUrl} className={action}>
            <Pencil className="size-3" aria-hidden />
            Edit
          </Link>
        ) : null}

        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className={`${action} hover:border-[var(--danger)] hover:text-[var(--danger)]`}
          >
            <Trash2 className="size-3" aria-hidden />
            Delete
          </button>
        ) : null}
      </div>
    </header>
  );
}
