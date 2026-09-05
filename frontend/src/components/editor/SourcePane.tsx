/** The writing surface. */
import { lazy, Suspense } from 'react';
import type { SourceFallbackPropsType, SourcePanePropsType } from '@/types/editor';

const CodeEditor = lazy(async () => ({
  default: (await import('@/components/editor/CodeEditor')).CodeEditor,
}));

/**
 * The source editor.
 *
 * CodeMirror is loaded lazily, because the person who opens a shared link never
 * types: keeping the editor out of the main bundle means a reader pays nothing for
 * it. The fallback shows the text immediately so a paste is never invisible while
 * the grammar downloads.
 *
 * A plain textarea cannot show coloured tokens or an aligned gutter at all, which is
 * why this is a real editor component rather than a styled input.
 */
export function SourcePane({
  value,
  onChange,
  filename,
  language,
  ariaLabel,
}: SourcePanePropsType) {
  return (
    <Suspense fallback={<SourceFallback value={value} />}>
      <CodeEditor
        value={value}
        onChange={onChange}
        filename={filename}
        language={language}
        ariaLabel={ariaLabel}
      />
    </Suspense>
  );
}

function SourceFallback({ value }: SourceFallbackPropsType) {
  return (
    <pre className="h-full overflow-hidden px-5 py-4 font-mono text-[12px] leading-[1.75] text-[var(--dim)]">
      {value || 'Paste Markdown or code…'}
    </pre>
  );
}
