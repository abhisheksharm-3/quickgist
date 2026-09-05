/** A status-bar select, built on Radix so the popup can be styled at all. */
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import type { SelectFieldPropsType } from '@/types/ui';

/**
 * A labelled select.
 *
 * Radix rather than a native `select` because a native popup is rendered by the
 * operating system and cannot carry this design at all. Radix rather than a
 * hand-rolled listbox because it brings typeahead, arrow-key navigation, and the
 * correct ARIA wiring, none of which is worth re-deriving.
 *
 * The highlighted item repeats the active file tab's treatment, a `--panel-2` ground
 * with a blue left rule, so selection reads the same everywhere in the app.
 */
export function SelectField({
  label,
  value,
  options,
  onValueChange,
  id,
  disabled = false,
}: SelectFieldPropsType) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="text-[9.5px] uppercase tracking-[0.09em] text-[var(--faint)]"
        id={id ? `${id}-label` : undefined}
      >
        {label}
      </span>

      <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <Select.Trigger
          id={id}
          aria-labelledby={id ? `${id}-label` : undefined}
          className="flex items-center gap-1.5 border border-[var(--border-strong)] bg-[var(--panel-2)] px-2 py-0.5 text-[10.5px] text-[var(--text)] outline-none focus-visible:border-[var(--blue-action)] disabled:opacity-50"
        >
          <Select.Value />
          <Select.Icon>
            <ChevronDown className="size-3 text-[var(--faint)]" aria-hidden />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={4}
            className="z-50 min-w-[8rem] overflow-hidden border border-[var(--border-strong)] bg-[var(--panel)] data-[state=open]:animate-none"
          >
            <Select.Viewport className="p-0.5">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="flex cursor-default items-center gap-2 border-l-2 border-transparent px-2 py-1 text-[10.5px] text-[var(--body)] outline-none data-[highlighted]:border-l-[var(--blue-action)] data-[highlighted]:bg-[var(--panel-2)] data-[highlighted]:text-[var(--heading)]"
                >
                  <Select.ItemIndicator>
                    <Check className="size-3 text-[var(--blue-action)]" aria-hidden />
                  </Select.ItemIndicator>
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </span>
  );
}
