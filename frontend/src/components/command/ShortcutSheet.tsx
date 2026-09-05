/** The `?` sheet listing the whole keyboard map. */
import { useEffect, useRef } from 'react';
import { KEYBOARD_MAP } from '@/content/command';
import type { ShortcutSheetPropsType } from '@/types/command';

export function ShortcutSheet({ isOpen, onClose }: ShortcutSheetPropsType) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Keyboard shortcuts"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
      className="w-full max-w-md border border-[var(--border-strong)] bg-[var(--panel)] p-5 text-[var(--text)] shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <h2 className="mb-3 text-sm font-semibold text-[var(--heading)]">Keyboard shortcuts</h2>
      <table className="w-full text-left text-sm">
        <tbody>
          {KEYBOARD_MAP.map((entry) => (
            <tr key={entry.keys} className="border-t border-[var(--border)] first:border-t-0">
              <td className="py-1.5 pr-3 font-mono text-xs text-[var(--heading)]">{entry.keys}</td>
              <td className="py-1.5 pr-3">{entry.action}</td>
              <td className="py-1.5 text-xs text-[var(--dim)]">{entry.where}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 border border-[var(--border-strong)] px-3 py-1.5 text-xs"
      >
        Close
      </button>
    </dialog>
  );
}
