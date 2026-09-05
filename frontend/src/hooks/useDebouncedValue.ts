/** A value that lags behind its input, for anything that fires a request. */
import { useEffect, useState } from 'react';

/**
 * Returns `value` after it has stopped changing for `delayMs`.
 *
 * Search fires a request per distinct value, and a query per keystroke means eight
 * requests to type "diagram", seven of whose answers are thrown away and any of
 * which can arrive last and win. Debouncing the value rather than the request keeps
 * the query key stable, so React Query's own cache and cancellation still apply.
 */
export function useDebouncedValue<ValueType>(value: ValueType, delayMs: number): ValueType {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
