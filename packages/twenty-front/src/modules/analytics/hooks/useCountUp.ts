// FORK: Voka CRM — Fase 20: contador animado com requestAnimationFrame
import { useEffect, useRef, useState } from 'react';

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp(target: number, durationMs = 1200): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion: skip animation if duration resolves to 0
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || durationMs === 0) {
      setCurrent(target);
      return;
    }

    setCurrent(0);
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      setCurrent(Math.round(easeOut(progress) * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, durationMs]);

  return current;
}
