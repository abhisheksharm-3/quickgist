/** The shapes of the history page and the diff it renders. */
import type { DiffLineType } from '@/lib/types';
import type { GistType, RevisionType } from '@/types';
export type DiffTablePropsType = {
  lines: DiffLineType[];
};

export type FileDiffPropsType = {
  filename: string;
  stored: RevisionType;
  gist: GistType | undefined;
};

export type RevisionDiffPropsType = {
  slug: string;
  revision: number;
  gist: GistType | undefined;
  canRestore: boolean;
};
