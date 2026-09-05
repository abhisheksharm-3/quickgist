/** The frame every route renders inside. */
import { AppErrorBoundary } from '@/chrome/AppErrorBoundary';
import { ChromeBar } from '@/chrome/ChromeBar';
import { Footer } from '@/chrome/Footer';
import { OfflineBand } from '@/chrome/OfflineBand';
import type { AppFramePropsType } from '@/chrome/types';
import { API_BASE_URL } from '@/lib/env';

/**
 * The application shell.
 *
 * Nothing here constrains width: an editor floating in a centred column reads as a
 * form pretending to be one. Only rendered prose is constrained, and it does that
 * inside its own pane.
 *
 * The route area is exactly the viewport minus the chrome, so whatever a route
 * renders owns the first screen and the footer begins at the fold. That keeps the
 * footer reachable without letting it eat height from a short page, where it
 * otherwise rode up into view and made the page look finished when it was not.
 *
 * A render that throws is caught inside `main`, so the chrome survives it and a
 * reader gets an explanation with a way out rather than a blank page.
 *
 * The stylesheet is linked with React 19's `precedence`, which hoists and dedupes
 * it, replacing the imperative DOM append this used to need. It comes from the API
 * because the highlight classes and the rules that style them are produced by the
 * same renderer, so shipping them together keeps them from drifting apart.
 */
export function AppFrame({ children }: AppFramePropsType) {
  return (
    <div className="app-grid flex min-h-[100dvh] flex-col bg-[var(--bg)] text-[var(--text)]">
      <link rel="stylesheet" precedence="default" href={`${API_BASE_URL}/v1/highlight.css`} />
      <ChromeBar />
      <OfflineBand />
      <main className="flex min-h-[calc(100dvh-var(--chrome-h))] flex-1 flex-col">
        <AppErrorBoundary>{children}</AppErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
