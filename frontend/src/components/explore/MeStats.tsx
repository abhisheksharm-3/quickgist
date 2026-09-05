/** A summary band above your gist list. */

import { buildGistStats } from '@/logic/gist-stats';
import type { MeStatsPropsType } from '@/types/explore';

/**
 * Counts across your gists.
 *
 * Derived from the list already fetched rather than a second request, because these
 * are sums of rows the page is holding anyway. A dedicated stats endpoint would be a
 * round trip to compute what addition can.
 *
 * The band spans the window and is divided by hairlines, so it reads as part of the
 * page's structure rather than a row of five cards parked on top of it.
 */
export function MeStats({ gists }: MeStatsPropsType) {
  if (gists.length === 0) {
    return null;
  }

  const stats = buildGistStats(gists);

  return (
    <dl className="grid grid-cols-2 border-b border-[var(--border)] sm:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border-r border-b border-[var(--border)] px-5 py-4 last:border-r-0 sm:border-b-0 sm:px-6"
        >
          <dt className="font-mono text-[9.5px] tracking-[0.13em] text-[var(--faint)] uppercase">
            {stat.label}
          </dt>
          <dd className="mt-2 text-[22px] leading-none font-semibold tracking-[-0.03em] text-[var(--heading)]">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
