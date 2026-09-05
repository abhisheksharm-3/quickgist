/** The class strings the chrome reuses.
 *
 * A class string used by one element belongs in its markup; these are the ones two
 * or more elements share, where a copy would be a second place for the design to
 * drift.
 */

export const navLink =
  'text-[13px] text-[var(--dim)] transition-colors hover:text-[var(--heading)]';

export const pill =
  'flex items-center gap-2 border border-[var(--border-strong)] bg-[var(--panel-2)] px-2.5 py-1 text-[12px] text-[var(--dim)] transition-colors hover:border-[var(--dim)] hover:text-[var(--heading)]';

export const primary =
  'bg-[var(--blue-action)] px-3.5 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-[color-mix(in_oklab,var(--blue-action)_88%,black)]';

export const footerLink =
  'text-[13px] leading-[1.55] text-white/90 underline decoration-white/45 underline-offset-[3px] transition-colors hover:text-white hover:decoration-white';

export const columnHeading = 'font-mono text-[10px] tracking-[0.14em] text-white/70 uppercase';

export const row =
  'flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5 text-[14px] text-[var(--text)]';
