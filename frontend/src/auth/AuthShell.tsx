/** The frame both account pages share. */
import { Link } from 'react-router';
import { BENEFITS } from '@/auth/content';
import type { AuthShellPropsType } from '@/auth/types';

/**
 * The account page frame.
 *
 * Full bleed like every other route: a hairline header spanning the viewport with
 * the form inset below it, rather than a card floating in the middle of an empty
 * page.
 */
export function AuthShell({ code, title, intro, children, footer }: AuthShellPropsType) {
  return (
    <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <div className="flex min-w-0 flex-col border-b border-[var(--border)] lg:border-b-0">
        <header className="border-b border-[var(--border)] px-5 pt-10 pb-8 sm:px-10 sm:pt-14">
          <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--faint)] uppercase">
            {code}
          </p>
          <h1 className="mt-3 font-serif text-[30px] leading-tight font-light italic tracking-[-0.01em] text-[var(--heading)]">
            {title}
          </h1>
          <p className="mt-3 max-w-[54ch] text-[13px] leading-[1.7] text-[var(--dim)]">{intro}</p>
        </header>

        <div className="flex-1 px-5 py-9 sm:px-10">
          <div className="max-w-[30rem]">{children}</div>
        </div>

        <div className="border-t border-[var(--border)] px-5 py-5 text-[12.5px] text-[var(--dim)] sm:px-10">
          {footer}
          <p className="mt-2.5">
            <Link to="/" className="underline underline-offset-[3px] hover:text-[var(--heading)]">
              Back to the editor
            </Link>
          </p>
        </div>
      </div>

      <aside className="px-5 py-10 sm:px-8 lg:border-l lg:border-[var(--border)] lg:py-14">
        <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--faint)] uppercase">
          What an account adds
        </p>
        <ul className="mt-5 max-w-[46ch] space-y-4">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title}>
              <p className="text-[13px] font-medium text-[var(--heading)]">{benefit.title}</p>
              <p className="mt-1 text-[12.5px] leading-[1.6] text-[var(--dim)]">{benefit.detail}</p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
