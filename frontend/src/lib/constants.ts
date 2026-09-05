/** Values the shared layer treats as fixed.
 *
 * The page size is the feed's, and the diff ceiling is the point past which an
 * O(n·m) comparison stops being worth making.
 */

/** How many gists a page of the feed holds. */
export const FEED_PAGE_SIZE = 20;

export const MAX_DIFF_LINES = 2000;
