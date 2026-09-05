/** The confirmation a gist has to pass before it is deleted. */
import { useEffect, useRef } from 'react';
import type { DeleteGistDialogPropsType } from '@/types/gist';

/**
 * The delete confirmation.
 *
 * A native `<dialog>` opened with `showModal`, which is where the focus trap, the
 * backdrop, Escape and the inert background all come from the platform rather than
 * from code that has to be kept correct. It is the same element the mobile
 * navigation uses.
 *
 * It names what will go and says the link dies with it, because that is the part
 * somebody regrets: a gist is usually a link that has already been sent to
 * somebody. Cancel is focused on open, so an accidental Enter cancels.
 */
export function DeleteGistDialog({
  title,
  fileCount,
  isOpen,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}: DeleteGistDialogPropsType) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    }
    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      aria-labelledby="delete-gist-heading"
      className="confirm-dialog"
    >
      <div className="border border-[var(--border-strong)] bg-[var(--panel)] px-6 py-5">
        <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--faint)] uppercase">
          Delete
        </p>

        <h2
          id="delete-gist-heading"
          className="mt-3 text-[17px] font-semibold tracking-[-0.02em] text-[var(--heading)]"
        >
          {title}
        </h2>

        <p className="mt-3 max-w-[44ch] text-[12.5px] leading-[1.65] text-[var(--dim)]">
          This removes {fileCount === 1 ? 'the file' : `all ${fileCount} files`} and every revision
          of them. The link stops working for everyone you sent it to, and nothing here can bring it
          back.
        </p>

        {error ? (
          <p role="alert" className="mt-3 text-[12px] text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="border border-[var(--border-strong)] bg-[var(--panel-2)] px-3 py-1.5 text-[12.5px] text-[var(--dim)] transition-colors hover:border-[var(--dim)] hover:text-[var(--heading)]"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-[var(--danger)] px-3 py-1.5 text-[12.5px] font-medium text-white transition-opacity disabled:opacity-50"
          >
            {isDeleting ? 'Deleting…' : 'Delete this gist'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
