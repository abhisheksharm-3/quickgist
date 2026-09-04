/**
 * Renders the server HTML from `usePreview`. It never blanks: a pending or
 * failed request keeps the last good render, and the header names the state
 * instead.
 */
import { useEffect, useState } from 'react';
import type { DraftFileType } from '@/editor/types';
import { usePreview } from '@/editor/use-preview';
import { useMermaid } from '@/gist/use-mermaid';

type PreviewPaneProps = {
  file: DraftFileType;
};

export function PreviewPane({ file }: PreviewPaneProps): React.JSX.Element {
  const { html, status, isStale, retryAfterSeconds } = usePreview(file);
  const countdown = useCountdown(retryAfterSeconds);
  const [documentElement, setDocumentElement] = useState<HTMLElement | null>(null);

  useMermaid(documentElement, html ?? undefined);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-1.5 text-[11px] uppercase tracking-[0.09em] text-[var(--dim)]">
        <span>Preview</span>
        <PreviewIndicator status={status} isStale={isStale} countdown={countdown} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-[var(--bg)] px-4 py-4">
        {html ? (
          <div
            ref={setDocumentElement}
            className="gist-prose reading-measure"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-[12.5px] text-[var(--faint)]">Nothing to preview yet.</p>
        )}
      </div>
    </div>
  );
}

type PreviewIndicatorProps = {
  status: ReturnType<typeof usePreview>['status'];
  isStale: boolean;
  countdown: number | null;
};

function PreviewIndicator({
  status,
  isStale,
  countdown,
}: PreviewIndicatorProps): React.JSX.Element | null {
  if (status === 'pending') {
    return <span aria-live="polite">Updating…</span>;
  }

  if (isStale) {
    return (
      <span aria-live="polite">
        {countdown !== null && countdown > 0
          ? `Preview stale · rate limited, retrying in ${countdown}s`
          : 'Preview stale · could not reach the server'}
      </span>
    );
  }

  return null;
}

function useCountdown(seconds: number | null): number | null {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    if (seconds === null) return;

    const interval = setInterval(() => {
      setRemaining((current) => (current === null ? null : Math.max(0, current - 1)));
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  return remaining;
}
