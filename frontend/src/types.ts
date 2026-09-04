/** Domain and API types, inferred from the schemas that validate them. */
import type { z } from 'zod';
import type {
  ApiErrorSchema,
  AuthorSchema,
  FileKindSchema,
  GistFileSchema,
  GistSchema,
  VisibilitySchema,
} from '@/schemas';

export type VisibilityType = z.infer<typeof VisibilitySchema>;
export type FileKindType = z.infer<typeof FileKindSchema>;
export type AuthorType = z.infer<typeof AuthorSchema>;
export type GistFileType = z.infer<typeof GistFileSchema>;
export type GistType = z.infer<typeof GistSchema>;
export type ApiErrorType = z.infer<typeof ApiErrorSchema>;

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
