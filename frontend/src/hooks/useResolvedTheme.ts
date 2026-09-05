/** The theme actually in effect, with `system` resolved to light or dark. */
import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

/**
 * Resolves `system` to whichever the operating system currently prefers, and keeps
 * following it. Anything that needs a concrete palette, rather than a choice, wants
 * this rather than the raw setting.
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const { theme } = useTheme();
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent): void => setSystemPrefersDark(event.matches);

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  if (theme === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return theme;
}
