/** The command palette's command shape, and the commands available everywhere. */
import type { NavigateFunction } from 'react-router';
import type { CommandType } from '@/command/types';

/** Commands reachable from any route: going elsewhere in the app. */
export function buildUniversalCommands(navigate: NavigateFunction): CommandType[] {
  return [
    { id: 'go-new', label: 'New gist', shortcut: 'N', perform: () => navigate('/') },
    { id: 'go-explore', label: 'Explore public gists', perform: () => navigate('/explore') },
    { id: 'go-me', label: 'My gists', perform: () => navigate('/me') },
  ];
}
