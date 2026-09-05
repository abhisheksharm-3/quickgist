/** The React context carrying the current session. */
import { createContext } from 'react';
import type { SessionStateType } from '@/types/index';

const unavailable = async (): Promise<never> => {
  throw new Error('Authentication is not configured');
};

export const SessionContext = createContext<SessionStateType>({
  user: null,
  isLoading: false,
  signInWithOAuth: unavailable,
  signInWithPassword: unavailable,
  signUpWithPassword: unavailable,
  signOut: unavailable,
});
