/** The shapes of the gist page: its header, its panes and its dialogs. */
import type { GistFileType, GistType } from '@/types/index';
export type BinaryFilePropsType = {
  file: GistFileType;
};

export type DeleteGistDialogPropsType = {
  title: string;
  fileCount: number;
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export type HeadingType = {
  id: string;
  text: string;
  level: number;
};

export type GistMetaPropsType = {
  gist: GistType;
  rawUrl: string | undefined;
  editUrl: string | undefined;
  revisionCount: number;
  onDelete: (() => void) | undefined;
};

export type LocationStateType = {
  justCreated?: boolean;
};

export type LinkBandPropsType = {
  url: string;
  onDismiss: () => void;
};

export type RenderedFilePropsType = {
  file: GistFileType;
};
