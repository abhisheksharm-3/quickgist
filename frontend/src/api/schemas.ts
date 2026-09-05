/**
 * Zod schemas for everything the API returns.
 *
 * Responses are parsed rather than cast, so a backend change surfaces here as a
 * validation error instead of an `undefined` three components deeper.
 */
import { z } from 'zod';

export const VisibilitySchema = z.enum(['public', 'unlisted', 'private']);

export const FileKindSchema = z.enum(['markdown', 'code', 'text', 'binary']);

export const AuthorSchema = z.object({
  handle: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
});

export const GistFileSchema = z.object({
  filename: z.string(),
  language: z.string().nullable(),
  kind: FileKindSchema,
  byteSize: z.number(),
  content: z.string().optional(),
  html: z.string().optional(),
  rawUrl: z.string(),
  blobExpiresAt: z.string().optional(),
});

export const GistSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  visibility: VisibilitySchema,
  viewCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string().nullable(),
  author: AuthorSchema.nullable(),
  files: z.array(GistFileSchema),
});

export const GistListSchema = z.array(GistSchema);

export const RevisionSummarySchema = z.object({
  revision: z.number(),
  title: z.string(),
  fileCount: z.number(),
  createdAt: z.string(),
});

export const RevisionListSchema = z.array(RevisionSummarySchema);

export const RevisionSchema = z.object({
  revision: z.number(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string(),
  files: z.array(
    z.object({
      filename: z.string(),
      language: z.string().nullish(),
      content: z.string().nullish(),
      storage_path: z.string().nullish(),
      byte_size: z.number().nullish(),
    }),
  ),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
