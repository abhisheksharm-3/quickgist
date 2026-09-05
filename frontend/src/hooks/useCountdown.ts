/** A number that counts itself down, for a retry the reader is waiting on. */
import { useEffect, useState } from 'react';

export function useCountdown(seconds: number | null): number | null {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    if (seconds === null) return;

    const interval = setInterval(() => {
      setRemaining((current) => (current === null ? null : Math.max(0, current - 1)));
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  return remaining;
}
