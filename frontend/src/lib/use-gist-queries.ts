/** React Query hooks over the gist endpoints. */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';
import {
  fetchGist,
  fetchRevision,
  listGists,
  listRevisions,
  restoreRevision,
  searchGists,
} from '@/lib/gist-api';
import { gistQueryKeys } from '@/lib/query-keys';
import type { GistType, ListGistsQueryType, RevisionSummaryType, RevisionType } from '@/types';

/**
 * Reads one gist.
 *
 * Retrying a 404 is pointless, because a missing or private gist will not appear
 * on a second attempt, and a slug typo would otherwise take four round trips to
 * report.
 */
export function useGist(slug: string): UseQueryResult<GistType, ApiError> {
  return useQuery({
    queryKey: gistQueryKeys.detail(slug),
    queryFn: ({ signal }) => fetchGist(slug, signal),
    enabled: slug.length > 0,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.isNotFound || error.isUnauthenticated)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useGistList(query: ListGistsQueryType = {}): UseQueryResult<GistType[], ApiError> {
  return useQuery({
    queryKey: gistQueryKeys.list(query),
    queryFn: () => listGists(query),
  });
}

export function useGistSearch(q: string): UseQueryResult<GistType[], ApiError> {
  return useQuery({
    queryKey: gistQueryKeys.search(q),
    queryFn: () => searchGists(q),
    enabled: q.trim().length > 0,
  });
}

/**
 * A gist's version list.
 *
 * Kept fresh for a minute rather than per navigation: history only changes when its
 * author saves, and the page showing it is usually opened, read and left.
 */
export function useRevisions(slug: string): UseQueryResult<RevisionSummaryType[], ApiError> {
  return useQuery({
    queryKey: gistQueryKeys.revisions(slug),
    queryFn: () => listRevisions(slug),
    enabled: slug.length > 0,
    staleTime: 60 * 1000,
  });
}

export function useRevision(
  slug: string,
  revision: number | null,
): UseQueryResult<RevisionType, ApiError> {
  return useQuery({
    queryKey: gistQueryKeys.revision(slug, revision ?? 0),
    queryFn: () => fetchRevision(slug, revision ?? 0),
    enabled: slug.length > 0 && revision !== null,
  });
}

type RestoreVariablesType = {
  slug: string;
  revision: number;
};

export function useRestoreRevision(): UseMutationResult<GistType, ApiError, RestoreVariablesType> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, revision }: RestoreVariablesType) => restoreRevision(slug, revision),
    onSuccess: (gist) => {
      queryClient.setQueryData(gistQueryKeys.detail(gist.slug), gist);
      void queryClient.invalidateQueries({ queryKey: gistQueryKeys.revisions(gist.slug) });
    },
  });
}
