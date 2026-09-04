/** The shared shape for every nothing-here screen. */

import type { ReactNode } from 'react';
import { Link } from 'react-router';

export type EmptyStateActionType = {
  label: string;
  to: string;
  primary?: boolean;
};

type EmptyStatePropsType = {
  code: string;
  title: string;
  children: ReactNode;
  actions?: EmptyStateActionType[] | undefined;
};

/**
 * A nothing-here screen.
 *
 * Every one of these uses the same shape so a missing gist, an empty feed, and a
 * wrong URL feel like the same product rather than three different dead ends: a mono
 * code, the serif line the hero uses, one sentence of plain explanation, and a way
 * out.
 *
 * It is full bleed with no card. A bordered box floating in a wide dark page drew a
 * frame around the absence of content, which made it look like a failed component
 * rather than an answer.
 *
 * There is no illustration. A drawing of a telescope tells nobody what went wrong.
 */
export function EmptyState({ code, title, children, actions }: EmptyStatePropsType) {
  return (
    <div className="relative isolate flex min-h-[60dvh] flex-1 items-center justify-center overflow-hidden px-5 py-16 sm:py-24">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-56 -translate-y-1/2 [background-image:repeating-linear-gradient(45deg,var(--grid)_0_1px,transparent_1px_7px)] [mask-image:linear-gradient(to_right,transparent,black_35%,black_65%,transparent)]"
      />

      <div className="max-w-[52ch] text-center">
        <span aria-hidden className="mx-auto mb-6 block h-6 w-px bg-[var(--border-strong)]" />
        <p className="font-mono text-[10.5px] tracking-[0.13em] text-[var(--faint)] uppercase">
          {code}
        </p>

        <h1 className="mt-3 font-serif text-[26px] leading-tight font-light italic tracking-[-0.01em] text-[var(--heading)]">
          {title}
        </h1>

        <p className="mx-auto mt-3 max-w-[42ch] text-[13px] leading-[1.7] text-[var(--dim)]">
          {children}
        </p>

        {actions && actions.length > 0 ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {actions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className={
                  action.primary
                    ? 'bg-[var(--blue-action)] px-3.5 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-[color-mix(in_oklab,var(--blue-action)_88%,black)]'
                    : 'border border-[var(--border-strong)] bg-[var(--panel-2)] px-3.5 py-1.5 text-[12.5px] text-[var(--dim)] transition-colors hover:border-[var(--dim)] hover:text-[var(--heading)]'
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
