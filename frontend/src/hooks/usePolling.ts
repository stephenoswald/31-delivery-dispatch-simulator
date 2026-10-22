import { useEffect, useState } from 'react';
export function usePolling(interval = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      if (timer) clearInterval(timer);
      if (document.visibilityState !== 'hidden') {
        setNow(Date.now());
        timer = setInterval(() => setNow(Date.now()), interval);
      }
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, [interval]);
  return now;
}
