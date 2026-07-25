"use client";

import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook using Web WakeLock API
 * Keeps mobile phone and laptop displays awake during active study sessions.
 */
export function useWakeLock(enabled: boolean = true) {
  const wakeLockRef = useRef<any>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setIsLocked(true);

          wakeLockRef.current.addEventListener('release', () => {
            setIsLocked(false);
          });
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    }

    requestWakeLock();

    // Re-request wake lock if tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [enabled]);

  return { isLocked };
}
