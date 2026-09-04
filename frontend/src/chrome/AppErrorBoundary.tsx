/** The last line of defence for a render that throws. */
import * as Sentry from '@sentry/react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/chrome/EmptyState';

type AppErrorBoundaryPropsType = {
  children: ReactNode;
};

/**
 * Catches a render error anywhere in the tree.
 *
 * Without it a thrown component unmounts the whole app and leaves a blank page, which
 * tells a reader nothing and is indistinguishable from a failed deploy. Sentry's
 * boundary is used rather than a hand-written one because it reports the error on the
 * way past, and this project already depends on it.
 *
 * The fallback offers a reload rather than pretending recovery is possible: the tree
 * that threw is gone, and a stale one is worse than an honest restart.
 */
export function AppErrorBoundary({ children }: AppErrorBoundaryPropsType) {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <EmptyState code="Error" title="Something broke">
          The page hit an error it could not recover from. Reloading usually clears it, and the
          problem has been reported.
        </EmptyState>
      }
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
