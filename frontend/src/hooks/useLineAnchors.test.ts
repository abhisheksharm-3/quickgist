import { describe, expect, it } from 'vitest';
import { formatLineRange, parseLineRange } from '@/hooks/useLineAnchors';

describe('parseLineRange', () => {
  it('reads a single line and a range', () => {
    expect(parseLineRange('#L12')).toEqual([12, 12]);
    expect(parseLineRange('#L12-L20')).toEqual([12, 20]);
  });

  it('normalises a range written backwards', () => {
    expect(parseLineRange('#L20-L12')).toEqual([12, 20]);
  });

  it('rejects anything that is not a line fragment', () => {
    expect(parseLineRange('')).toBeNull();
    expect(parseLineRange('#how-it-works')).toBeNull();
    expect(parseLineRange('#L')).toBeNull();
    expect(parseLineRange('#L1x')).toBeNull();
  });
});

describe('formatLineRange', () => {
  it('collapses one line and orders two', () => {
    expect(formatLineRange(4, 4)).toBe('L4');
    expect(formatLineRange(9, 4)).toBe('L4-L9');
  });
});
