/** A list of gist summaries, with a caller-chosen empty state. */
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { GistType } from '@/types';

type GistListPropsType = {
  gists: GistType[];
  empty: ReactNode;
};

const dayMonth = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' });

/**
 * The feed.
 *
 * Rows are separated by hairlines rather than cards, because a card per gist turns a
 * list of twelve into a wall and this design uses borders where others use boxes.
 * They run the full width of the window and carry their own inset, so the rules
 * reach both edges the way every other band in the product does.
 */
export function GistList({ gists, empty }: GistListPropsType) {
  if (gists.length === 0) {
    return <>{empty}</>;
  }

  return (
    <ul className="divide-y divide-[var(--border)] border-b border-[var(--border)]">
      {gists.map((gist) => (
        <li key={gist.slug}>
          <GistSummary gist={gist} />
        </li>
      ))}
    </ul>
  );
}

type GistSummaryPropsType = {
  gist: GistType;
};

/**
 * One row.
 *
 * The left edge carries a rule that turns blue on hover, which is how a list of
 * files behaves in an editor and costs no layout: the strip is always there,
 * transparent until the pointer arrives.
 */
function GistSummary({ gist }: GistSummaryPropsType) {
  const filenames = gist.files.map((file) => file.filename);

  return (
    <Link
      to={`/g/${gist.slug}`}
      className="group flex items-start justify-between gap-x-10 gap-y-2 border-l-2 border-transparent px-5 py-4 transition-colors hover:border-[var(--blue-action)] hover:bg-[var(--panel)] sm:px-8"
    >
      <div className="min-w-0">
        <h2 className="truncate text-[14.5px] font-medium tracking-[-0.012em] text-[var(--heading)]">
          {gist.title}
        </h2>

        {gist.description ? (
          <p className="mt-1 max-w-[72ch] text-[12.5px] leading-[1.65] text-[var(--dim)]">
            {gist.description}
          </p>
        ) : null}

        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[10.5px] text-[var(--faint)]">
          {filenames.slice(0, 4).map((filename) => (
            <span key={filename} className="border border-[var(--border)] px-1.5 py-0.5">
              {filename}
            </span>
          ))}
          {filenames.length > 4 ? <span>+{filenames.length - 4}</span> : null}
        </p>
      </div>

      <div className="flex-none text-right font-mono text-[10.5px] text-[var(--faint)]">
        <p className="text-[var(--dim)]">{dayMonth.format(new Date(gist.createdAt))}</p>
        <p className="mt-1">
          {gist.viewCount} {gist.viewCount === 1 ? 'view' : 'views'}
        </p>
        <p className="mt-1">
          {gist.author ? gist.author.handle : 'anonymous'}
          {gist.visibility === 'public' ? '' : ` · ${gist.visibility}`}
        </p>
      </div>
    </Link>
  );
}
