import { config, type ButtonId } from "@/model/config";
import { isResetV3, wheelValues } from "@/model/payoffs";
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
              fill={isResetV3(id, config.variant3.wheelLayout[i]!) ? "var(--destructive)" : segmentFill(v)}
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
              fontSize={isResetV3(id, config.variant3.wheelLayout[i]!) ? "15" : "17"}
              fontWeight="800"
              fill={isResetV3(id, config.variant3.wheelLayout[i]!) ? "var(--destructive-foreground)" : "var(--foreground)"}
            >
              {isResetV3(id, config.variant3.wheelLayout[i]!) ? "NA 0" : fmt(v)}
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
  order: ButtonId[]; rotations: Record<ButtonId, number>; spin: Spin | null; settled: boolean; effect: "none" | "win" | "loss";
  onSpin: (id: ButtonId) => void;
};

/** All wheels fully visible; clicking one locks the choice and spins it immediately. */
export function WheelStage({ order, rotations, spin, settled, effect, onSpin }: StageProps) {
  return (
    <div className={`relative flex items-start justify-center gap-2 py-2 ${effect === "win" ? "anim-pop" : effect === "loss" ? "anim-shake" : ""}`}>
      {order.map((id) => {
        const mine = spin?.id === id;
        return (
          <div key={id} className={`flex min-w-0 max-w-52 flex-1 flex-col items-center gap-1 transition-opacity ${spin && !mine ? "opacity-40" : ""}`}>
            <button
              type="button"
              disabled={!!spin}
              onClick={() => onSpin(id)}
              aria-label={config.buttons[id].label}
              className="w-full rounded-full drop-shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring enabled:cursor-pointer enabled:hover:scale-105 disabled:cursor-default"
            >
              <Wheel
                id={id}
                rotation={rotations[id]}
                spinMs={config.variant3.spinMs}
                winIndex={mine && settled ? spin.winIndex : undefined}
                className="aspect-square w-full"
              />
            </button>
            <div className="tabular flex h-8 items-center rounded-full bg-card/90 px-3 text-sm font-extrabold shadow-[var(--shadow-card)]" aria-live="polite">
              {mine ? (settled ? fmt(spin.points) : "…") : config.buttons[id].label}
            </div>
          </div>
        );
      })}
      {effect === "win" && <Confetti />}
    </div>
  );
}
