/** Hook for reading the current session. */
import { useContext } from 'react';
import { SessionContext } from '@/auth/session-context';
import type { SessionStateType } from '@/types';

export function useSession(): SessionStateType {
  return useContext(SessionContext);
}
