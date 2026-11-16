import { useEffect, useMemo, useRef, useState } from "react";
import { config, BUTTON_IDS, type ButtonId, type Scenario } from "@/model/config";
import { payoffV2, payoffV3Points, payoutRow, wheelSegment } from "@/model/payoffs";
import { balanced, independent, type Draw } from "@/model/sequence";
import type { Rng } from "@/model/rng";
import type { Choice } from "@/model/scoring";
import { Cards } from "@/ui/Cards";
import { WheelStage, type Spin } from "@/ui/Wheel";
import { ChoiceButtons } from "@/ui/ChoiceButtons";
import { Points, fmt } from "@/ui/Points";
import { Trail } from "@/ui/Scenery";
import { sounds } from "@/ui/sound";
import { useChoiceKeys, useHint, revealMs } from "./common";

type Props = {
  variant: 2 | 3; rounds: number; startPoints: number; scenario: Scenario; rng: Rng; order: ButtonId[];
  onRecord: (c: Choice) => void; onDone: () => void;
};

type Pending = { id: ButtonId; d: Draw; points: number; reactionMs: number };

/** Variant 2 (MJ): three reels. Variant 3 (Vyvážená): browse wheels, click the shown wheel to lock and spin it. */
export function RoundsVariant({ variant, rounds, startPoints, scenario, rng, order, onRecord, onDone }: Props) {
  const draws = useMemo(
    () => (variant === 3 ? balanced(rounds, rng, config.variant3.maxRun) : independent(rounds, 3, rng)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  // Wheel segment per round; every wheel lands on the same index, so the stars stay the same.
  const segments = useMemo(
    () => (variant === 3 ? draws.map((d) => wheelSegment(d.stars, rng)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [round, setRound] = useState(0);
  const [total, setTotal] = useState(startPoints);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cards, setCards] = useState<boolean[]>([false, false, false]);
  const [spin, setSpin] = useState<Spin | null>(null);
  const [rotations, setRotations] = useState<Record<ButtonId, number>>({ jistota: 0, prilezitost: 0, vrchol: 0 });
  const [settled, setSettled] = useState(false);
  const [effect, setEffect] = useState<"none" | "win" | "loss">("none");
  const [timeLeft, setTimeLeft] = useState(0);
  const roundStart = useRef(performance.now());
  const hint = useHint(round, variant === 2 && !busy);
  const pickLimit = round === 0 ? config.variant3.pickSeconds.first : config.variant3.pickSeconds.next;

  const reveal = (p: Pending, delayMs: number) => {
    setTimeout(() => {
      const newTotal = total + p.points;
      setTotal(newTotal);
      setSettled(true);
      if (variant === 3) { if (p.points > 0) sounds.sun(); else sounds.cloud(); }
      setEffect(p.points >= config.effects.bigWin ? "win" : p.points <= config.effects.bigLoss ? "loss" : "none");
      onRecord({ round: round + 1, button: p.id, level: config.buttons[p.id].level, stars: p.d.stars, points: p.points, total: newTotal, reactionMs: p.reactionMs });
      setTimeout(() => {
        setOpen(false);
        setSpin(null);
        setSettled(false);
        setEffect("none");
        const next = round + 1;
        setTimeout(() => {
          setBusy(false);
          if (next >= rounds) return onDone();
          setRound(next);
          roundStart.current = performance.now();
        }, 350);
      }, variant === 3 ? 1200 : 750);
    }, delayMs);
  };

  const pick = (id: ButtonId) => {
    if (busy || round >= rounds) return;
    const reactionMs = Math.round(performance.now() - roundStart.current);
    const d = draws[round]!;
    const points = variant === 2 ? payoffV2(id, d.stars, scenario) : payoffV3Points(id, d.stars, total);
    setBusy(true);
    if (variant === 3) {
      const seg = segments[round]!;
      const segDeg = 360 / config.variant3.wheelLayout.length;
      const jitter = (Math.random() - 0.5) * segDeg * 0.6;
      const previous = rotations[id];
      const destination = -(seg + 0.5) * segDeg + jitter;
      const target = previous + 360 * 5 + ((destination - previous) % 360 + 360) % 360;
      setRotations({ ...rotations, [id]: target });
      setSpin({ id, winIndex: seg, points, target });
      reveal({ id, d, points, reactionMs }, config.variant3.spinMs + 300);
      return;
    }
    setCards(d.cards);
    setOpen(true);
    d.cards.forEach((s, i) => {
      const delay = (config.flipMs + i * config.flipStaggerMs) / 1000;
      if (s) sounds.sun(delay); else sounds.cloud(delay);
    });
    reveal({ id, d, points, reactionMs }, revealMs(3));
  };

  // Wheel choice is timed; on timeout a random wheel spins.
  const timeoutRef = useRef(() => {});
  timeoutRef.current = () => pick(BUTTON_IDS[Math.floor(Math.random() * BUTTON_IDS.length)]!);
  useEffect(() => {
    if (variant !== 3 || busy) return;
    const end = performance.now() + pickLimit * 1000;
    let raf = 0;
    const loop = (now: number) => {
      const left = Math.max(0, (end - now) / 1000);
      setTimeLeft(left);
      if (left <= 0) return timeoutRef.current();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [variant, busy, round, pickLimit]);

  useChoiceKeys(order, !busy, pick);

  const payouts = Object.fromEntries(
    BUTTON_IDS.map((id) => [id, <PayoutGrid key={id} row={payoutRow(variant, id, scenario)} wheel={false} />]),
  ) as Record<ButtonId, React.ReactNode>;

  const timing = variant === 3 && !busy;
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Trail progress={round / rounds} stages={1} />
      <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
        <span className="tabular">Kolo {Math.min(round + 1, rounds)} / {rounds}</span>
        {variant === 3 && <span className={`tabular ${timing ? "" : "invisible"}`}>{Math.ceil(timeLeft)} s</span>}
      </div>
      {variant === 3 && (
        <div className={`h-2 overflow-hidden rounded-full bg-card/60 ${timing ? "" : "invisible"}`}>
          <div className={`h-full ${timeLeft <= 3 ? "bg-vrchol" : "bg-primary"}`} style={{ width: `${(timeLeft / pickLimit) * 100}%` }} />
        </div>
      )}
      <Points value={total} label="Body" />
      {variant === 3
        ? <WheelStage order={order} rotations={rotations} spin={spin} settled={settled} effect={effect} onSpin={pick} />
        : <Cards cards={cards} open={open} effect={effect} />}
      <p className="h-6 text-center font-bold text-primary" aria-live="polite">
        {variant === 2 ? (hint ? config.texts["hint"] : "") : (timing ? config.texts["pickWheel"] : "")}
      </p>
      {variant === 2 && (
        <div className="mt-auto">
          <ChoiceButtons order={order} disabled={busy} onPick={pick} payouts={payouts} />
        </div>
      )}
    </div>
  );
}

function PayoutGrid({ row, wheel }: { row: number[]; wheel: boolean }) {
  if (wheel) {
    // Segments per value on the wheel (wheelLayout counts of 0..3 suns).
    const counts = [0, 1, 2, 3].map((s) => config.variant3.wheelLayout.filter((x) => x === s).length);
    return (
      <span className="mt-1 grid grid-cols-4 gap-1 text-xs">
        {[0, 1, 2, 3].map((s) => (
          <span key={s} className="rounded-md bg-muted px-1 py-0.5 text-center">
            <b>{fmt(row[s] ?? 0)}</b> <span className="text-muted-foreground" aria-label={`${counts[s]} výsečí`}>×{counts[s]}</span>
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="mt-1 grid grid-cols-4 gap-1 text-xs">
      {[3, 2, 1, 0].map((s) => (
        <span key={s} className="rounded-md bg-muted px-1 py-0.5 text-center">
          <span aria-label={`${s} slunce`}>{s}☀</span> <b>{fmt(row[s] ?? 0)}</b>
        </span>
      ))}
    </span>
  );
}
