/** React Query hooks over the gist endpoints. */

import type {
  UseInfiniteQueryResult,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  deleteGist,
  fetchGist,
  fetchRevision,
  listGists,
  listRevisions,
  restoreRevision,
  searchGists,
} from '@/api/gists';
import { gistQueryKeys } from '@/api/query-keys';
import { FEED_PAGE_SIZE } from '@/constants/app';
import type {
  FeedCursorType,
  GistType,
  ListGistsQueryType,
  RevisionSummaryType,
  RevisionType,
} from '@/types/index';
import type { RestoreVariablesType } from '@/types/lib';

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

/**
 * The feed, one page at a time.
 *
 * Pages are keyset-based, and the cursor is a pair: the created_at and the slug of
 * the last gist on the page before, sent as `before` and `beforeSlug`. The timestamp
 * alone is not unique, and comparing on it alone dropped every gist that shared a
 * timestamp with that last row. Offsets were the other option and get slower the
 * further you read, as well as skipping or repeating a row whenever something is
 * published while somebody is paging.
 *
 * A page shorter than FEED_PAGE_SIZE is the last one, which saves the request that would
 * otherwise be needed to discover the end.
 */
export function useGistFeed(
  query: ListGistsQueryType = {},
): UseInfiniteQueryResult<GistType[], ApiError> {
  return useInfiniteQuery({
    queryKey: gistQueryKeys.feed(query),
    queryFn: ({ pageParam }) =>
      listGists({
        ...query,
        limit: FEED_PAGE_SIZE,
        ...(pageParam ? { before: pageParam.before, beforeSlug: pageParam.beforeSlug } : {}),
      }),
    initialPageParam: null as FeedCursorType | null,
    getNextPageParam: (lastPage): FeedCursorType | undefined => {
      const last = lastPage[lastPage.length - 1];
      if (lastPage.length < FEED_PAGE_SIZE || !last) {
        return undefined;
      }
      return { before: last.createdAt, beforeSlug: last.slug };
    },
    select: (data) => data.pages.flat(),
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

/**
 * Deletes a gist.
 *
 * The cached detail is removed rather than invalidated, because a refetch of a gist
 * that no longer exists is a 404 the page would have to handle for no reason.
 */
export function useDeleteGist(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGist,
    onSuccess: (_result, slug) => {
      queryClient.removeQueries({ queryKey: gistQueryKeys.detail(slug) });
      void queryClient.invalidateQueries({ queryKey: gistQueryKeys.all });
    },
  });
}
