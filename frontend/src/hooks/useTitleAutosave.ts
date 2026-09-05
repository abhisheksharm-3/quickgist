/** Saving a published gist's title as it is typed. */
import { useEffect, useRef } from 'react';
import { updateGist } from '@/api/gists';
import { TITLE_SAVE_DEBOUNCE_MS } from '@/constants/editor';
import type { EditorActionType } from '@/types/editor';

/**
 * Returns the handler the title field calls on every keystroke.
 *
 * The draft is updated at once so the field stays responsive, and the save is
 * debounced behind it. On a new gist there is nothing to save to, so it only
 * updates the draft; the title travels with the create request instead.
 *
 * A failed save is swallowed on purpose: the title is saved again on the next
 * keystroke and on publish, and an error band over a field somebody is still typing
 * in would be noise rather than news.
 */
export function useTitleAutosave(
  slug: string | undefined,
  dispatch: React.Dispatch<EditorActionType>,
): (title: string) => void {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (title: string): void => {
    dispatch({ type: 'title', title });

    if (slug === undefined) {
      return;
    }

    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void updateGist(slug, { title }).catch(() => undefined);
    }, TITLE_SAVE_DEBOUNCE_MS);
  };
}
