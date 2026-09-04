/** The band that opens every list-shaped route. */
import type { ReactNode } from 'react';

type PageHeaderPropsType = {
  eyebrow: string;
  title: string;
  description?: string | undefined;
  aside?: ReactNode;
  children?: ReactNode;
};

/**
 * A page header.
 *
 * Every route that is a list opens with this, so the feed, an author's page, and
 * your own gists all begin the same way: a mono label, the title, one line of
 * explanation, and a hairline the content hangs from. Without it each page started
 * with a bare heading floating in the grid, which read as an unstyled document
 * rather than a screen.
 *
 * `aside` is the right-hand cell. It is where a page puts the one fact or link that
 * belongs to the whole page rather than to any row, and it is what keeps the band
 * from being three quarters empty on a wide window.
 */
export function PageHeader({ eyebrow, title, description, aside, children }: PageHeaderPropsType) {
  return (
    <header className="flex-none border-b border-[var(--border)]">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 px-5 pt-8 pb-6 sm:px-8 sm:pt-10">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--faint)] uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-2.5 text-[24px] leading-none font-semibold tracking-[-0.025em] text-[var(--heading)]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-[58ch] text-[12.5px] leading-[1.7] text-[var(--dim)]">
              {description}
            </p>
          ) : null}
        </div>

        {aside ? <div className="flex-none">{aside}</div> : null}
      </div>

      {children}
    </header>
  );
}
