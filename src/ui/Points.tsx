import { useEffect, useRef, useState } from "react";

/** Points with smooth, time-based count-up (same speed at any refresh rate). */
export function Points({ value, label }: { value: number; label: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const dur = 500;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const v = Math.round(a + (value - a) * (1 - (1 - t) ** 3));
      setShown(v);
      from.current = v;
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  const neg = shown < 0;
  return (
    <div className="text-center" aria-live="polite">
      <div className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`tabular text-5xl font-extrabold ${neg ? "text-negative" : "text-foreground"}`}>
        {neg ? "−" : ""}{Math.abs(shown)}
      </div>
    </div>
  );
}

export const fmt = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");
