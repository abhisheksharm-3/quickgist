/**
 * Injects one text file's server-rendered HTML into the document.
 *
 * The HTML comes from the API, which produced it with goldmark or chroma and then
 * passed it through bluemonday's allowlist sanitizer. Injecting it here is the point
 * of rendering on the server: the browser downloads no highlighter at all.
 */
import { useState } from 'react';
import { panelId, tabId } from '@/chrome/FileTabs';
import { useMermaid } from '@/gist/use-mermaid';
import type { GistFileType } from '@/types';

type RenderedFilePropsType = {
  file: GistFileType;
};

/**
 * One rendered file.
 *
 * The document sits in a column with a hairline down each side, which is what stops
 * a two-line gist from floating in the middle of an otherwise empty window: the
 * rules say where the page is, and the space beside them reads as margin instead of
 * a rendering failure.
 *
 * Prose is held to a reading measure; code and tables inside it are allowed to
 * exceed that and scroll in their own container, which is why the measure is on the
 * prose wrapper rather than on the pane.
 */
export function RenderedFile({ file }: RenderedFilePropsType) {
  const isProse = file.kind === 'markdown' || file.kind === 'text';
  const [documentElement, setDocumentElement] = useState<HTMLElement | null>(null);

  useMermaid(documentElement, file.html);

  return (
    <section
      id={panelId(file.filename)}
      role="tabpanel"
      aria-labelledby={tabId(file.filename)}
      className="flex-1 border-b border-[var(--border)]"
    >
      <div className="mx-auto min-h-[58dvh] w-full max-w-[78rem] border-[var(--border)] px-5 py-8 sm:border-x sm:px-10 sm:py-10">
        {file.html ? (
          <div
            ref={setDocumentElement}
            className={isProse ? 'gist-prose reading-measure' : 'gist-prose'}
          >
            <div
              // The API sanitised this with bluemonday before it left the server.
              dangerouslySetInnerHTML={{ __html: file.html }}
            />
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
