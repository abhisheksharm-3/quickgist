/** The contents rail beside a long rendered document. */
import { useDocumentHeadings } from '@/hooks/useDocumentHeadings';

/**
 * A table of contents, read out of the document that is already on the page.
 *
 * goldmark gives every heading an id, so the rail is a list of links to anchors that
 * exist rather than a second copy of the document's structure that could disagree
 * with it. It appears only when there are at least three headings, because two
 * headings are not a document somebody needs help navigating.
 */
export function DocumentToc({
  container,
  html,
}: {
  container: HTMLElement | null;
  html: string | undefined;
}) {
  const headings = useDocumentHeadings(container, html);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Contents" className="hidden lg:block">
      <p className="font-mono text-[9.5px] tracking-[0.14em] text-[var(--faint)] uppercase">
        Contents
      </p>
      <ul className="mt-4 space-y-2 border-l border-[var(--border)]">
        {headings.map((heading) => (
          <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 0.7 + 0.8}rem` }}>
            <a
              href={`#${heading.id}`}
              className="block text-[12px] leading-[1.45] text-[var(--dim)] transition-colors hover:text-[var(--heading)]"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
