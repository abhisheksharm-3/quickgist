/** The React context carrying the current session. */
import { createContext } from 'react';
import type { SessionStateType } from '@/types';

const unavailable = async (): Promise<void> => {
  throw new Error('Authentication is not configured');
};

export const SessionContext = createContext<SessionStateType>({
  user: null,
  isLoading: false,
  signInWithGitHub: unavailable,
  signOut: unavailable,
});
