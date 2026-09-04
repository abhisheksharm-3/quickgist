/** Table-driven coverage for the multi-file draft reducer. */
import { describe, expect, it } from 'vitest';
import { editorReducer } from '@/editor/editor-reducer';
import type { EditorActionType, EditorDraftType } from '@/editor/types';

function draftOf(filenames: string[], activeIndex = 0): EditorDraftType {
  return {
    title: '',
    files: filenames.map((filename, index) => ({
      id: `file-${index}`,
      filename,
      language: null,
      content: `content of ${filename}`,
    })),
    activeIndex,
  };
}

type CaseType = {
  name: string;
  draft: EditorDraftType;
  action: EditorActionType;
  expected: (result: EditorDraftType) => void;
};

const cases: CaseType[] = [
  {
    name: 'add appends a new file and switches to it',
    draft: draftOf(['README.md']),
    action: { type: 'add' },
    expected: (result) => {
      expect(result.files).toHaveLength(2);
      expect(result.files[1]?.filename).toBe('untitled-2.md');
      expect(result.activeIndex).toBe(1);
    },
  },
  {
    name: 'rename to a name already taken is rejected',
    draft: draftOf(['README.md', 'notes.md']),
    action: { type: 'rename', index: 1, filename: 'README.md' },
    expected: (result) => {
      expect(result.files.map((file) => file.filename)).toEqual(['README.md', 'notes.md']);
    },
  },
  {
    name: 'rename to a free name is applied',
    draft: draftOf(['README.md', 'notes.md']),
    action: { type: 'rename', index: 1, filename: 'todo.md' },
    expected: (result) => {
      expect(result.files[1]?.filename).toBe('todo.md');
    },
  },
  {
    name: 'remove the last remaining file is rejected',
    draft: draftOf(['README.md']),
    action: { type: 'remove', index: 0 },
    expected: (result) => {
      expect(result.files).toHaveLength(1);
      expect(result.files[0]?.filename).toBe('README.md');
    },
  },
  {
    name: 'remove drops the file and clamps the active index onto its neighbor',
    draft: draftOf(['a.md', 'b.md', 'c.md'], 2),
    action: { type: 'remove', index: 2 },
    expected: (result) => {
      expect(result.files.map((file) => file.filename)).toEqual(['a.md', 'b.md']);
      expect(result.activeIndex).toBe(1);
    },
  },
  {
    name: 'switch to an index that was just removed is a no-op',
    draft: (() => {
      const afterRemoval = editorReducer(draftOf(['a.md', 'b.md', 'c.md'], 2), {
        type: 'remove',
        index: 2,
      });
      return afterRemoval;
    })(),
    action: { type: 'switch', index: 2 },
    expected: (result) => {
      expect(result.files).toHaveLength(2);
      expect(result.activeIndex).toBe(1);
    },
  },
  {
    name: 'switch to a valid index updates the active file',
    draft: draftOf(['a.md', 'b.md']),
    action: { type: 'switch', index: 1 },
    expected: (result) => {
      expect(result.activeIndex).toBe(1);
    },
  },
  {
    name: 'edit replaces the content of the targeted file only',
    draft: draftOf(['a.md', 'b.md']),
    action: { type: 'edit', index: 1, content: 'updated' },
    expected: (result) => {
      expect(result.files[0]?.content).toBe('content of a.md');
      expect(result.files[1]?.content).toBe('updated');
    },
  },
];

describe('editorReducer', () => {
  it.each(cases)('$name', ({ draft, action, expected }) => {
    expected(editorReducer(draft, action));
  });
});
