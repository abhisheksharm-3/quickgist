/** Copying text, and saying so for a moment afterwards. */
import { useState } from 'react';
import { COPY_FEEDBACK_MS } from '@/constants/app';

/**
 * Writes to the clipboard and reports success for a beat.
 *
 * The flag resets itself, so a component gets the whole interaction from one call
 * rather than keeping a timer of its own alive across renders.
 */
export function useCopyFeedback(): { justCopied: boolean; copy: (text: string) => void } {
  const [justCopied, setJustCopied] = useState(false);

  const copy = (text: string): void => {
    void navigator.clipboard.writeText(text).then(() => {
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), COPY_FEEDBACK_MS);
    });
  };

  return { justCopied, copy };
}
