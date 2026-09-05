/** The headings of a rendered document, read back out of the page.
 *
 * goldmark gives every heading an id, so the rail built from this links to anchors
 * that exist rather than to a second copy of the document's structure.
 */
import { useEffect, useState } from 'react';
import { MIN_HEADINGS } from '@/constants/gist';
import type { HeadingType } from '@/types/gist';

export function useDocumentHeadings(
  container: HTMLElement | null,
  html: string | undefined,
): HeadingType[] {
  const [headings, setHeadings] = useState<HeadingType[]>([]);

  useEffect(() => {
    if (!container || !html) {
      setHeadings([]);
      return;
    }

    const found = Array.from(container.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id]')).map(
      (heading) => ({
        id: heading.id,
        text: heading.textContent ?? '',
        level: Number(heading.tagName.slice(1)),
      }),
    );

    setHeadings(found.length >= MIN_HEADINGS ? found : []);
  }, [container, html]);

  return headings;
}
