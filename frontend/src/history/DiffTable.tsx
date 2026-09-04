/** One file's diff, as a two-gutter table. */
import type { DiffLineType } from '@/lib/line-diff';

type DiffTablePropsType = {
  lines: DiffLineType[];
};

const gutter =
  'w-10 shrink-0 px-2 text-right font-mono text-[10px] text-[var(--faint)] select-none';

/**
 * A diff.
 *
 * Two line-number gutters, then the text, coloured by what happened to it. Both
 * numbers are shown because that is what makes a diff quotable: the reader can say
 * which line moved to where, which a single column cannot express.
 *
 * A `+` and `-` marker carries the same information as the colour, so the table
 * still reads correctly to anyone who cannot tell the two greens apart.
 */
export function DiffTable({ lines }: DiffTablePropsType) {
  return (
    <div className="overflow-x-auto border border-[var(--border)] bg-[var(--panel)]">
      {lines.map((line) => (
        <div
          // A kept line carries both numbers, an added one its new number, a removed
          // one its old number, so the triple is unique across a diff even where the
          // text repeats.
          key={`${line.kind}-${line.oldLine ?? 'x'}-${line.newLine ?? 'x'}`}
          data-diff={line.kind}
          className="diff-row flex items-start font-mono text-[11.5px] leading-[1.7]"
        >
          <span className={gutter}>{line.oldLine ?? ''}</span>
          <span className={gutter}>{line.newLine ?? ''}</span>
          <span className="w-4 shrink-0 text-center text-[var(--faint)] select-none">
            {line.kind === 'added' ? '+' : line.kind === 'removed' ? '−' : ''}
          </span>
          <pre className="min-w-0 flex-1 px-2 whitespace-pre-wrap">{line.text}</pre>
        </div>
      ))}
    </div>
  );
}
