/** The three things worth knowing, as a band of cells. */

type FeatureType = {
  index: string;
  title: string;
  detail: string;
};

const FEATURES: FeatureType[] = [
  {
    index: '01',
    title: 'Rendered before it reaches you',
    detail:
      'goldmark and chroma run on the server and the HTML is cached in Postgres, so the page arrives finished. Your browser downloads no highlighter, and the preview you wrote against is the page your reader opens.',
  },
  {
    index: '02',
    title: 'One link, three visibilities',
    detail:
      'A gist is unlisted by default: anyone with the link can read it, and nothing lists it. Public puts it in the feed and in search. Private is yours alone, and everyone else gets the same 404 as a link that never existed.',
  },
  {
    index: '03',
    title: 'A gist is a set of files',
    detail:
      'Up to twenty of them, each a tab, each rendered by its own extension. Drop files in from disk; anything that is not text is uploaded and kept for at most 30 days, which the database enforces rather than the interface suggesting it.',
  },
];

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
