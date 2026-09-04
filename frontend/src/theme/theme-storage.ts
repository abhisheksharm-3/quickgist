/** Reading and applying the stored theme choice. */
import type { ThemeType } from '@/theme/types';

export const THEME_STORAGE_KEY = 'quickgist-theme';

/**
 * Reads the stored choice, defaulting to `system`.
 *
 * Every access is guarded because a private window, cleared site data, or a browser
 * set to block storage makes `localStorage` throw on read rather than return null.
 */
export function readStoredTheme(): ThemeType {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    return 'system';
  }
  return 'system';
}

export function writeStoredTheme(theme: ThemeType): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    return;
  }
}

/**
 * Puts the choice on the root element.
 *
 * `system` removes the attribute rather than writing a value, which is what lets the
 * `prefers-color-scheme` rules in styles.css take over. Writing `data-theme="system"`
 * would match neither the light nor the dark selector and leave the page unstyled.
 */
export function applyTheme(theme: ThemeType): void {
  const root = document.documentElement;

  if (theme === 'system') {
    root.removeAttribute('data-theme');
    return;
  }
  root.setAttribute('data-theme', theme);
}
