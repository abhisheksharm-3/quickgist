/** Theme selection types. */
import type { ReactNode } from 'react';
/**
 * The three states a theme choice can be in.
 *
 * `system` is a real state, not the absence of one: it means follow the operating
 * system and keep following it when it changes.
 */
export type ThemeType = 'light' | 'dark' | 'system';

export type ThemeStateType = {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
};

export type ThemeProviderPropsType = {
  children: ReactNode;
};
