/** Dates as a reader sees them, formatted once for the whole app. */

const DAY_MONTH = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' });

const DATE_TIME = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * A short date for a list row, in the reader's own locale.
 *
 * The formatters are built once at module scope because constructing an
 * Intl.DateTimeFormat is the expensive part, and a feed builds one per row.
 */
export function formatDayMonth(iso: string): string {
  return DAY_MONTH.format(new Date(iso));
}

/** A date and time, for a revision or anything else with a moment worth naming. */
export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}
