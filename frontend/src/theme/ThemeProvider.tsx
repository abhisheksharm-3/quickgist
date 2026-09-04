/** Holds the theme choice and keeps the root element in step with it. */

import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { ThemeContext } from '@/theme/theme-context';
import { applyTheme, readStoredTheme, writeStoredTheme } from '@/theme/theme-storage';
import type { ThemeStateType, ThemeType } from '@/theme/types';

type ThemeProviderPropsType = {
  children: ReactNode;
};

/**
 * Provides the theme choice.
 *
 * The initial value comes from storage during the first render rather than from an
 * effect, because an effect runs after paint and the page would flash the wrong
 * theme. index.html applies the same value before React loads at all.
 */
export function ThemeProvider({ children }: ThemeProviderPropsType) {
  const [theme, setThemeState] = useState<ThemeType>(readStoredTheme);

  const setTheme = useCallback((next: ThemeType): void => {
    setThemeState(next);
    writeStoredTheme(next);
    applyTheme(next);
  }, []);

  const value = useMemo<ThemeStateType>(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
