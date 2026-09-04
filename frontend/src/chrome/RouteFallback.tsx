/** The placeholder shown while a lazily loaded route arrives. */

/**
 * A route still downloading.
 *
 * Deliberately quiet: a chunk on a warm connection lands in tens of milliseconds,
 * and a spinner that appears for 40ms is noise. This holds the space so the footer
 * does not jump up and then back down.
 */
export function RouteFallback() {
  return (
    <div className="flex min-h-[60dvh] flex-1 items-center justify-center" aria-busy="true">
      <p className="font-mono text-[10.5px] tracking-[0.13em] text-[var(--faint)] uppercase">
        Loading
      </p>
    </div>
  );
}
