/** The three themes, the order the toggle cycles them in, and how each is named.
 *
 * They live with the theme rather than with the two components that read them,
 * because a fourth theme would otherwise have to be added in two places that do not
 * import each other.
 */
import { Monitor, Moon, Sun } from 'lucide-react';
import type { ThemeType } from '@/theme/types';

export const ORDER: ThemeType[] = ['system', 'light', 'dark'];

export const LABEL: Record<ThemeType, string> = {
  system: 'Theme: following system',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

export const ICON: Record<ThemeType, typeof Monitor> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

export const NEXT_THEME: Record<ThemeType, ThemeType> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

export const THEME_ACTION: Record<ThemeType, string> = {
  system: 'Use the light theme',
  light: 'Use the dark theme',
  dark: 'Follow the system theme',
};

export const THEME_ICON: Record<ThemeType, typeof Monitor> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

export const THEME_STORAGE_KEY = 'quickgist-theme';
