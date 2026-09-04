/** Drawing the mermaid blocks inside a rendered document. */
import { useEffect } from 'react';
import { useResolvedTheme } from '@/theme/use-resolved-theme';

const SELECTOR = '[data-language="mermaid"]';

/**
 * Turns every mermaid block in `container` into a diagram.
 *
 * This is the one thing the server cannot render. mermaid is a browser library with
 * no Go equivalent, and running one in a headless browser per gist would cost more
 * than the whole rest of the product. So the server marks the block with its
 * language and the browser draws it, and it does that only for a document that
 * actually contains one: the import is dynamic, so mermaid is a chunk nobody else
 * downloads.
 *
 * The source is kept on the element after the first pass, because drawing replaces
 * the block's contents and a theme change has to draw it again from the same text.
 *
 * The SVG is written with innerHTML, which is safe here for one specific reason:
 * `securityLevel: 'strict'` makes mermaid sanitize the diagram it produces, and the
 * text it starts from has already been through the server's sanitizer as well.
 */
export function useMermaid(container: HTMLElement | null, html: string | undefined): void {
  const theme = useResolvedTheme();

  useEffect(() => {
    if (!container || !html) {
      return;
    }

    const blocks = Array.from(container.querySelectorAll<HTMLElement>(SELECTOR));
    if (blocks.length === 0) {
      return;
    }

    let isCancelled = false;

    const draw = async (): Promise<void> => {
      const { default: mermaid } = await import('mermaid');
      if (isCancelled) {
        return;
      }

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: theme === 'dark' ? 'dark' : 'default',
        fontFamily: 'var(--font-mono)',
      });

      for (const [index, block] of blocks.entries()) {
        const source = block.dataset.mermaidSource ?? block.textContent ?? '';
        if (source.trim() === '') {
          continue;
        }
        block.dataset.mermaidSource = source;

        try {
          const { svg } = await mermaid.render(`mermaid-${index}-${Date.now()}`, source);
          if (isCancelled) {
            return;
          }
          block.innerHTML = svg;
          block.dataset.mermaidState = 'drawn';
        } catch {
          block.dataset.mermaidState = 'failed';
        }
      }
    };

    void draw();

    return () => {
      isCancelled = true;
    };
  }, [container, html, theme]);
}
