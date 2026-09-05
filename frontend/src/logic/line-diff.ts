/** A line diff, for comparing a stored revision with what a gist says now. */
import { MAX_DIFF_LINES } from '@/constants/app';
/**
 * Above this many lines on either side the table is not built.
 *
 * The algorithm is O(n·m) in time and memory, which is the right trade for two
 * versions of a document and the wrong one for two versions of a megabyte. The
 * caller shows the two files instead of a diff when this returns null.
 */
import type { DiffLineType } from '@/types/lib';

/**
 * Compares two texts line by line.
 *
 * A longest-common-subsequence table, which is the textbook diff and about forty
 * lines: a dependency for this would be larger than the code that uses it. Returns
 * null when either side is too long to compare, rather than freezing the tab.
 */
export function diffLines(before: string, after: string): DiffLineType[] | null {
  const oldLines = before.split('\n');
  const newLines = after.split('\n');

  if (oldLines.length > MAX_DIFF_LINES || newLines.length > MAX_DIFF_LINES) {
    return null;
  }

  const common = commonLengths(oldLines, newLines);
  const out: DiffLineType[] = [];

  let i = 0;
  let j = 0;

  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      out.push({ kind: 'same', text: oldLines[i] ?? '', oldLine: i + 1, newLine: j + 1 });
      i += 1;
      j += 1;
      continue;
    }

    const keepOld = (common[i + 1]?.[j] ?? 0) >= (common[i]?.[j + 1] ?? 0);
    if (keepOld) {
      out.push({ kind: 'removed', text: oldLines[i] ?? '', oldLine: i + 1, newLine: null });
      i += 1;
    } else {
      out.push({ kind: 'added', text: newLines[j] ?? '', oldLine: null, newLine: j + 1 });
      j += 1;
    }
  }

  while (i < oldLines.length) {
    out.push({ kind: 'removed', text: oldLines[i] ?? '', oldLine: i + 1, newLine: null });
    i += 1;
  }
  while (j < newLines.length) {
    out.push({ kind: 'added', text: newLines[j] ?? '', oldLine: null, newLine: j + 1 });
    j += 1;
  }

  return out;
}

/** Whether a diff contains any change at all. */
export function hasChanges(lines: DiffLineType[]): boolean {
  return lines.some((line) => line.kind !== 'same');
}

/**
 * `common[i][j]` is the length of the longest common subsequence of the lines from
 * i onwards and the lines from j onwards, which is what tells the walk above which
 * side to advance.
 */
function commonLengths(oldLines: string[], newLines: string[]): number[][] {
  const table: number[][] = Array.from({ length: oldLines.length + 1 }, () =>
    new Array<number>(newLines.length + 1).fill(0),
  );

  for (let i = oldLines.length - 1; i >= 0; i -= 1) {
    for (let j = newLines.length - 1; j >= 0; j -= 1) {
      const row = table[i];
      const next = table[i + 1];
      if (!row || !next) {
        continue;
      }
      row[j] =
        oldLines[i] === newLines[j]
          ? (next[j + 1] ?? 0) + 1
          : Math.max(next[j] ?? 0, row[j + 1] ?? 0);
    }
  }

  return table;
}
