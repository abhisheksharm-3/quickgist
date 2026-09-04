/**
 * TanStack Query cache keys, defined once so an invalidation cannot silently miss
 * a query that spelled its key differently.
 */
import type { ListGistsQueryType } from '@/types';

export const gistQueryKeys = {
  all: ['gists'] as const,
  detail: (slug: string) => ['gists', 'detail', slug] as const,
  list: (query: ListGistsQueryType) => ['gists', 'list', query] as const,
  feed: (query: ListGistsQueryType) => ['gists', 'feed', query] as const,
  search: (q: string) => ['gists', 'search', q] as const,
  revisions: (slug: string) => ['gists', 'revisions', slug] as const,
  revision: (slug: string, revision: number) => ['gists', 'revisions', slug, revision] as const,
};

export const profileQueryKeys = {
  me: (userId: string | undefined) => ['profile', 'me', userId] as const,
};
