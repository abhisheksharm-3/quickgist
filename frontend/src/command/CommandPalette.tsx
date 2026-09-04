/**
 * The ⌘K palette and the `?` shortcut sheet, wired to the keyboard map together so
 * a page only has to render one component to get both.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { CommandType } from '@/command/commands';
import { buildUniversalCommands } from '@/command/commands';
import { ShortcutSheet } from '@/command/ShortcutSheet';
import { useGlobalShortcuts } from '@/command/use-global-shortcuts';
import { cn } from '@/lib/cn';

type CommandPalettePropsType = {
  commands?: CommandType[];
  onNew?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  onFocusSearch?: (() => void) | undefined;
  onSwitchFile?: ((index: number) => void) | undefined;
};

export function CommandPalette({
  commands = [],
  onNew,
  onEdit,
  onFocusSearch,
  onSwitchFile,
}: CommandPalettePropsType) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isShortcutsOpen, setShortcutsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const allCommands = useMemo(
    () => [...commands, ...buildUniversalCommands(navigate)],
    [commands, navigate],
  );
  const matches = useMemo(() => filterCommands(allCommands, query), [allCommands, query]);

  useGlobalShortcuts({
    onOpenPalette: () => {
      setQuery('');
      setActiveIndex(0);
      setPaletteOpen(true);
    },
    onOpenShortcuts: () => setShortcutsOpen(true),
    onNew,
    onEdit,
    onFocusSearch,
    onSwitchFile,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (isPaletteOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isPaletteOpen && dialog.open) {
      dialog.close();
    }
  }, [isPaletteOpen]);

  const closePalette = (): void => setPaletteOpen(false);

  const runActive = (): void => {
    const command = matches[activeIndex];
    if (!command) {
      return;
    }
    closePalette();
    command.perform();
  };

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      runActive();
    }
  };

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-label="Command palette"
        onClose={closePalette}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            closePalette();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            closePalette();
          }
        }}
        className="w-full max-w-lg border border-[var(--border-strong)] bg-[var(--panel)] p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <input
          ref={(input) => input?.focus()}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="command-palette-list"
          aria-autocomplete="list"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a command…"
          className="w-full border-b border-[var(--border)] bg-transparent px-4 py-3 text-sm text-[var(--text)] outline-none"
        />
        <div id="command-palette-list" role="listbox" className="max-h-72 overflow-y-auto p-1">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[var(--dim)]">No matching commands.</p>
          ) : (
            matches.map((command, index) => (
              <button
                key={command.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  closePalette();
                  command.perform();
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm',
                  index === activeIndex
                    ? 'bg-[var(--panel-2)] text-[var(--heading)]'
                    : 'text-[var(--text)]',
                )}
              >
                <span>{command.label}</span>
                {command.shortcut ? (
                  <kbd className="font-mono text-xs text-[var(--faint)]">{command.shortcut}</kbd>
                ) : null}
              </button>
            ))
          )}
        </div>
      </dialog>

      <ShortcutSheet isOpen={isShortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}

function filterCommands(commands: CommandType[], query: string): CommandType[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return commands;
  }
  return commands.filter((command) => command.label.toLowerCase().includes(normalized));
}
