/**
 * Persists the editor draft to `localStorage` so a reload never loses the
 * paste. Keyed per route (`new`, or `edit:<slug>`), so a create in progress and
 * an edit in progress never clobber each other.
 */
import { useEffect } from 'react';
import type { EditorDraftType } from '@/editor/types';

/**
 * The version in the prefix is deliberate.
 *
 * v2 came from the default filename gaining a `.md` extension, since a draft stored
 * under the old shape came back with a filename the renderer treats as plain text.
 * v3 discards the empty drafts an edit route used to persist before its gist had
 * loaded, which would otherwise keep opening blank for as long as they are stored.
 */
const STORAGE_PREFIX = 'quickgist:draft:v3:';

export function loadPersistedDraft(key: string): EditorDraftType | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as EditorDraftType) : null;
  } catch {
    return null;
  }
}

export function clearPersistedDraft(key: string): void {
  window.localStorage.removeItem(STORAGE_PREFIX + key);
}

/**
 * Writes the draft on every change, once the draft is the real one.
 *
 * `isReady` is what stops an edit route from persisting the empty placeholder it
 * holds while the gist is still in flight. Without it, that placeholder reached
 * storage first, and the next visit to the same URL restored the empty draft
 * instead of the gist, so editing a published gist opened a blank editor.
 */
export function usePersistDraft(key: string, draft: EditorDraftType, isReady: boolean): void {
  useEffect(() => {
    if (!isReady) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(draft));
    } catch {}
  }, [key, draft, isReady]);
}
