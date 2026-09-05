/** The landing page: what quickgist is, what it renders, and what it is made of. */

import { INSET, MEASURE } from '@/about/constants';
import { SHORTCUTS, STACK } from '@/about/content';
import { LandingDemo } from '@/about/LandingDemo';
import { LandingFeatures } from '@/about/LandingFeatures';
import { LandingHero } from '@/about/LandingHero';

/**
 * The landing page.
 *
 * It opens as a landing page and ends as documentation, in that order: the claim,
 * then proof of the claim as a rendered document, then the three facts that decide
 * whether this is the right tool, then the stack and the keyboard map for whoever
 * scrolled that far. The editor is one click away at every point.
 *
 * Full bleed, like the rest of the app: every rule and divider reaches both edges of
 * the viewport and the content is inset from them, rather than a column floating in
 * the middle of an empty page. Prose still keeps a measure, because a line of text
 * 200 characters wide is unreadable however wide the window is.
 *
 * It renders its own document metadata, so sharing this URL previews as something
 * rather than a blank card.
 */
export function AboutRoute() {
  return (
    <>
      <title>quickgist · Markdown and code, as a link</title>
      <meta
        name="description"
        content="quickgist shares Markdown and code as a link, rendered on the server. Built with Go, Supabase Postgres, goldmark and chroma."
      />
      <meta property="og:title" content="About quickgist" />
      <meta
        property="og:description"
        content="Markdown and code, rendered on the server, in one link."
      />

      <article className="min-h-0 flex-1">
        <LandingHero />
        <LandingDemo />
        <LandingFeatures />

        <h2
          id="stack"
          className={`scroll-mt-20 ${INSET} pt-14 pb-5 text-[19px] font-semibold tracking-[-0.02em] text-[var(--heading)]`}
        >
          The stack
        </h2>
        <dl className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {STACK.map((row) => (
            <div
              key={row.layer}
              className={`grid gap-1 ${INSET} py-5 sm:grid-cols-[10rem_1fr] sm:gap-8`}
            >
              <dt className="font-mono text-[10.5px] tracking-[0.09em] text-[var(--faint)] uppercase">
                {row.layer}
              </dt>
              <dd>
                <p className="text-[13px] font-medium text-[var(--heading)]">{row.choice}</p>
                <p className="mt-1 max-w-[72ch] text-[12.5px] leading-[1.7] text-[var(--dim)]">
                  {row.reason}
                </p>
              </dd>
            </div>
          ))}
        </dl>

        <h2
          id="keyboard"
          className={`scroll-mt-20 ${INSET} pt-14 pb-2 text-[19px] font-semibold tracking-[-0.02em] text-[var(--heading)]`}
        >
          Keyboard
        </h2>
        <p className={`${MEASURE} ${INSET} pb-5 text-[12.5px] leading-[1.7] text-[var(--dim)]`}>
          Every binding uses a modifier, because the front door of this app is a text field and a
          bare letter belongs to whatever you are typing.
        </p>
        <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {SHORTCUTS.map((row) => (
            <li key={row.keys} className={`flex items-center gap-8 ${INSET} py-3`}>
              <kbd className="min-w-[4.5rem] border border-[var(--border-strong)] bg-[var(--panel-2)] px-2 py-0.5 text-center font-mono text-[11px] text-[var(--dim)]">
                {row.keys}
              </kbd>
              <span className="text-[13px] text-[var(--body)]">{row.action}</span>
            </li>
          ))}
        </ul>

        <h2
          className={`${INSET} pt-14 pb-2 text-[19px] font-semibold tracking-[-0.02em] text-[var(--heading)]`}
        >
          Credit
        </h2>
        <div className={`${INSET} pb-16`}>
          <p className={`${MEASURE} text-[13px] leading-[1.75] text-[var(--body)]`}>
            The interface follows{' '}
            <a
              href="https://zed.dev"
              className="underline underline-offset-[3px]"
              target="_blank"
              rel="noreferrer"
            >
              Zed
            </a>
            ’s design language: near-black with a blue cast, hairline borders carrying the structure
            that colour usually would, a blueprint grid, and exactly two full blue surfaces in the
            whole product. Typeset in IBM Plex, which is what Zed Plex is built from.
          </p>
          <p className={`mt-3 ${MEASURE} text-[13px] leading-[1.75] text-[var(--body)]`}>
            Built by{' '}
            <a
              href="https://abhisheksan.com"
              className="underline underline-offset-[3px]"
              target="_blank"
              rel="noreferrer"
            >
              Abhishek Sharma
            </a>
            .
          </p>
        </div>
      </article>
    </>
  );
}
