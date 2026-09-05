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
 * theme.
 *
 * The first paint still uses the dark palette on bare :root whatever is stored, since
 * index.html carries no script: a reader who chose light sees one dark frame. Fixing
 * that means an inline script in the document head, which is a trade of a blocking
 * script against a single frame and has not been made.
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
