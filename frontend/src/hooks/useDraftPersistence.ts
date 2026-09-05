/**
 * Persists the editor draft to `localStorage` so a reload never loses the
 * paste. Keyed per route (`new`, or `edit:<slug>`), so a create in progress and
 * an edit in progress never clobber each other.
 */
import { useEffect } from 'react';
import { STORAGE_PREFIX } from '@/constants/editor';
import type { EditorDraftType } from '@/types/editor';

export function loadPersistedDraft(key: string): EditorDraftType | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as EditorDraftType) : null;
  } catch {
    return null;
  }
}

/** Writes a draft outside the editor, which is how a fork reaches it. */
export function savePersistedDraft(key: string, draft: EditorDraftType): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(draft));
  } catch {}
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
