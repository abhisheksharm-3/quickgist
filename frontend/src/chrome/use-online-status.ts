/** Tracks whether the browser thinks it has a network at all. */
import { useEffect, useState } from 'react';

/**
 * Reports connectivity.
 *
 * `navigator.onLine` is a weak signal, true whenever an interface is up even if
 * nothing is reachable, so this only drives a banner and never gates a request. A
 * request that fails anyway surfaces its own error.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
