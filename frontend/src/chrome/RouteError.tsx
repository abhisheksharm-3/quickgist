/** The standard way a route reports a failed request. */
import { EmptyState } from '@/chrome/EmptyState';
import type { RouteErrorPropsType } from '@/chrome/types';
import { ApiError } from '@/lib/api-client';
import { isNetworkError } from '@/lib/network-error';

/**
 * A failed request, explained.
 *
 * Every route funnels through this so the four failures that actually happen read
 * the same everywhere: no network, rate limited, not found, and everything else. A
 * bare `error.message` puts a server's wording in front of a reader who cannot act
 * on it.
 */
export function RouteError({ error }: RouteErrorPropsType) {
  if (isNetworkError(error)) {
    return (
      <EmptyState code="Offline" title="Cannot reach quickgist">
        The request did not get through. Your connection may be down, or the service may be
        restarting. Nothing you have written locally is lost.
      </EmptyState>
    );
  }

  if (error instanceof ApiError && error.status === 429) {
    return (
      <EmptyState code="Slow down" title="Too many requests">
        You have made a lot of requests in a short time and the service is asking for a pause. Try
        again in a moment.
      </EmptyState>
    );
  }

  if (error instanceof ApiError && error.isNotFound) {
    return (
      <EmptyState
        code="404"
        title="Not here"
        actions={[{ label: 'Start a gist', to: '/', primary: true }]}
      >
        This does not exist, or it is private to somebody else. Those two look the same on purpose,
        so a link cannot be probed to find out which.
      </EmptyState>
    );
  }

  return (
    <EmptyState
      code="Error"
      title="That did not work"
      actions={[{ label: 'Start a gist', to: '/', primary: true }]}
    >
      {error instanceof ApiError ? error.message : 'Something failed on the way to the server.'}
    </EmptyState>
  );
}
