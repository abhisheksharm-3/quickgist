/** The signed-in caller's own profile, from the API. */

import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/use-session';
import { apiRequest } from '@/lib/api-client';
import { profileQueryKeys } from '@/lib/query-keys';
import { AuthorSchema } from '@/schemas';
import type { AuthorType } from '@/types';

/**
 * Reads `GET /v1/me`.
 *
 * This replaced a client-side guess at the handle taken from OAuth metadata, which
 * was absent for a password account and wrong whenever the database de-duplicated a
 * handle. When the guess failed it returned null, and a null handle made the gist
 * list fall back to the public feed, so `/me` quietly showed other people's gists.
 */
export function useMyProfile(): UseQueryResult<AuthorType, Error> {
  const { user } = useSession();

  return useQuery({
    queryKey: profileQueryKeys.me(user?.id),
    queryFn: () => apiRequest('/v1/me', AuthorSchema),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });
}
