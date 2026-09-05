/** The counts shown above your own gist list.

 * Derived from the list the page already holds rather than a second request,
 * because these are sums of rows in hand. A stats endpoint would be a round trip to
 * compute what addition can.
 */
import type { StatType } from '@/explore/types';
import type { GistType } from '@/types';

export function buildGistStats(gists: GistType[]): StatType[] {
  return [
    { label: 'Gists', value: String(gists.length) },
    { label: 'Files', value: String(sum(gists, (gist) => gist.files.length)) },
    { label: 'Views', value: String(sum(gists, (gist) => gist.viewCount)) },
    { label: 'Public', value: String(count(gists, 'public')) },
    { label: 'Private', value: String(count(gists, 'private')) },
  ];
}

function sum(gists: GistType[], of: (gist: GistType) => number): number {
  return gists.reduce((total, gist) => total + of(gist), 0);
}

function count(gists: GistType[], visibility: GistType['visibility']): number {
  return gists.filter((gist) => gist.visibility === visibility).length;
}
