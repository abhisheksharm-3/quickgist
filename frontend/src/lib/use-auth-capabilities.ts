/** Hook exposing which sign-in methods are available. */

import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AuthCapabilitiesType } from '@/lib/auth-providers';
import { fetchAuthCapabilities } from '@/lib/auth-providers';

export function useAuthCapabilities(): UseQueryResult<AuthCapabilitiesType, Error> {
  return useQuery({
    queryKey: ['auth', 'capabilities'],
    queryFn: fetchAuthCapabilities,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
}
