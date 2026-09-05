/** Matching typed text against the commands on offer. */
import type { CommandType } from '@/types/command';

export function filterCommands(commands: CommandType[], query: string): CommandType[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return commands;
  }
  return commands.filter((command) => command.label.toLowerCase().includes(normalized));
}
