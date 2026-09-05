/** Cycles the theme between following the system, light, and dark. */
import { ICON, LABEL, ORDER } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * A single button that cycles the three theme states.
 *
 * One control rather than a menu, because there are three options and the current
 * one is legible from its icon. Following the system is in the cycle since it is a
 * real choice, not the absence of one.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleClick = (): void => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    if (next) {
      setTheme(next);
    }
  };

  const Icon = ICON[theme];

  return (
    <button
      type="button"
      onClick={handleClick}
      title={LABEL[theme]}
      aria-label={LABEL[theme]}
      className="grid size-[28px] place-items-center border border-[var(--border-strong)] bg-[var(--panel-2)] text-[var(--dim)] transition-colors hover:border-[var(--dim)] hover:text-[var(--heading)]"
    >
      <Icon className="size-[13px]" aria-hidden />
    </button>
  );
}
