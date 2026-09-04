/** Sentry initialisation for the browser. */
import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;
const TRACES_SAMPLE_RATE = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0.1');

/**
 * Starts error reporting, doing nothing when no DSN is configured.
 *
 * Session Replay is deliberately absent. Replay records the DOM, and this app
 * displays private gists, so enabling it would ship the contents of documents
 * people chose not to publish to a third party. Errors and traces carry no gist
 * content, so they are safe to send.
 *
 * httpBodies is emptied for the same reason: a create request body is an entire
 * gist.
 */
export function initObservability(): void {
  if (!DSN) {
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: Number.isFinite(TRACES_SAMPLE_RATE) ? TRACES_SAMPLE_RATE : 0.1,
    tracePropagationTargets: ['localhost', /^\/v1\//],
    dataCollection: {
      httpBodies: [],
    },
  });
}
