import { useState, useEffect, useRef } from 'react';
import { CONNECTIVITY_CHECK_URL } from '../constants/urls';

export function useConnectivity() {
  const [isConnected, setIsConnected] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        await fetch(CONNECTIVITY_CHECK_URL, {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (mounted) setIsConnected(true);
      } catch {
        if (mounted) setIsConnected(false);
      }
    };
    check();
    intervalRef.current = setInterval(check, 30000);
    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return isConnected;
}
