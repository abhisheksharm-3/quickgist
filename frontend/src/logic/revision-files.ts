/** Which files two versions of a gist have between them. */
import type { GistType, RevisionType } from '@/types/index';

export /** Every filename in either version, in the revision's order first. */
function fileNames(stored: RevisionType, gist: GistType | undefined): string[] {
  const names = stored.files.map((file) => file.filename);

  for (const file of gist?.files ?? []) {
    if (!names.includes(file.filename)) {
      names.push(file.filename);
    }
  }

  return names;
}
