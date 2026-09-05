/**
 * A loading list.
 *
 * It mirrors the shape of a real row, so the page does not shift when the data
 * lands. A centred spinner would tell a reader less and move everything twice.
 */
import type { ListSkeletonPropsType } from '@/chrome/types';
export function ListSkeleton({ rows = 5 }: ListSkeletonPropsType) {
  return (
    <ul
      className="animate-pulse divide-y divide-[var(--border)] border-b border-[var(--border)]"
      aria-hidden="true"
    >
      {Array.from({ length: rows }, (_, index) => index).map((row) => (
        <li key={row} className="px-5 py-4 sm:px-8">
          <div className="h-3.5 w-2/5 bg-[var(--panel-2)]" />
          <div className="mt-2.5 h-3 w-1/4 bg-[var(--panel-2)]" />
        </li>
      ))}
    </ul>
  );
}
