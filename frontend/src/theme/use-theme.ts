/** Hook for reading and changing the theme. */
import { useContext } from 'react';
import { ThemeContext } from '@/theme/theme-context';
import type { ThemeStateType } from '@/theme/types';

export function useTheme(): ThemeStateType {
  return useContext(ThemeContext);
}
