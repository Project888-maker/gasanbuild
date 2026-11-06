"use client";

// Counts the leading number up when it scrolls into view ("941" → 0…941). Text without a number stays as is.
import { useEffect, useRef, useState } from "react";

export default function Counter({ value }: { value: string }) {
  const match = value.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  const [shown, setShown] = useState(match ? `${match[1]}0${match[3]}` : value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!match || !ref.current) return;
    const [, before, digits, after] = match;
    const target = Number(digits);
    const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || target < 2) {
      setShown(value);
      return;
    }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1600);
        const eased = 1 - Math.pow(1 - t, 4);
        setShown(`${before}${(target * eased).toFixed(decimals)}${after}`);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={ref}>{shown}</span>;
}
