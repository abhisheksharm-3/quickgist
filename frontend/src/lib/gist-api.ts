/** The gist endpoints, one function per route. */
import { apiRequest, apiRequestEmpty, apiUpload } from '@/lib/api-client';
import { GistListSchema, GistSchema, RevisionListSchema, RevisionSchema } from '@/schemas';
import type {
  CreateGistInputType,
  FileInputType,
  GistType,
  ListGistsQueryType,
  RevisionSummaryType,
  RevisionType,
  UpdateGistInputType,
  UploadFileInputType,
} from '@/types';

export function fetchGist(slug: string, signal?: AbortSignal): Promise<GistType> {
  return apiRequest(`/v1/gists/${slug}`, GistSchema, signal ? { signal } : {});
}

export function listGists(query: ListGistsQueryType = {}): Promise<GistType[]> {
  return apiRequest('/v1/gists', GistListSchema, { query });
}

export function searchGists(q: string, limit?: number): Promise<GistType[]> {
  return apiRequest('/v1/gists/search', GistListSchema, { query: { q, limit } });
}

export function createGist(input: CreateGistInputType): Promise<GistType> {
  return apiRequest('/v1/gists', GistSchema, { method: 'POST', body: input });
}

export function updateGist(slug: string, input: UpdateGistInputType): Promise<GistType> {
  return apiRequest(`/v1/gists/${slug}`, GistSchema, { method: 'PATCH', body: input });
}

export function replaceGistFiles(slug: string, files: FileInputType[]): Promise<GistType> {
  return apiRequest(`/v1/gists/${slug}/files`, GistSchema, {
    method: 'PUT',
    body: { files },
  });
}

export function deleteGist(slug: string): Promise<void> {
  return apiRequestEmpty(`/v1/gists/${slug}`, { method: 'DELETE' });
}

export function listRevisions(slug: string): Promise<RevisionSummaryType[]> {
  return apiRequest(`/v1/gists/${slug}/revisions`, RevisionListSchema);
}

export function fetchRevision(slug: string, revision: number): Promise<RevisionType> {
  return apiRequest(`/v1/gists/${slug}/revisions/${revision}`, RevisionSchema);
}

export function restoreRevision(slug: string, revision: number): Promise<GistType> {
  return apiRequest(`/v1/gists/${slug}/revisions/${revision}/restore`, GistSchema, {
    method: 'POST',
  });
}

/**
 * Uploads one file to an existing gist.
 *
 * retentionDays is capped at 30 by the database whatever is sent, and omitting it
 * takes the 30-day default.
 */
export function uploadGistFile({
  slug,
  file,
  retentionDays,
}: UploadFileInputType): Promise<GistType> {
  const form = new FormData();
  form.append('file', file);

  if (retentionDays !== undefined) {
    form.append('retentionDays', String(retentionDays));
  }

  return apiUpload(`/v1/gists/${slug}/files`, GistSchema, form);
}
