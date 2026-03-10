/**
 * useElapsedTimer
 * Tracks elapsed time from a start timestamp with 1-second updates
 */

import { useState, useEffect, useRef } from 'react';

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${padZero(h)}:${padZero(m)}:${padZero(s)}`;
}

export function useElapsedTimer(startedAt: string | null): {
  elapsedSeconds: number;
  formatted: string;
} {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(startedAt).getTime();

    const update = () => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startedAt]);

  return {
    elapsedSeconds,
    formatted: formatElapsed(elapsedSeconds),
  };
}

export default useElapsedTimer;
