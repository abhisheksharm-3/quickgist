/** Hook for reading the current session. */
import { useContext } from 'react';
import { SessionContext } from '@/hooks/sessionContext';
import type { SessionStateType } from '@/types/index';

export function useSession(): SessionStateType {
  return useContext(SessionContext);
}
