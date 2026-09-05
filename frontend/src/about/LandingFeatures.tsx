/** The three things worth knowing, as a band of cells. */

import { FEATURES } from '@/about/content';

/**
 * The feature band.
 *
 * Three cells, numbered, divided by hairlines. Numbering them is what makes the row
 * read as a specification rather than three cards that happened to line up, and it
 * is the same mono voice the rest of the product labels things in.
 */
export function LandingFeatures() {
  return (
    <section className="grid border-b border-[var(--border)] md:grid-cols-3">
      {FEATURES.map((feature) => (
        <div
          key={feature.index}
          className="border-b border-[var(--border)] px-5 py-9 last:border-b-0 sm:px-8 md:border-r md:border-b-0 md:last:border-r-0"
        >
          <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--faint)]">
            {feature.index}
          </p>
          <h3 className="mt-4 max-w-[24ch] text-[15.5px] leading-[1.35] font-semibold tracking-[-0.015em] text-[var(--heading)]">
            {feature.title}
          </h3>
          <p className="mt-3 max-w-[46ch] text-[12.5px] leading-[1.7] text-[var(--dim)]">
            {feature.detail}
          </p>
        </div>
      ))}
    </section>
  );
}
