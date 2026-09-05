/**
 * Injects one text file's server-rendered HTML into the document.
 *
 * The HTML comes from the API, which produced it with goldmark or chroma and then
 * passed it through bluemonday's allowlist sanitizer. Injecting it here is the point
 * of rendering on the server: the browser downloads no highlighter at all.
 */
import { useState } from 'react';
import { DocumentToc } from '@/components/gist/DocumentToc';
import { useCodeCopy } from '@/hooks/useCodeCopy';
import { useLineAnchors } from '@/hooks/useLineAnchors';
import { useMermaid } from '@/hooks/useMermaid';
import { panelId, tabId } from '@/logic/tab-ids';
import type { RenderedFilePropsType } from '@/types/gist';

/**
 * One rendered file.
 *
 * The document sits in a column with a hairline down each side, which is what stops
 * a two-line gist from floating in the middle of an otherwise empty window: the
 * rules say where the page is, and the space beside them reads as margin instead of
 * a rendering failure.
 *
 * Everything that makes the document interactive works on the injected HTML from the
 * outside, because there is no React tree inside it: diagrams are drawn, code blocks
 * get a copy button, line numbers become a selection, and headings become a rail.
 *
 * Prose is held to a reading measure; code and tables inside it are allowed to
 * exceed that and scroll in their own container, which is why the measure is on the
 * prose wrapper rather than on the pane.
 */
export function RenderedFile({ file }: RenderedFilePropsType) {
  const isProse = file.kind === 'markdown' || file.kind === 'text';
  const [documentElement, setDocumentElement] = useState<HTMLElement | null>(null);

  useMermaid(documentElement, file.html);
  useCodeCopy(documentElement, file.html);
  useLineAnchors(documentElement, file.html);

  return (
    <section
      id={panelId(file.filename)}
      role="tabpanel"
      aria-labelledby={tabId(file.filename)}
      className="flex-1 border-b border-[var(--border)]"
    >
      <div className="mx-auto min-h-[58dvh] w-full max-w-[78rem] border-[var(--border)] px-5 py-8 sm:border-x sm:px-10 sm:py-10">
        {file.html ? (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
            <div
              ref={setDocumentElement}
              className={isProse ? 'gist-prose reading-measure' : 'gist-prose min-w-0'}
            >
              <div dangerouslySetInnerHTML={{ __html: file.html }} />
            </div>

            <aside className="lg:sticky lg:top-[calc(var(--chrome-h)+2rem)] lg:self-start">
              <DocumentToc container={documentElement} html={file.html} />
            </aside>
          </div>
        ) : (
          <pre className="overflow-x-auto border border-[var(--border)] bg-[var(--panel-2)] p-4 font-mono text-[11px] leading-[1.7]">
            {file.content}
          </pre>
        )}
      </div>
    </section>
  );
}
