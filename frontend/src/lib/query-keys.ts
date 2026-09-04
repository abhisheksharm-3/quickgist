/**
 * TanStack Query cache keys, defined once so an invalidation cannot silently miss
 * a query that spelled its key differently.
 */
import type { ListGistsQueryType } from '@/types';

export const gistQueryKeys = {
  all: ['gists'] as const,
  detail: (slug: string) => ['gists', 'detail', slug] as const,
  list: (query: ListGistsQueryType) => ['gists', 'list', query] as const,
  search: (q: string) => ['gists', 'search', q] as const,
};
