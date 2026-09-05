/** The control that fetches the next page of a list. */

/**
 * A load-more button.
 *
 * A button rather than a scroll listener: infinite scroll takes the footer away
 * from anyone who wants it, and it makes the browser's back button land somewhere
 * nobody chose. When there is nothing more, the row says so instead of disappearing,
 * because a list that simply stops leaves you wondering whether it is still loading.
 */
import type { LoadMorePropsType } from '@/types/explore';
export function LoadMore({ hasMore, isLoading, onLoad }: LoadMorePropsType) {
  if (!hasMore) {
    return (
      <p className="px-5 py-6 font-mono text-[10.5px] tracking-[0.11em] text-[var(--faint)] uppercase sm:px-8">
        End of the list
      </p>
    );
  }

  return (
    <div className="px-5 py-6 sm:px-8">
      <button
        type="button"
        onClick={onLoad}
        disabled={isLoading}
        className="border border-[var(--border-strong)] bg-[var(--panel-2)] px-3.5 py-1.5 text-[12.5px] text-[var(--dim)] transition-colors hover:border-[var(--dim)] hover:text-[var(--heading)] disabled:opacity-50"
      >
        {isLoading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  );
}
