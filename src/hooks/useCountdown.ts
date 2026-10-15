import { useEffect, useRef, useState } from 'react';

interface Options {
  seconds: number;
  running: boolean;
  onExpire: () => void;
  /** Reset the clock when this key changes (new run). */
  resetKey?: number;
}

/**
 * Real-time session countdown.
 * - elapsed time is measured from timestamps, so re-renders never double-count
 * - one interval per running span, always cleaned up
 * - a hidden tab pauses the clock, and a single tick can never skip more than 1s
 * - onExpire fires at most once per run
 */
export function useCountdown({ seconds, running, onExpire, resetKey = 0 }: Options) {
  const [remaining, setRemaining] = useState(seconds);
  const remainingMs = useRef(seconds * 1000);
  const expired = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    remainingMs.current = seconds * 1000;
    expired.current = false;
    setRemaining(seconds);
  }, [resetKey, seconds]);

  useEffect(() => {
    if (!running || expired.current) return;
    let last = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = Math.min(now - last, 1000);
      last = now;
      if (document.hidden) return;
      remainingMs.current = Math.max(0, remainingMs.current - delta);
      setRemaining(Math.ceil(remainingMs.current / 1000));
      if (remainingMs.current <= 0 && !expired.current) {
        expired.current = true;
        window.clearInterval(id);
        onExpireRef.current();
      }
    }, 250);
    const onVisibility = () => {
      last = Date.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [running, resetKey]);

  return remaining;
}
