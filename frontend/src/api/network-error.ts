/**
 * Whether an error came from `fetch` itself rather than an HTTP response.
 *
 * `fetch` rejects with a `TypeError` when the network is unreachable, which is how
 * an API outage is told apart from a normal `ApiError` the server returned.
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}
