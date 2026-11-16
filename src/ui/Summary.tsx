import { config, type ButtonId } from "@/model/config";
import { profileFor, type Choice } from "@/model/scoring";
import { ProfileIcon, CHOICE_STYLE } from "./art";
import { PrimaryButton } from "./Confirm";

type Props = { finalScore: number | null; choices: Choice[]; variant: number; startPoints: number; onContinue: () => void };

export function Summary({ finalScore, choices, variant, startPoints, onContinue }: Props) {
  const p = profileFor(finalScore);
  return (
    <div className="anim-rise my-auto grid gap-4 rounded-3xl bg-card/95 p-5 shadow-[var(--shadow-card)]">
      {p && finalScore !== null ? (
        <>
          <div className="text-center">
            <ProfileIcon icon={p.icon} className="mx-auto size-14 text-vrchol" />
            <h1 className="mt-2 text-3xl font-extrabold">{p.name}</h1>
            <p className="font-bold text-primary">„{p.motto}“</p>
          </div>
          <p className="font-bold">{p.intro}</p>
          <p>{p.description}</p>
          <Gauge value={finalScore} />
          {variant !== 1 && choices.length > 0 && (
            <>
              <h2 className="text-lg font-extrabold">Tvá cesta</h2>
              <PathChart choices={choices} start={startPoints} />
              <Shares choices={choices} />
              <p className="rounded-xl bg-accent p-3 text-accent-foreground">{config.texts["funFact"]}</p>
            </>
          )}
        </>
      ) : (
        <p className="py-6 text-center text-lg font-bold">{config.texts["noData"]}</p>
      )}
      <PrimaryButton autoFocus onClick={onContinue}>{config.texts["continue"]}</PrimaryButton>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  return (
    <div>
      <div className="relative flex h-4 overflow-hidden rounded-full">
        <div className="bg-jistota" style={{ width: "41%" }} />
        <div className="bg-prilezitost" style={{ width: "19%" }} />
        <div className="bg-vrchol" style={{ width: "40%" }} />
        <div className="absolute top-[-4px] h-6 w-1.5 -translate-x-1/2 rounded bg-foreground" style={{ left: `${value}%` }} />
      </div>
      <div className="tabular mt-1 flex justify-between text-xs text-muted-foreground"><span>0</span><b className="text-foreground">{value}</b><span>100</span></div>
    </div>
  );
}

function PathChart({ choices, start }: { choices: Choice[]; start: number }) {
  const vals = [start, ...choices.map((c) => c.total)];
  const min = Math.min(...vals), max = Math.max(...vals);
  const W = 300, H = 120, pad = 8;
  const x = (i: number) => pad + (i / Math.max(1, vals.length - 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - ((v - min) / Math.max(1, max - min)) * (H - 2 * pad);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl bg-muted" role="img" aria-label="Průběh bodů">
      <polyline fill="none" stroke="var(--muted-foreground)" strokeWidth="2" points={vals.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
      {choices.map((c, i) => <circle key={i} cx={x(i + 1)} cy={y(c.total)} r="4" fill={CHOICE_STYLE[c.button as ButtonId]?.fill} />)}
    </svg>
  );
}

function Shares({ choices }: { choices: Choice[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center text-sm">
      {(["jistota", "prilezitost", "vrchol"] as ButtonId[]).map((id) => (
        <div key={id} className={`rounded-xl p-2 ${CHOICE_STYLE[id].soft}`}>
          <div className={`font-extrabold ${CHOICE_STYLE[id].text}`}>{config.buttons[id].label}</div>
          <div className="tabular font-bold">{Math.round((choices.filter((c) => c.button === id).length / choices.length) * 100)} %</div>
        </div>
      ))}
    </div>
  );
}
