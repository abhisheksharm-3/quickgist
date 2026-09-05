/** An uploaded file: its size, and its expiry once the blob storage has cleared it. */

import { formatBytes } from '@/logic/format-bytes';
import { panelId, tabId } from '@/logic/tab-ids';
import type { BinaryFilePropsType } from '@/types/gist';

export function BinaryFile({ file }: BinaryFilePropsType) {
  const expiresAt = file.blobExpiresAt ? new Date(file.blobExpiresAt) : null;
  const isExpired = expiresAt !== null && expiresAt.getTime() <= Date.now();

  return (
    <section
      id={panelId(file.filename)}
      role="tabpanel"
      aria-labelledby={tabId(file.filename)}
      className="text-sm text-[var(--body)]"
    >
      <p>Uploaded file, {formatBytes(file.byteSize)}.</p>
      {isExpired && expiresAt ? (
        <p className="mt-1 text-[var(--dim)]">
          This upload expired on {expiresAt.toLocaleDateString()}. The gist's text files are intact.
        </p>
      ) : expiresAt ? (
        <p className="mt-1 text-[var(--dim)]">Kept until {expiresAt.toLocaleDateString()}.</p>
      ) : null}
    </section>
  );
}
