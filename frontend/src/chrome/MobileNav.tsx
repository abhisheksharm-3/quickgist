/** The navigation sheet that rises from the bottom on a narrow screen. */
import { ChevronRight, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import type { ThemeType } from '@/theme/types';
import { useTheme } from '@/theme/use-theme';

export type MobileNavLinkType = {
  to: string;
  label: string;
};

type MobileNavPropsType = {
  open: boolean;
  onClose: () => void;
  links: MobileNavLinkType[];
  isAuthenticated: boolean;
  isAuthAvailable: boolean;
  onSignOut: () => void;
};

const NEXT_THEME: Record<ThemeType, ThemeType> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const THEME_ACTION: Record<ThemeType, string> = {
  system: 'Use the light theme',
  light: 'Use the dark theme',
  dark: 'Follow the system theme',
};

const THEME_ICON: Record<ThemeType, typeof Monitor> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const row =
  'flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5 text-[14px] text-[var(--text)]';

/**
 * The mobile navigation sheet.
 *
 * A native `dialog` opened with `showModal`, so the focus trap, the backdrop, the
 * Escape key and returning focus to the button all come from the platform rather
 * than being re-derived. The entry and exit are CSS: `@starting-style` gives the
 * sheet somewhere to animate from, and `allow-discrete` keeps it on screen long
 * enough to animate out.
 *
 * The area above the sheet is a labelled button rather than a click handler on the
 * dialog itself, so dismissing by tapping outside is a real control with a name a
 * screen reader can read, not a mouse-only affordance.
 */
export function MobileNav({
  open,
  onClose,
  links,
  isAuthenticated,
  isAuthAvailable,
  onSignOut,
}: MobileNavPropsType) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const ThemeIcon = THEME_ICON[theme];

  return (
    <dialog ref={dialogRef} aria-label="Navigation" onClose={onClose} className="mobile-sheet">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="mobile-sheet-dismiss"
      />

      <div className="mobile-sheet-panel border-t border-[var(--border-strong)] bg-[var(--panel)] text-[var(--text)]">
        <nav>
          {links.map((link) => (
            <Link key={link.to} to={link.to} onClick={onClose} className={row}>
              {link.label}
              <ChevronRight className="size-4 flex-none text-[var(--faint)]" aria-hidden />
            </Link>
          ))}

          {isAuthAvailable && !isAuthenticated ? (
            <Link to="/sign-in" onClick={onClose} className={row}>
              Sign in
              <ChevronRight className="size-4 flex-none text-[var(--faint)]" aria-hidden />
            </Link>
          ) : null}
        </nav>

        <div className="px-5 py-4">
          <button
            type="button"
            onClick={() => setTheme(NEXT_THEME[theme])}
            className="flex w-full items-center justify-center gap-2 border border-[var(--border-strong)] bg-[var(--panel-2)] px-4 py-2.5 text-[13px] text-[var(--text)]"
          >
            <ThemeIcon className="size-3.5" aria-hidden />
            {THEME_ACTION[theme]}
          </button>

          {isAuthAvailable && isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="mt-2 w-full px-4 py-2.5 text-[13px] text-[var(--dim)]"
            >
              Sign out
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="mt-1 w-full px-4 py-2.5 text-[13px] text-[var(--dim)]"
          >
            Close menu
          </button>
        </div>
      </div>
    </dialog>
  );
}
