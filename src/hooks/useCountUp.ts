"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Плавный счёт числа от предыдущего значения к target.
 * Уважает prefers-reduced-motion (мгновенно). Без зависимостей.
 */
export function useCountUp(target: number, duration = 500): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = target;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 0 : duration;

    let raf = 0;
    const start = performance.now();
    function tick(now: number) {
      const t = dur === 0 ? 1 : Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
