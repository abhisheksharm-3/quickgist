/** The keyboard map, as the shortcut sheet lists it. */
import type { KeyboardMapEntryType } from '@/command/types';

export const KEYBOARD_MAP: KeyboardMapEntryType[] = [
  { keys: '⌘K', action: 'Command palette', where: 'everywhere' },
  { keys: '⌘C', action: 'Copy the link', where: 'gist, while the band is up' },
  { keys: 'N', action: 'New gist', where: 'gist, explore' },
  { keys: 'E', action: 'Edit', where: 'gist, if you are the author' },
  { keys: '1–9', action: 'Switch to file n', where: 'gist' },
  { keys: '/', action: 'Focus search', where: 'explore' },
  { keys: '?', action: 'Shortcut list', where: 'everywhere' },
];
