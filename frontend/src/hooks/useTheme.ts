/** Hook for reading and changing the theme. */
import { useContext } from 'react';
import { ThemeContext } from '@/hooks/themeContext';
import type { ThemeStateType } from '@/types/theme';

export function useTheme(): ThemeStateType {
  return useContext(ThemeContext);
}
