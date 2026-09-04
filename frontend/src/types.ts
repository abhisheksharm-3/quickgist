/** Domain and API types, inferred from the schemas that validate them. */
import type { z } from 'zod';
import type {
  ApiErrorSchema,
  AuthorSchema,
  FileKindSchema,
  GistFileSchema,
  GistSchema,
  RevisionSchema,
  RevisionSummarySchema,
  VisibilitySchema,
} from '@/schemas';

export type VisibilityType = z.infer<typeof VisibilitySchema>;
export type FileKindType = z.infer<typeof FileKindSchema>;
export type AuthorType = z.infer<typeof AuthorSchema>;
export type GistFileType = z.infer<typeof GistFileSchema>;
export type GistType = z.infer<typeof GistSchema>;
export type ApiErrorType = z.infer<typeof ApiErrorSchema>;
export type RevisionSummaryType = z.infer<typeof RevisionSummarySchema>;
export type RevisionType = z.infer<typeof RevisionSchema>;

/** A text file as the create and replace endpoints accept it. */
export type FileInputType = {
  filename: string;
  language?: string | null;
  content: string;
};

export type CreateGistInputType = {
  title: string;
  description?: string;
  visibility?: VisibilityType;
  expiresAt?: string | null;
  files: FileInputType[];
};

export type UpdateGistInputType = {
  title?: string;
  description?: string;
  visibility?: VisibilityType;
  expiresAt?: string | null;
};

export type UploadFileInputType = {
  slug: string;
  file: File;
  retentionDays?: number;
};

export type ListGistsQueryType = {
  author?: string;
  limit?: number;
  before?: string;
  beforeSlug?: string;
};

/**
 * A page boundary in the feed.
 *
 * Both halves are sent together: created_at alone is not unique, and a cursor
 * without the slug beside it drops every gist created in the same instant as the
 * last row of the page before.
 */
export type FeedCursorType = {
  before: string;
  beforeSlug: string;
};

export type SignUpProfileType = {
  handle: string;
  displayName: string;
};

export type SessionUserType = {
  id: string;
  email: string | null;
};

export type SessionStateType = {
  user: SessionUserType | null;
  isLoading: boolean;
  signInWithOAuth: (provider: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (
    email: string,
    password: string,
    profile: SignUpProfileType,
  ) => Promise<void>;
  signOut: () => Promise<void>;
};
