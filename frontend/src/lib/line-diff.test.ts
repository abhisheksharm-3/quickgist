import { describe, expect, it } from 'vitest';
import { diffLines, hasChanges } from '@/lib/line-diff';

/** The text of a diff, as a compact string, so a case reads as what it asserts. */
function shape(before: string, after: string): string {
  const lines = diffLines(before, after);
  if (!lines) {
    return 'null';
  }
  return lines
    .map((line) => `${line.kind === 'same' ? ' ' : line.kind === 'added' ? '+' : '-'}${line.text}`)
    .join('|');
}

describe('diffLines', () => {
  it('reports no change for identical text', () => {
    expect(shape('a\nb', 'a\nb')).toBe(' a| b');
    expect(hasChanges(diffLines('a\nb', 'a\nb') ?? [])).toBe(false);
  });

  it('finds an inserted line', () => {
    expect(shape('a\nc', 'a\nb\nc')).toBe(' a|+b| c');
  });

  it('finds a removed line', () => {
    expect(shape('a\nb\nc', 'a\nc')).toBe(' a|-b| c');
  });

  it('reports a changed line as a removal and an addition', () => {
    expect(shape('a\nb', 'a\nB')).toBe(' a|-b|+B');
  });

  it('numbers the lines it kept from each side', () => {
    const lines = diffLines('a\nb\nc', 'a\nc') ?? [];
    expect(lines.map((line) => [line.oldLine, line.newLine])).toEqual([
      [1, 1],
      [2, null],
      [3, 2],
    ]);
  });

  it('refuses a comparison too large to be worth making', () => {
    const huge = Array.from({ length: 2100 }, (_, i) => `line ${i}`).join('\n');
    expect(diffLines(huge, huge)).toBeNull();
  });
});
