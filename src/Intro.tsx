import { useEffect, useState } from "react";
import { config, type Variant } from "@/model/config";
import type { Settings } from "@/model/settings";
import { Cards } from "@/ui/Cards";
import { PrimaryButton } from "@/ui/Confirm";
import { Wheel } from "@/ui/Wheel";

type Props = { variant: Variant; settings: Settings; onPlay: () => void };

/** Title and short tutorial. No timer runs here; each variant starts its clock after "Hrát". */
export function Intro({ variant, settings, onPlay }: Props) {
  const vars: Record<string, number> = {
    attempts: settings.attempts, seconds: settings.attemptSeconds, start: settings.startPoints, rounds: settings.rounds,
    pickFirst: config.variant3.pickSeconds.first, pickNext: config.variant3.pickSeconds.next,
  };
  const steps = (config.tutorial[String(variant)] ?? []).map((s) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? "")));
  return (
    <div className="anim-rise my-auto grid gap-4 rounded-3xl bg-card/90 p-6 shadow-[var(--shadow-card)]">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold">{config.texts["title"]}</h1>
        <p className="mt-1 text-lg font-bold text-primary">{config.texts["intro"]}</p>
      </div>
      <Demo variant={variant} />
      <ol className="grid gap-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary font-extrabold text-primary-foreground">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <p className="font-bold">{config.texts["introGoal"]}</p>
      <p className="rounded-xl bg-accent p-3 text-center font-bold text-accent-foreground">{config.texts["introNoTime"]}</p>
      <PrimaryButton autoFocus onClick={onPlay}>{config.texts["play"]}</PrimaryButton>
    </div>
  );
}

const DEMO_CYCLE_MS = 4200;

/** Looping, non-interactive preview of how a round looks. */
function Demo({ variant }: { variant: Variant }) {
  const [cards, setCards] = useState<boolean[]>([true, false, true]);
  const [open, setOpen] = useState(false);
  const [rot, setRot] = useState(0);

  useEffect(() => {
    let hide: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      if (variant === 3) {
        setRot((r) => Math.ceil(r / 360) * 360 + 360 * 3 + Math.random() * 360);
        return;
      }
      setCards(Array.from({ length: variant === 1 ? 1 : 3 }, () => Math.random() < 0.5));
      setOpen(true);
      hide = setTimeout(() => setOpen(false), DEMO_CYCLE_MS - 1200);
    };
    const first = setTimeout(run, 500);
    const iv = setInterval(run, DEMO_CYCLE_MS);
    return () => { clearTimeout(first); clearInterval(iv); clearTimeout(hide); };
  }, [variant]);

  return (
    <div className="flex justify-center py-1" aria-hidden>
      {variant === 3
        ? <Wheel id="prilezitost" rotation={rot} spinMs={config.variant3.spinMs} className="size-44 drop-shadow-lg" />
        : <Cards cards={variant === 1 ? [cards[0]!] : cards} open={open} effect="none" />}
    </div>
  );
}
