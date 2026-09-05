/** The band listing files waiting to be uploaded with the gist. */
import { X } from 'lucide-react';
import { formatBytes } from '@/logic/format-bytes';
import type { AttachmentQueuePropsType } from '@/types/editor';

/**
 * Queued uploads.
 *
 * These are the files that are not text, so they have no pane to appear in and no
 * preview to render. Listing them as a row of chips above the editor is what makes
 * them visible at all before publishing, and says plainly that they arrive with the
 * gist rather than being in it yet.
 */
export function AttachmentQueue({ queued, notice, onRemove }: AttachmentQueuePropsType) {
  if (queued.length === 0 && notice === null) {
    return null;
  }

  return (
    <div className="flex flex-none flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--border)] px-5 py-2 sm:px-8">
      {queued.length > 0 ? (
        <p className="font-mono text-[10px] tracking-[0.11em] text-[var(--faint)] uppercase">
          Uploads on publish
        </p>
      ) : null}

      {queued.map((file) => (
        <span
          key={file.name}
          className="flex items-center gap-2 border border-[var(--border-strong)] bg-[var(--panel-2)] py-0.5 pr-1 pl-2 font-mono text-[10.5px] text-[var(--dim)]"
        >
          {file.name}
          <span className="text-[var(--faint)]">{formatBytes(file.size)}</span>
          <button
            type="button"
            aria-label={`Remove ${file.name}`}
            onClick={() => onRemove(file.name)}
            className="grid size-4 place-items-center text-[var(--faint)] hover:text-[var(--heading)]"
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}

      {notice ? (
        <p role="status" className="text-[11px] text-[var(--dim)]">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
