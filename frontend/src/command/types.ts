/** The shapes of the command palette and the keyboard map behind it. */

export type CommandPalettePropsType = {
  commands?: CommandType[];
  onNew?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  onFocusSearch?: (() => void) | undefined;
  onSwitchFile?: ((index: number) => void) | undefined;
};

export type ShortcutSheetPropsType = {
  isOpen: boolean;
  onClose: () => void;
};

export type CommandType = {
  id: string;
  label: string;
  shortcut?: string;
  perform: () => void;
};

/** One row of the `?` shortcut sheet. */
export type KeyboardMapEntryType = {
  keys: string;
  action: string;
  where: string;
};

export type GlobalShortcutHandlersType = {
  onOpenPalette: () => void;
  onOpenShortcuts: () => void;
  onNew?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  onFocusSearch?: (() => void) | undefined;
  onSwitchFile?: ((index: number) => void) | undefined;
};
