/** The shapes of the application chrome: its bars, bands, tabs and dialogs. */
import type { ReactNode } from 'react';
export type AppErrorBoundaryPropsType = {
  children: ReactNode;
};

export type AppFramePropsType = {
  children: ReactNode;
};

export type EmptyStateActionType = {
  label: string;
  to: string;
  primary?: boolean;
};

export type EmptyStatePropsType = {
  code: string;
  title: string;
  children: ReactNode;
  actions?: EmptyStateActionType[] | undefined;
};

export type FileTabType = {
  id: string;
  label: string;
};

export type FileTabsPropsType = {
  files: FileTabType[];
  activeId: string;
  onActivate: (id: string) => void;
  onRename?: ((id: string, label: string) => void) | undefined;
  onClose?: ((id: string) => void) | undefined;
  onAdd?: (() => void) | undefined;
};

export type TabRenameFieldPropsType = {
  initialValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
};

export type FooterLinkPropsType = {
  link: FooterLinkType;
};

export type KeyboardBadgePropsType = {
  children: string;
  tone?: 'default' | 'onBlue' | undefined;
};

/** The placeholder shown while a list of gists is loading. */
export type ListSkeletonPropsType = {
  rows?: number | undefined;
};

export type MobileNavLinkType = {
  to: string;
  label: string;
};

export type MobileNavPropsType = {
  open: boolean;
  onClose: () => void;
  links: MobileNavLinkType[];
  isAuthenticated: boolean;
  isAuthAvailable: boolean;
  onSignOut: () => void;
};

export type PageHeaderPropsType = {
  eyebrow: string;
  title: string;
  description?: string | undefined;
  aside?: ReactNode;
  children?: ReactNode;
};

export type RouteErrorPropsType = {
  error: Error;
};

/**
 * A slot-based status bar. It takes rendered content, not domain data, so the editor
 * and the gist view can both fill it without either leaking into it.
 */
export type StatusBarPropsType = {
  start?: React.ReactNode;
  center?: React.ReactNode;
  end?: React.ReactNode;
};

export type HotkeyBindingType = {
  combo: string;
  handler: (event: KeyboardEvent) => void;
};

export type FooterLinkType = {
  label: string;
  to: string;
  external?: boolean;
};

export type FooterColumnType = {
  heading: string;
  links: FooterLinkType[];
};
