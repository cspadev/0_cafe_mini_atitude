import { useEffect, useRef, useState } from "react";
import type { QuizItem } from "@/model/quiz";
import type { Answer } from "@/model/scoring";
import { sounds } from "@/ui/sound";

type Props = { items: QuizItem[]; timeSec: number; onAnswer: (a: Answer) => void; onDone: () => void };

export function Quiz({ items, timeSec, onAnswer, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(timeSec);
  const done = useRef(false);
  const item = items[idx];

  const answer = (a: Answer) => {
    if (done.current) return;
    done.current = true;
    onAnswer(a);
    setTimeout(() => {
      if (idx + 1 >= items.length) return onDone();
      setIdx(idx + 1);
    }, 250);
  };

  useEffect(() => {
    if (!item) return;
    done.current = false;
    const end = performance.now() + timeSec * 1000;
    let lastTick = -1;
    let raf = 0;
    const loop = (now: number) => {
      const l = Math.max(0, (end - now) / 1000);
      setLeft(l);
      if (l <= 3 && l > 0) {
        const step = Math.floor(l * (l <= 1.5 ? 4 : 2));
        if (step !== lastTick) { lastTick = step; sounds.tick(l <= 1.5); }
      }
      if (l <= 0) return answer({ question: item.question, choiceId: null, value: null, timedOut: true });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      const i = { A: 0, B: 1, C: 2, "1": 0, "2": 1, "3": 2 }[k];
      const o = i === undefined ? undefined : item?.options[i];
      if (o && item) answer({ question: item.question, choiceId: o.choiceId, value: o.value, timedOut: false });
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  if (!item) return null;
  const urgent = left <= 3;
  return (
    <div key={idx} className="anim-rise my-auto grid gap-4">
      <div className="text-center text-sm font-bold text-muted-foreground">Otázka {idx + 1} / {items.length}</div>
      <div className="h-3 overflow-hidden rounded-full bg-card/70" role="progressbar" aria-valuenow={Math.ceil(left)} aria-valuemax={timeSec}>
        <div className={`h-full ${urgent ? "bg-vrchol" : "bg-jistota"}`} style={{ width: `${(left / timeSec) * 100}%` }} />
      </div>
      <h2 className="rounded-2xl bg-card/90 p-5 text-xl font-extrabold shadow-[var(--shadow-card)]">{item.text}</h2>
      {item.options.map((o, i) => (
        <button key={o.choiceId} onClick={() => answer({ question: item.question, choiceId: o.choiceId, value: o.value, timedOut: false })}
          className="flex min-h-14 items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary font-extrabold">{"ABC"[i]}</span>
          <span>{o.text}</span>
        </button>
      ))}
    </div>
  );
}
