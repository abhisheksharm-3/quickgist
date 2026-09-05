/**
 * The bar pinned to the bottom of a tool.
 *
 * On a narrow screen its groups stack instead of overlapping, which they did when
 * three groups shared one row at 390 pixels.
 */
import type { StatusBarPropsType } from '@/chrome/types';
export function StatusBar({ start, center, end }: StatusBarPropsType) {
  return (
    <div className="flex flex-none flex-col gap-2 border-t border-[var(--border)] px-4 py-2 text-[var(--dim)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-1.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">{start}</div>
      {center ? <div className="flex items-center gap-3">{center}</div> : null}
      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">{end}</div>
    </div>
  );
}
