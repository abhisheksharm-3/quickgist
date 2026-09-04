/** The file tabs: a real `tablist` that also renames and closes, like an editor's. */

import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export type FileTabType = {
  id: string;
  label: string;
};

type FileTabsPropsType = {
  files: FileTabType[];
  activeId: string;
  onActivate: (id: string) => void;
  onRename?: ((id: string, label: string) => void) | undefined;
  onClose?: ((id: string) => void) | undefined;
  onAdd?: (() => void) | undefined;
};

/**
 * The tab strip.
 *
 * Renaming and closing happen here rather than in a separate row of controls, which
 * is how an editor and a browser both behave: double-click the tab to rename it,
 * press the close button or middle-click to remove it. That removes a row of chrome
 * and puts each action on the thing it acts on.
 *
 * Arrow keys move between tabs and F2 starts a rename, so none of it needs a mouse.
 */
export function FileTabs({
  files,
  activeId,
  onActivate,
  onRename,
  onClose,
  onAdd,
}: FileTabsPropsType) {
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const canClose = files.length > 1 && onClose !== undefined;

  const moveFocus = (event: React.KeyboardEvent, nextIndex: number): void => {
    event.preventDefault();
    const next = files[(nextIndex + files.length) % files.length];
    if (next) {
      onActivate(next.id);
      document.getElementById(tabId(next.id))?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number, file: FileTabType): void => {
    switch (event.key) {
      case 'ArrowRight':
        moveFocus(event, index + 1);
        break;
      case 'ArrowLeft':
        moveFocus(event, index - 1);
        break;
      case 'Home':
        moveFocus(event, 0);
        break;
      case 'End':
        moveFocus(event, files.length - 1);
        break;
      case 'F2':
        if (onRename) {
          event.preventDefault();
          setRenamingId(file.id);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div role="tablist" aria-label="Files" className="flex min-w-0 items-stretch overflow-x-auto">
      {files.map((file, index) => {
        const isActive = file.id === activeId;

        if (renamingId === file.id && onRename) {
          return (
            <TabRenameField
              key={file.id}
              initialValue={file.label}
              onCommit={(label) => {
                onRename(file.id, label);
                setRenamingId(null);
                document.getElementById(tabId(file.id))?.focus();
              }}
              onCancel={() => {
                setRenamingId(null);
                document.getElementById(tabId(file.id))?.focus();
              }}
            />
          );
        }

        return (
          <div
            key={file.id}
            className={cn(
              'group relative flex shrink-0 items-center gap-1.5 border-r border-[var(--border)] pr-1.5 pl-3',
              isActive ? 'bg-[var(--panel-2)]' : 'hover:bg-[var(--panel)]',
            )}
          >
            <button
              id={tabId(file.id)}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId(file.id)}
              tabIndex={isActive ? 0 : -1}
              title={onRename ? `${file.label} — double-click to rename` : file.label}
              onClick={() => onActivate(file.id)}
              onDoubleClick={() => onRename && setRenamingId(file.id)}
              onAuxClick={(event) => {
                if (event.button === 1 && canClose && onClose) {
                  event.preventDefault();
                  onClose(file.id);
                }
              }}
              onKeyDown={(event) => handleKeyDown(event, index, file)}
              className={cn(
                'py-2 font-mono text-[11.5px] whitespace-nowrap',
                isActive ? 'text-[var(--heading)]' : 'text-[var(--dim)]',
              )}
            >
              {file.label}
            </button>

            {canClose && onClose ? (
              <button
                type="button"
                aria-label={`Close ${file.label}`}
                onClick={() => onClose(file.id)}
                className={cn(
                  'grid size-4 flex-none place-items-center text-[var(--faint)] transition-opacity hover:text-[var(--heading)]',
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
              >
                <X className="size-3" aria-hidden />
              </button>
            ) : (
              <span aria-hidden className="size-4 flex-none" />
            )}

            {isActive ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[var(--blue-action)]"
              />
            ) : null}
          </div>
        );
      })}

      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          title="Add file"
          aria-label="Add file"
          className="flex-none border-r border-[var(--border)] px-3 text-[13px] text-[var(--faint)] hover:bg-[var(--panel)] hover:text-[var(--heading)]"
        >
          +
        </button>
      ) : null}
    </div>
  );
}

type TabRenameFieldPropsType = {
  initialValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
};

/**
 * The inline rename field.
 *
 * It selects the name without its extension on open, because renaming a file almost
 * always means changing the name and keeping the type.
 */
function TabRenameField({ initialValue, onCommit, onCancel }: TabRenameFieldPropsType) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    input.focus();

    const dot = initialValue.lastIndexOf('.');
    input.setSelectionRange(0, dot > 0 ? dot : initialValue.length);
  }, [initialValue]);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onCommit(value);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
        }
      }}
      aria-label="Rename file"
      className="w-40 shrink-0 border-r border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 font-mono text-[11.5px] text-[var(--heading)] outline-none ring-1 ring-inset ring-[var(--blue-action)]"
    />
  );
}

export function tabId(id: string): string {
  return `tab-${id}`;
}

export function panelId(id: string): string {
  return `panel-${id}`;
}
