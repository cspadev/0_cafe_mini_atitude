import { useEffect, useState } from "react";
import { CloudArt, SunArt } from "./art";
import { config } from "@/model/config";

type Props = { cards: boolean[]; open: boolean; effect: "none" | "win" | "loss" };

/** Slot-style tiles: icons alternate while spinning, then stop one by one on the result. */
export function Cards({ cards, open, effect }: Props) {
  return (
    <div className={`relative flex justify-center gap-3 ${effect === "win" ? "anim-pop" : effect === "loss" ? "anim-shake" : ""}`}>
      {cards.map((sun, i) => (
        <Reel key={i} sun={sun} open={open} stopMs={config.flipMs + i * config.flipStaggerMs} />
      ))}
      {effect === "win" && <Confetti />}
    </div>
  );
}

const SWAP_MS = 110;

function Reel({ sun, open, stopMs }: { sun: boolean; open: boolean; stopMs: number }) {
  // shown: null = face down; tick restarts the slide-in animation on each swap
  const [state, setState] = useState<{ shown: boolean | null; tick: number; spinning: boolean }>({ shown: null, tick: 0, spinning: false });

  useEffect(() => {
    if (!open) { setState({ shown: null, tick: 0, spinning: false }); return; }
    let s = Math.random() < 0.5;
    let tick = 0;
    setState({ shown: s, tick, spinning: true });
    const iv = setInterval(() => { s = !s; setState({ shown: s, tick: ++tick, spinning: true }); }, SWAP_MS);
    const stop = setTimeout(() => {
      clearInterval(iv);
      setState({ shown: sun, tick: ++tick, spinning: false });
    }, stopMs);
    return () => { clearInterval(iv); clearTimeout(stop); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { shown, tick, spinning } = state;
  const face = shown === null ? "reel-back" : spinning ? "bg-card" : shown ? "face-sun" : "face-cloud";
  return (
    <div className={`reel size-24 sm:size-28 shadow-[var(--shadow-card)] ${face}`}>
      {shown !== null && (
        <div key={tick} className={spinning ? "reel-spin" : "reel-land"}>
          {shown ? <SunArt className="size-16" /> : <CloudArt className="size-16" />}
        </div>
      )}
    </div>
  );
}

export function Confetti() {
  const colors = ["var(--sun)", "var(--jistota)", "var(--prilezitost)", "var(--vrchol)"];
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return (
          <span key={i} className="confetti-bit" style={{ background: colors[i % 4], ["--dx" as string]: `${Math.cos(a) * 110}px`, ["--dy" as string]: `${Math.sin(a) * 80}px` }} />
        );
      })}
    </div>
  );
}
