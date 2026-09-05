/** The React context carrying the theme choice. */
import { createContext } from 'react';
import type { ThemeStateType } from '@/types/theme';

export const ThemeContext = createContext<ThemeStateType>({
  theme: 'system',
  setTheme: () => undefined,
});
