/** An uploaded file: its size, and its expiry once the blob storage has cleared it. */
import { panelId, tabId } from '@/chrome/FileTabs';
import type { GistFileType } from '@/types';

type BinaryFilePropsType = {
  file: GistFileType;
};

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

function formatBytes(byteSize: number): string {
  if (byteSize < 1024) {
    return `${byteSize} bytes`;
  }
  if (byteSize < 1024 * 1024) {
    return `${(byteSize / 1024).toFixed(1)} KB`;
  }
  return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`;
}
