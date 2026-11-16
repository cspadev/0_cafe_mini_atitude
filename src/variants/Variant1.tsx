import { useEffect, useRef, useState } from "react";
import { config, BUTTON_IDS, type ButtonId } from "@/model/config";
import { payoffV1 } from "@/model/payoffs";
import type { Rng } from "@/model/rng";
import type { Choice } from "@/model/scoring";
import type { AttemptResult } from "@/model/output";
import { Cards } from "@/ui/Cards";
import { ChoiceButtons } from "@/ui/ChoiceButtons";
import { Points, fmt } from "@/ui/Points";
import { Trail } from "@/ui/Scenery";
import { PrimaryButton } from "@/ui/Confirm";
import { sounds } from "@/ui/sound";
import { useChoiceKeys, useHint, revealMs } from "./common";

type Props = {
  attempts: number; seconds: number; startPoints: number; rng: Rng; order: ButtonId[];
  onRecord: (c: Choice) => void; onAttempt: (a: AttemptResult) => void; onDone: () => void;
};

/** Variant 1 (Originál): one card, timed attempts. */
export function Variant1({ attempts, seconds, startPoints, rng, order, onRecord, onAttempt, onDone }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [between, setBetween] = useState<number | null>(null);
  const [total, setTotal] = useState(startPoints);
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState(false);
  const [effect, setEffect] = useState<"none" | "win" | "loss">("none");
  const [clicks, setClicks] = useState(0);
  const deadline = useRef(0);
  const expired = useRef(false);
  const busyRef = useRef(false);
  const totalRef = useRef(startPoints);
  const clickNo = useRef(0);
  const roundStart = useRef(performance.now());
  const results = useRef<AttemptResult[]>([]);
  const playing = between === null;
  const hint = useHint(clicks + attempt * 1000, playing && !busy);

  const endAttempt = () => {
    const r = { attempt: attempt + 1, finalPoints: totalRef.current };
    results.current.push(r);
    onAttempt(r);
    setBetween(totalRef.current);
  };

  useEffect(() => {
    if (!playing) return;
    expired.current = false;
    deadline.current = performance.now() + seconds * 1000;
    roundStart.current = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const left = Math.max(0, (deadline.current - now) / 1000);
      setTimeLeft(left);
      if (left <= 0) {
        expired.current = true;
        if (!busyRef.current) endAttempt();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, playing]);

  const pick = (id: ButtonId) => {
    if (busyRef.current || !playing || expired.current) return;
    busyRef.current = true;
    setBusy(true);
    const reactionMs = Math.round(performance.now() - roundStart.current);
    const sun = rng() < 0.5;
    const { points, total: newTotal } = payoffV1(id, sun, totalRef.current);
    setCard(sun);
    setOpen(true);
    if (sun) sounds.sun(config.flipMs / 1000); else sounds.cloud(config.flipMs / 1000);
    setTimeout(() => {
      totalRef.current = newTotal;
      setTotal(newTotal);
      setEffect(points >= config.effects.bigWin ? "win" : points <= config.effects.bigLoss ? "loss" : "none");
      clickNo.current += 1;
      onRecord({ round: clickNo.current, attempt: attempt + 1, button: id, level: config.buttons[id].level, stars: sun ? 1 : 0, points, total: newTotal, reactionMs });
      setTimeout(() => {
        setOpen(false);
        setEffect("none");
        setTimeout(() => {
          busyRef.current = false;
          setBusy(false);
          setClicks((c) => c + 1);
          roundStart.current = performance.now();
          if (expired.current) endAttempt();
        }, 300);
      }, 400);
    }, revealMs(1));
  };

  useChoiceKeys(order, playing && !busy, pick);

  const payouts = Object.fromEntries(
    BUTTON_IDS.map((id) => {
      const p = config.variant1.payoffs[id];
      return [id, (
        <span key={id} className="mt-1 grid grid-cols-2 gap-1 text-xs">
          <span className="rounded-md bg-muted px-1 py-0.5 text-center">☀ <b>{fmt(p.sun)}</b></span>
          <span className="rounded-md bg-muted px-1 py-0.5 text-center">☁ <b>{p.cloud === "reset" ? "na 0" : fmt(p.cloud)}</b></span>
        </span>
      )];
    }),
  ) as Record<ButtonId, React.ReactNode>;

  if (between !== null) {
    const last = attempt + 1 >= attempts;
    const best = Math.max(...results.current.map((r) => r.finalPoints));
    return (
      <div className="anim-rise my-auto grid gap-4 rounded-3xl bg-card/90 p-6 text-center shadow-[var(--shadow-card)]">
        <Trail progress={(attempt + 1) / attempts} stages={attempts} />
        <h2 className="text-2xl font-extrabold">Pokus {attempt + 1} z {attempts}</h2>
        <p className="tabular text-4xl font-extrabold">{between} bodů</p>
        {last && <p className="text-muted-foreground">Nejlepší pokus: <b className="tabular">{best}</b> bodů</p>}
        <PrimaryButton autoFocus onClick={() => {
          if (last) return onDone();
          totalRef.current = startPoints;
          setTotal(startPoints);
          setTimeLeft(seconds);
          setAttempt((a) => a + 1);
          setBetween(null);
        }}>{config.texts["continue"]}</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Trail progress={attempt / attempts} stages={attempts} />
      <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
        <span>Pokus {attempt + 1} z {attempts}</span>
        <span className="tabular">{Math.ceil(timeLeft)} s</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-card/60">
        <div className="h-full bg-primary" style={{ width: `${(timeLeft / seconds) * 100}%` }} />
      </div>
      <Points value={total} label="Body" />
      <Cards cards={[card]} open={open} effect={effect} />
      <p className="h-6 text-center font-bold text-primary" aria-live="polite">{hint ? config.texts["hint"] : ""}</p>
      <div className="mt-auto">
        <ChoiceButtons order={order} disabled={busy} onPick={pick} payouts={payouts} />
      </div>
    </div>
  );
}
