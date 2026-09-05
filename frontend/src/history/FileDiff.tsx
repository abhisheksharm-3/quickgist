/** One file of a revision, compared with the same file now. */
import { DiffTable } from '@/history/DiffTable';
import type { FileDiffPropsType } from '@/history/types';
import { diffLines, hasChanges } from '@/lib/line-diff';

/**
 * One file, compared.
 *
 * A file that is only in one version is stated rather than diffed, because a diff of
 * something against nothing is just the file with every line marked, which says less
 * than the sentence does.
 */
export function FileDiff({ filename, stored, gist }: FileDiffPropsType) {
  const before = stored.files.find((file) => file.filename === filename);
  const after = gist?.files.find((file) => file.filename === filename);

  const label = (
    <p className="mb-2 font-mono text-[11px] text-[var(--heading)]">
      {filename}
      {before && !after ? <span className="text-[var(--faint)]"> · removed since</span> : null}
      {after && !before ? <span className="text-[var(--faint)]"> · added since</span> : null}
    </p>
  );

  if (!before || !after) {
    return (
      <section>
        {label}
        <p className="text-[12px] text-[var(--dim)]">
          {before
            ? 'This file was in that version and is not in the gist now.'
            : 'This file is in the gist now and was not in that version.'}
        </p>
      </section>
    );
  }

  const lines = diffLines(before.content ?? '', after.content ?? '');

  if (lines === null) {
    return (
      <section>
        {label}
        <p className="text-[12px] text-[var(--dim)]">
          This file is too long to compare line by line. Open the raw file from either version
          instead.
        </p>
      </section>
    );
  }

  if (!hasChanges(lines)) {
    return (
      <section>
        {label}
        <p className="text-[12px] text-[var(--dim)]">Unchanged.</p>
      </section>
    );
  }

  return (
    <section>
      {label}
      <DiffTable lines={lines} />
    </section>
  );
}
