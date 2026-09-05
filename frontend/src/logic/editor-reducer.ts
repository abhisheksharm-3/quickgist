/**
 * The multi-file draft reducer: the internal contract between the draft state
 * and the panes that render it.
 *
 * Every action is pure and every invariant is enforced here rather than by
 * callers: a draft always has at least one file, and `activeIndex` is always a
 * valid index into `files`. An action that would break either invariant is a
 * no-op instead.
 */

import { DEFAULT_FILE_EXTENSION, MAX_FILES_PER_GIST } from '@/constants/editor';
import type {
  AttachedTextType,
  DraftFileType,
  EditorActionType,
  EditorDraftType,
} from '@/types/editor';
import type { GistType } from '@/types/index';

export function createEmptyDraft(): EditorDraftType {
  return {
    title: '',
    files: [createDraftFile(`untitled-1${DEFAULT_FILE_EXTENSION}`)],
    activeIndex: 0,
  };
}

/**
 * Copies a published gist into an editable draft.
 *
 * Only text files come across. An upload has no content in the payload and cannot be
 * copied by the browser, so a fork of a gist holding one is a fork of its text.
 */
export function createDraftFromGist(gist: GistType): EditorDraftType {
  const files = gist.files
    .filter((file) => file.content !== undefined)
    .map((file) => ({
      id: crypto.randomUUID(),
      filename: file.filename,
      language: file.language,
      content: file.content ?? '',
    }));

  return {
    title: gist.title,
    files: files.length > 0 ? files : [createDraftFile(`untitled-1${DEFAULT_FILE_EXTENSION}`)],
    activeIndex: 0,
  };
}

export function editorReducer(draft: EditorDraftType, action: EditorActionType): EditorDraftType {
  switch (action.type) {
    case 'add':
      return addFile(draft);
    case 'attach':
      return attachFiles(draft, action.files);
    case 'title':
      return { ...draft, title: action.title };
    case 'rename':
      return renameFile(draft, action.index, action.filename);
    case 'edit':
      return editFile(draft, action.index, action.content);
    case 'remove':
      return removeFile(draft, action.index);
    case 'switch':
      return switchFile(draft, action.index);
    case 'replace':
      return action.draft;
  }
}

function addFile(draft: EditorDraftType): EditorDraftType {
  if (draft.files.length >= MAX_FILES_PER_GIST) return draft;

  const file = createDraftFile(nextUntitledName(draft.files));
  return {
    ...draft,
    files: [...draft.files, file],
    activeIndex: draft.files.length,
  };
}

/**
 * Adds files read from disk.
 *
 * An untouched default file is replaced rather than kept, because dropping one file
 * onto an empty editor means opening it, not opening it beside a blank `untitled-1`
 * nobody asked for. A name already in the draft gets a suffix instead of silently
 * overwriting the file that holds it.
 */
function attachFiles(draft: EditorDraftType, added: AttachedTextType[]): EditorDraftType {
  const base = isUntouched(draft) ? [] : draft.files;
  const files = [...base];

  for (const file of added) {
    if (files.length >= MAX_FILES_PER_GIST) break;
    files.push({
      id: crypto.randomUUID(),
      filename: freeFilename(files, file.filename),
      language: null,
      content: file.content,
    });
  }

  if (files.length === 0) return draft;

  return { ...draft, files, activeIndex: files.length - 1 };
}

function isUntouched(draft: EditorDraftType): boolean {
  const only = draft.files[0];
  return draft.files.length === 1 && only !== undefined && only.content === '';
}

/** The requested name, or the first numbered variant of it that is free. */
function freeFilename(files: DraftFileType[], filename: string): string {
  if (!isFilenameTaken(files, filename, -1)) return filename;

  const dot = filename.lastIndexOf('.');
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const extension = dot > 0 ? filename.slice(dot) : '';

  let n = 2;
  while (isFilenameTaken(files, `${stem}-${n}${extension}`, -1)) n += 1;
  return `${stem}-${n}${extension}`;
}

function renameFile(draft: EditorDraftType, index: number, filename: string): EditorDraftType {
  if (!isValidIndex(draft, index)) return draft;

  const trimmed = filename.trim();
  if (trimmed.length === 0 || isFilenameTaken(draft.files, trimmed, index)) return draft;

  return {
    ...draft,
    files: draft.files.map((file, i) => (i === index ? { ...file, filename: trimmed } : file)),
  };
}

function editFile(draft: EditorDraftType, index: number, content: string): EditorDraftType {
  if (!isValidIndex(draft, index)) return draft;

  return {
    ...draft,
    files: draft.files.map((file, i) => (i === index ? { ...file, content } : file)),
  };
}

function removeFile(draft: EditorDraftType, index: number): EditorDraftType {
  if (!isValidIndex(draft, index) || draft.files.length <= 1) return draft;

  const files = draft.files.filter((_, i) => i !== index);
  const activeIndex =
    draft.activeIndex > index
      ? draft.activeIndex - 1
      : Math.min(draft.activeIndex, files.length - 1);

  return { ...draft, files, activeIndex };
}

function switchFile(draft: EditorDraftType, index: number): EditorDraftType {
  if (!isValidIndex(draft, index)) return draft;

  return { ...draft, activeIndex: index };
}

function isValidIndex(draft: EditorDraftType, index: number): boolean {
  return index >= 0 && index < draft.files.length;
}

function isFilenameTaken(files: DraftFileType[], filename: string, ignoreIndex: number): boolean {
  return files.some((file, i) => i !== ignoreIndex && file.filename === filename);
}

function nextUntitledName(files: DraftFileType[]): string {
  const taken = new Set(files.map((file) => file.filename));
  let n = files.length + 1;
  while (taken.has(`untitled-${n}${DEFAULT_FILE_EXTENSION}`)) n += 1;
  return `untitled-${n}${DEFAULT_FILE_EXTENSION}`;
}

function createDraftFile(filename: string): DraftFileType {
  return { id: crypto.randomUUID(), filename, language: null, content: '' };
}
