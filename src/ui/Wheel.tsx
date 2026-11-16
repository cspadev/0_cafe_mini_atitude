import { config, type ButtonId } from "@/model/config";
import { wheelValues } from "@/model/payoffs";
import { Confetti } from "./Cards";
import { ButtonIcon, CHOICE_STYLE } from "./art";
import { fmt } from "./Points";

const R = 90;

function pt(deg: number, r: number) {
  const a = (deg * Math.PI) / 180;
  return `${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)}`;
}

function segmentFill(v: number) {
  if (v < 0) return "color-mix(in oklch, var(--destructive) 55%, white)";
  if (v === 0) return "var(--cloud-bg)";
  return v >= config.effects.bigWin ? "var(--sun)" : "var(--sun-glow)";
}

type WheelProps = { id: ButtonId; rotation?: number; spinMs?: number; labels?: boolean; winIndex?: number | undefined; className?: string };

/** One wheel of fortune; rotation is cumulative degrees (clockwise). Only the disc rotates. */
export function Wheel({ id, rotation = 0, spinMs = 0, labels = true, winIndex, className = "" }: WheelProps) {
  const values = wheelValues(id);
  const step = 360 / values.length;
  return (
    <div className={`relative ${className}`} role="img" aria-label={`Kotouč: ${config.buttons[id].label}`}>
      <div
        className="absolute inset-0"
        style={{ transform: `rotate(${rotation}deg)`, transition: spinMs ? `transform ${spinMs}ms cubic-bezier(.12,.6,.1,1)` : "none" }}
      >
        <svg viewBox="-100 -100 200 200" className="size-full">
          {values.map((v, i) => (
            <path
              key={i}
              d={`M0 0 L${pt(i * step, R)} A${R} ${R} 0 0 1 ${pt((i + 1) * step, R)} Z`}
              fill={segmentFill(v)}
              stroke={i === winIndex ? "var(--foreground)" : "var(--card)"}
              strokeWidth={i === winIndex ? 4 : 2}
              strokeLinejoin="round"
            />
          ))}
          {labels && values.map((v, i) => (
            <text
              key={i}
              transform={`rotate(${(i + 0.5) * step}) translate(0 -62)`}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="17"
              fontWeight="800"
              fill="var(--foreground)"
            >
              {fmt(v)}
            </text>
          ))}
        </svg>
      </div>
      <svg viewBox="-100 -100 200 200" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
        <circle r={R + 3} fill="none" stroke={CHOICE_STYLE[id].fill} strokeWidth="7" />
        <circle r="17" fill={CHOICE_STYLE[id].fill} stroke="var(--card)" strokeWidth="3" />
        <svg x="-12" y="-12" width="24" height="24" viewBox="0 0 24 24" style={{ color: "var(--on-choice)" }}>
          <ButtonIcon id={id} className="" />
        </svg>
        <path d="M-9 -100 L9 -100 L0 -78 Z" fill="var(--foreground)" stroke="var(--card)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export type Spin = { id: ButtonId; target: number; winIndex: number; points: number };

type StageProps = {
  order: ButtonId[]; selected: ButtonId | null; spin: Spin | null; settled: boolean; effect: "none" | "win" | "loss";
  onSelect: (id: ButtonId) => void; onSpin: () => void;
};

/** Small wheels to browse; the selected one is shown whole and spins (locking the choice) when clicked. */
export function WheelStage({ order, selected, spin, settled, effect, onSelect, onSpin }: StageProps) {
  const shown = spin?.id ?? selected;
  return (
    <div className={`relative flex h-64 items-center justify-center sm:h-72 ${effect === "win" ? "anim-pop" : effect === "loss" ? "anim-shake" : ""}`}>
      {shown ? (
        <div key={shown} className="anim-rise relative flex flex-col items-center gap-1">
          <button
            type="button"
            disabled={!!spin}
            onClick={onSpin}
            aria-label={config.texts["spinHint"]}
            className="rounded-full drop-shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring enabled:cursor-pointer enabled:hover:scale-105 enabled:motion-safe:animate-pulse disabled:cursor-default"
          >
            <Wheel
              id={shown}
              rotation={spin ? spin.target : 0}
              spinMs={config.variant3.spinMs}
              winIndex={settled ? spin?.winIndex : undefined}
              className="size-52 sm:size-60"
            />
          </button>
          <div className="tabular flex h-8 items-center rounded-full bg-card/90 px-4 text-lg font-extrabold shadow-[var(--shadow-card)]" aria-live="polite">
            {spin ? (settled ? fmt(spin.points) : "…") : config.texts["spinHint"]}
          </div>
        </div>
      ) : (
        <div className="flex w-full justify-center gap-2">
          {order.map((id) => (
            <button key={id} type="button" onClick={() => onSelect(id)} aria-label={config.buttons[id].label} className="min-w-0 max-w-32 flex-1 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring">
              <Wheel id={id} labels={false} className="aspect-square w-full drop-shadow-md" />
            </button>
          ))}
        </div>
      )}
      {effect === "win" && <Confetti />}
    </div>
  );
}
