/** The first screen of the landing page. */
import { Link } from 'react-router';

const SPECS: { label: string; value: string }[] = [
  { label: 'Rendered', value: 'on the server' },
  { label: 'Account', value: 'not required' },
  { label: 'Files per gist', value: 'up to 20' },
  { label: 'Uploads kept', value: '30 days, capped' },
];

/**
 * The hero.
 *
 * Two cells divided by a hairline: the claim on the left, the specification on the
 * right. The specification is there because this is a developer tool and the numbers
 * are the argument, and because a headline alone leaves two thirds of a wide screen
 * carrying nothing.
 *
 * The plate sits at the bottom of its cell as compact rows. Stretched to the hero's
 * full height instead, its four labels floated in four tall bands of nothing and
 * read as a layout accident rather than a table.
 *
 * The type is set in the serif italic used by the editor's own hero line and nowhere
 * else, so the two places that speak to a first-time visitor sound the same.
 */
export function LandingHero() {
  return (
    <section className="border-b border-[var(--border)] lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="px-5 pt-16 pb-14 sm:px-10 sm:pt-24 sm:pb-20">
        <p className="font-mono text-[10px] tracking-[0.16em] text-[var(--faint)] uppercase">
          Markdown and code, as a link
        </p>

        <h1 className="mt-6 max-w-[24ch] font-serif text-[clamp(2.4rem,6vw,4.4rem)] leading-[0.98] font-light italic tracking-[-0.03em] text-[var(--heading)]">
          Paste it. Send it.
        </h1>

        <p className="mt-7 max-w-[52ch] text-[14.5px] leading-[1.7] text-[var(--body)]">
          quickgist turns a paste into a link. Whoever opens it reads a properly rendered document
          instead of a wall of unformatted text: Markdown with tables and diagrams, code with real
          highlighting, and nothing to install on either end.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="bg-[var(--blue-action)] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[color-mix(in_oklab,var(--blue-action)_88%,black)]"
          >
            Start a gist
          </Link>
          <Link
            to="/explore"
            className="border border-[var(--border-strong)] bg-[var(--panel-2)] px-4 py-2 text-[13px] text-[var(--dim)] transition-colors hover:border-[var(--dim)] hover:text-[var(--heading)]"
          >
            See what people share
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-end border-t border-[var(--border)] lg:border-t-0 lg:border-l">
        <dl className="divide-y divide-[var(--border)] border-t border-[var(--border)] lg:mb-8">
          {SPECS.map((spec) => (
            <div
              key={spec.label}
              className="flex items-baseline justify-between gap-6 px-5 py-3 sm:px-8"
            >
              <dt className="font-mono text-[9.5px] tracking-[0.14em] text-[var(--faint)] uppercase">
                {spec.label}
              </dt>
              <dd className="text-right text-[13px] tracking-[-0.01em] text-[var(--heading)]">
                {spec.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
