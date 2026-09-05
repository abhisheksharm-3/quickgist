/** Wires the app's single-letter and modifier keyboard map to a document listener. */
import { useEffect, useEffectEvent } from 'react';
import type { GlobalShortcutHandlersType } from '@/command/types';

/**
 * Suppresses every single-letter binding while a text field has focus, so typing
 * "new" into a search box does not fire the N shortcut. `⌘K` is exempt, since a
 * modifier key never collides with typed text.
 */
export function useGlobalShortcuts(handlers: GlobalShortcutHandlersType): void {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handlers.onOpenPalette();
      return;
    }

    if (isTextFieldFocused()) {
      return;
    }

    if (event.key === '?') {
      handlers.onOpenShortcuts();
      return;
    }
    if (event.key.toLowerCase() === 'n' && handlers.onNew) {
      handlers.onNew();
      return;
    }
    if (event.key.toLowerCase() === 'e' && handlers.onEdit) {
      handlers.onEdit();
      return;
    }
    if (event.key === '/' && handlers.onFocusSearch) {
      event.preventDefault();
      handlers.onFocusSearch();
      return;
    }
    if (handlers.onSwitchFile && /^[1-9]$/.test(event.key)) {
      handlers.onSwitchFile(Number(event.key) - 1);
    }
  });

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}

function isTextFieldFocused(): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) {
    return false;
  }
  return (
    active.isContentEditable ||
    active.tagName === 'INPUT' ||
    active.tagName === 'TEXTAREA' ||
    active.tagName === 'SELECT'
  );
}
