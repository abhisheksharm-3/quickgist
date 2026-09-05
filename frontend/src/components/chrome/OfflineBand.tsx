/** A banner shown only while the browser reports no network. */
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * Announces lost connectivity.
 *
 * It renders nothing when online. An earlier version rendered unconditionally, which
 * told everyone the API was unreachable while it was answering fine.
 */
export function OfflineBand() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className="border-b border-[var(--border)] bg-[var(--panel-2)] px-5 py-2 text-[11.5px] text-[var(--text)]"
    >
      No network. quickgist will work again once you are back online.
    </p>
  );
}
