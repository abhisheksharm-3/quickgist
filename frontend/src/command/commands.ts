/** The command palette's command shape, and the commands available everywhere. */
import type { NavigateFunction } from 'react-router';

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

export const KEYBOARD_MAP: KeyboardMapEntryType[] = [
  { keys: '⌘K', action: 'Command palette', where: 'everywhere' },
  { keys: '⌘C', action: 'Copy the link', where: 'gist, while the band is up' },
  { keys: 'N', action: 'New gist', where: 'gist, explore' },
  { keys: 'E', action: 'Edit', where: 'gist, if you are the author' },
  { keys: '1–9', action: 'Switch to file n', where: 'gist' },
  { keys: '/', action: 'Focus search', where: 'explore' },
  { keys: '?', action: 'Shortcut list', where: 'everywhere' },
];

/** Commands reachable from any route: going elsewhere in the app. */
export function buildUniversalCommands(navigate: NavigateFunction): CommandType[] {
  return [
    { id: 'go-new', label: 'New gist', shortcut: 'N', perform: () => navigate('/') },
    { id: 'go-explore', label: 'Explore public gists', perform: () => navigate('/explore') },
    { id: 'go-me', label: 'My gists', perform: () => navigate('/me') },
  ];
}
