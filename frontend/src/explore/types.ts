/** The shapes of the feed, the author page and your own gist list. */
import type { ReactNode } from 'react';
import type { GistType } from '@/types';
export type GistListPropsType = {
  gists: GistType[];
  empty: ReactNode;
};

export type GistSummaryPropsType = {
  gist: GistType;
};

export type LoadMorePropsType = {
  hasMore: boolean;
  isLoading: boolean;
  onLoad: () => void;
};

export type OwnGistsPropsType = {
  handle: string;
};

export type MeStatsPropsType = {
  gists: GistType[];
};

export type StatType = {
  label: string;
  value: string;
};

export type SearchFieldPropsType = {
  value: string;
  onChange: (value: string) => void;
  ref?: React.Ref<HTMLInputElement>;
};
