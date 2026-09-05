/** The API URLs a gist page links to, built from one base.

 * The raw file and the preview card are served by the API rather than the app, so
 * their addresses are absolute in production and relative behind the dev proxy.
 */
import { API_BASE_URL } from '@/constants/env';

export /** Where a file's unrendered source lives, matching the API's raw route. */
function rawUrlFor(slug: string, filename: string): string {
  return `${API_BASE_URL}/v1/gists/${slug}/raw/${encodeURIComponent(filename)}`;
}

export /** The link-preview card the API draws for this gist. */
function cardUrlFor(slug: string): string {
  return `${API_BASE_URL}/v1/gists/${slug}/og.png`;
}
