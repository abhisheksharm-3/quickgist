import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { DeleteGistDialog } from '@/components/gist/DeleteGistDialog';

/** jsdom implements <dialog> without showModal, which the component calls on open. */
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
});

afterEach(cleanup);

function renderDialog(overrides = {}) {
  const props = {
    title: 'Deploy notes',
    fileCount: 2,
    isOpen: true,
    isDeleting: false,
    error: null,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<DeleteGistDialog {...props} />);
  return props;
}

describe('DeleteGistDialog', () => {
  it('names the gist and what goes with it', () => {
    renderDialog();
    expect(screen.getByRole('heading', { name: 'Deploy notes' })).toBeTruthy();
    expect(screen.getByText(/all 2 files/)).toBeTruthy();
  });

  it('speaks of one file in the singular', () => {
    renderDialog({ fileCount: 1 });
    expect(screen.getByText(/the file and every revision/)).toBeTruthy();
  });

  it('confirms only when the destructive button is pressed', () => {
    const props = renderDialog();
    screen.getByRole('button', { name: 'Keep it' }).click();
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onConfirm).not.toHaveBeenCalled();

    screen.getByRole('button', { name: 'Delete this gist' }).click();
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cannot be confirmed twice while a delete is in flight', () => {
    renderDialog({ isDeleting: true });
    const button = screen.getByRole('button', { name: 'Deleting…' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('shows a failed delete as an alert instead of closing', () => {
    renderDialog({ error: 'Not Found' });
    expect(screen.getByRole('alert').textContent).toBe('Not Found');
  });
});
