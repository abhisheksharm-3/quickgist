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

/** What the publish controls collect, as the publish action reads them. */
export type PublishSettingsType = {
  visibility: VisibilityType;
  expiryDays: string;
};

export type AttachmentQueuePropsType = {
  queued: File[];
  notice: string | null;
  onRemove: (name: string) => void;
};

export type CodeEditorPropsType = {
  value: string;
  onChange: (value: string) => void;
  filename: string;
  language: string | null;
  ariaLabel: string;
};

export type SubmitButtonPropsType = {
  label: string;
  pendingLabel: string;
};

export type PreviewPanePropsType = {
  file: DraftFileType;
};

export type PreviewIndicatorPropsType = {
  status: PreviewStatusType;
  isStale: boolean;
  countdown: number | null;
};

export type PublishControlsPropsType = {
  visibility: VisibilityType;
  onVisibilityChange: (visibility: VisibilityType) => void;
  expiryDays: string;
  onExpiryDaysChange: (days: string) => void;
  disabled?: boolean | undefined;
};

export type SourcePanePropsType = {
  value: string;
  onChange: (value: string) => void;
  filename: string;
  language: string | null;
  ariaLabel: string;
};

export type SourceFallbackPropsType = {
  value: string;
};

export type AttachmentType =
  | { kind: 'text'; filename: string; content: string }
  | { kind: 'binary'; filename: string; file: File }
  | { kind: 'rejected'; filename: string; reason: string };

export type AttachmentsType = {
  queued: File[];
  notice: string | null;
  accept: (chosen: FileList | File[] | null) => Promise<void>;
  remove: (name: string) => void;
  uploadQueued: (slug: string) => Promise<void>;
  clear: () => void;
};

export type PreviewRequestType = {
  filename: string;
  language: string | null;
  content: string;
};

export type PublishResultType = { status: 'idle' } | { status: 'error'; message: string };

export type PublishInputType = {
  slug: string | undefined;
  draft: EditorDraftType;
  settings: PublishSettingsType;
  attachments: AttachmentsType;
  persistenceKey: string;
};
