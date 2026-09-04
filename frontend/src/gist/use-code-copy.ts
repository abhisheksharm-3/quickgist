/** A copy button on every code block in a rendered document. */
import { useEffect } from 'react';

const BLOCK_SELECTOR = '.code-block, .chroma';
const BUTTON_CLASS = 'code-copy';

/**
 * Adds a copy button to each code block inside `container`.
 *
 * The buttons are built in the DOM rather than rendered by React, because the
 * document they belong to arrives as a string of HTML from the server and there is
 * no React tree inside it to attach to. One delegated listener on the container
 * handles every button, so a document with forty blocks still has one listener.
 *
 * A block already carrying a button is left alone, which is what makes this safe to
 * run again when the theme changes or the same file is re-rendered.
 */
export function useCodeCopy(container: HTMLElement | null, html: string | undefined): void {
  useEffect(() => {
    if (!container || !html) {
      return;
    }

    addButtons(container);

    /*
     * The buttons live in DOM React owns, so anything that rewrites the document,
     * including a diagram being drawn into it, takes them with it. Watching the
     * container puts them back rather than leaving a block without one.
     */
    const observer = new MutationObserver(() => addButtons(container));
    observer.observe(container, { childList: true, subtree: true });

    const handleClick = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest(`.${BUTTON_CLASS}`);
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const source = button.closest(BLOCK_SELECTOR)?.querySelector('code, pre')?.textContent ?? '';
      void navigator.clipboard.writeText(source).then(() => {
        button.dataset.copied = 'true';
        button.textContent = 'Copied';
        setTimeout(() => {
          delete button.dataset.copied;
          button.textContent = 'Copy';
        }, 1600);
      });
    };

    container.addEventListener('click', handleClick);

    return () => {
      observer.disconnect();
      container.removeEventListener('click', handleClick);
    };
  }, [container, html]);
}

/**
 * Adds a button to every block that has none.
 *
 * Only the outermost block gets one. A highlighted file is a `.chroma` wrapper
 * holding a table whose cells are themselves `.chroma`, so matching the selector
 * alone put three buttons on one file.
 */
function addButtons(container: HTMLElement): void {
  const blocks = Array.from(container.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)).filter(
    (block) =>
      block.dataset.language !== 'mermaid' && block.parentElement?.closest(BLOCK_SELECTOR) === null,
  );

  for (const block of blocks) {
    if (block.querySelector(`.${BUTTON_CLASS}`)) {
      continue;
    }
    block.classList.add('code-block-host');
    block.append(createButton());
  }
}

/** The button itself: text only, so it needs no icon set inside injected HTML. */
function createButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = BUTTON_CLASS;
  button.textContent = 'Copy';
  button.setAttribute('aria-label', 'Copy this code');
  return button;
}
