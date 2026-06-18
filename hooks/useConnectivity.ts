import { useState, useEffect, useRef } from 'react';

export function useConnectivity() {
  const [isConnected, setIsConnected] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timer);
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };
    check();
    intervalRef.current = setInterval(check, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return isConnected;
}
