/** A `kbd` badge, so a binding sits next to the action it triggers. */
import { cn } from '@/lib/cn';

type KeyboardBadgePropsType = {
  children: string;
  tone?: 'default' | 'onBlue' | undefined;
};

/**
 * A keyboard hint.
 *
 * `onBlue` is for a badge sitting inside the primary button, where the surrounding
 * blue means the default border and text would both disappear.
 */
export function KeyboardBadge({ children, tone = 'default' }: KeyboardBadgePropsType) {
  return (
    <kbd
      className={cn(
        'inline-grid min-w-[1.25rem] place-items-center border px-1 py-px font-mono text-[9.5px] leading-none',
        tone === 'onBlue'
          ? 'border-white/35 bg-white/15 text-white/90'
          : 'border-[var(--border-strong)] bg-[var(--panel-2)] text-[var(--faint)]',
      )}
    >
      {children}
    </kbd>
  );
}
