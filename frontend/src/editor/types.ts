/** Types for the multi-file draft and the preview it feeds. */
import { z } from 'zod';
import { FileKindSchema } from '@/schemas';
import type { VisibilityType } from '@/types';

export type DraftFileType = {
  id: string;
  filename: string;
  language: string | null;
  content: string;
};

export type EditorDraftType = {
  title: string;
  files: DraftFileType[];
  activeIndex: number;
};

export type AttachedTextType = {
  filename: string;
  content: string;
};

export type EditorActionType =
  | { type: 'add' }
  | { type: 'attach'; files: AttachedTextType[] }
  | { type: 'title'; title: string }
  | { type: 'rename'; index: number; filename: string }
  | { type: 'edit'; index: number; content: string }
  | { type: 'remove'; index: number }
  | { type: 'switch'; index: number }
  | { type: 'replace'; draft: EditorDraftType };

export const PreviewResponseSchema = z.object({
  kind: FileKindSchema,
  html: z.string(),
});

export type PreviewResponseType = z.infer<typeof PreviewResponseSchema>;

export type PreviewStatusType = 'idle' | 'pending' | 'success' | 'error';

export type UsePreviewResultType = {
  html: string | null;
  status: PreviewStatusType;
  isStale: boolean;
  retryAfterSeconds: number | null;
};

export type PublishSettingsType = {
  visibility: VisibilityType;
  expiresAt: string | null;
};
