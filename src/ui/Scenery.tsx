import type { ReactNode } from "react";

/** Sky gradient with layered mountain silhouettes. */
export function Scenery({ children }: { children: ReactNode }) {
  return (
    <div className="sky relative min-h-screen w-full overflow-x-hidden">
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-[45vh] w-full" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden>
        <path d="M0 120 L60 60 L110 100 L170 40 L230 95 L290 50 L350 90 L400 70 V200 H0Z" fill="var(--ridge-far)" />
        <path d="M170 40 L185 55 L175 58 L160 52Z M290 50 L302 62 L285 60Z" fill="var(--snow)" />
        <path d="M0 150 L50 110 L120 145 L190 95 L260 140 L330 105 L400 135 V200 H0Z" fill="var(--ridge-mid)" />
        <path d="M0 180 L80 150 L160 175 L250 145 L330 172 L400 160 V200 H0Z" fill="var(--ridge-near)" />
      </svg>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[560px] flex-col px-4 py-4 min-[900px]:max-w-[760px]">
        {children}
      </div>
    </div>
  );
}

/** Trail with pennants for stages. */
export function Trail({ progress, stages }: { progress: number; stages: number }) {
  const p = Math.min(1, Math.max(0, progress));
  return (
    <div className="relative h-6 w-full" aria-hidden>
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-card/60" />
      <div className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary transition-[width] duration-500" style={{ width: `${p * 100}%` }} />
      {Array.from({ length: stages }, (_, i) => {
        const at = (i + 1) / stages;
        const reached = p >= at - 1e-6;
        return (
          <svg key={i} viewBox="0 0 16 20" className="absolute top-0 h-6 w-5 -translate-x-1/2" style={{ left: `${at * 100}%` }}>
            <line x1="3" y1="2" x2="3" y2="20" stroke="var(--foreground)" strokeWidth="1.5" />
            <path d="M3 2 L15 6 L3 10Z" fill={reached ? "var(--vrchol)" : "var(--card)"} stroke="var(--foreground)" strokeWidth="1" />
          </svg>
        );
      })}
    </div>
  );
}
