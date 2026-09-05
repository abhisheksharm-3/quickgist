/** Selecting and linking lines of a rendered code file. */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * Parses a `#L12` or `#L12-L20` hash into an inclusive line range.
 *
 * Exported because it is the whole contract of the URL format, and a wrong
 * assumption about it is worth a test rather than a comment.
 */
export function parseLineRange(hash: string): [number, number] | null {
  const match = /^#L(\d+)(?:-L(\d+))?$/.exec(hash);
  if (!match?.[1]) {
    return null;
  }

  const start = Number(match[1]);
  const end = match[2] === undefined ? start : Number(match[2]);
  return start <= end ? [start, end] : [end, start];
}

/** Builds the hash for a range, collapsing a single line to one anchor. */
export function formatLineRange(start: number, end: number): string {
  const [from, to] = start <= end ? [start, end] : [end, start];
  return from === to ? `L${from}` : `L${from}-L${to}`;
}

/**
 * Makes the line numbers of a code file into a selection.
 *
 * chroma already emits an anchor per line number, so a click is a link and needs no
 * help. What this adds is the other half: reading the range back out of the URL and
 * marking those lines, and extending the range on a shift-click, which is how every
 * code host behaves and what makes the link worth sending.
 *
 * The rows are found by index rather than by id, because only the line-number column
 * carries ids; the code column is a parallel list of `.line` spans.
 */
export function useLineAnchors(container: HTMLElement | null, html: string | undefined): void {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!container || !html) {
      return;
    }

    const numbers = Array.from(container.querySelectorAll<HTMLElement>('.chroma .lnt'));
    const lines = Array.from(
      container.querySelectorAll<HTMLElement>('.chroma td:last-child .line'),
    );
    if (numbers.length === 0) {
      return;
    }

    const range = parseLineRange(location.hash);

    for (const [index, row] of numbers.entries()) {
      const isSelected = range !== null && index + 1 >= range[0] && index + 1 <= range[1];
      setSelected(row, isSelected);
      setSelected(lines[index], isSelected);
    }

    if (range) {
      numbers[range[0] - 1]?.scrollIntoView({ block: 'center' });
    }

    const handleClick = (event: MouseEvent): void => {
      const anchor = (event.target as HTMLElement | null)?.closest('.lnt a');
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const clicked = parseLineRange(new URL(anchor.href).hash);
      if (!clicked) {
        return;
      }

      event.preventDefault();
      const next =
        event.shiftKey && range
          ? formatLineRange(range[0], clicked[0])
          : formatLineRange(clicked[0], clicked[1]);
      navigate({ hash: next }, { replace: true });
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [container, html, location.hash, navigate]);
}

function setSelected(element: HTMLElement | undefined, isSelected: boolean): void {
  if (!element) {
    return;
  }
  if (isSelected) {
    element.dataset.lineSelected = 'true';
    return;
  }
  delete element.dataset.lineSelected;
}
