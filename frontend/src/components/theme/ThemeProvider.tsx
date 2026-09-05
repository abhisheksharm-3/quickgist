/** Holds the theme choice and keeps the root element in step with it. */

import { useCallback, useMemo, useState } from 'react';
import { ThemeContext } from '@/hooks/themeContext';
import { applyTheme, readStoredTheme, writeStoredTheme } from '@/logic/theme-storage';
import type { ThemeProviderPropsType, ThemeStateType, ThemeType } from '@/types/theme';

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
