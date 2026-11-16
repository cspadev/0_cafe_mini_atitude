import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { config, BUTTON_IDS, type ButtonId, type Variant } from "@/model/config";
import { mulberry32, shuffle, type Rng } from "@/model/rng";
import { parsePayload, resolveRounds, type Settings } from "@/model/settings";
import { buildQuiz, type QuizItem } from "@/model/quiz";
import { buildOutput, type AttemptResult } from "@/model/output";
import type { Answer, Choice } from "@/model/scoring";
import { Scenery } from "@/ui/Scenery";
import { Confirm } from "@/ui/Confirm";
import { Summary } from "@/ui/Summary";
import { setMuted, unlockAudio } from "@/ui/sound";
import { Intro } from "./Intro";
import { VariantMenu } from "./VariantMenu";
import { Transition } from "./Transition";
import { Quiz } from "./Quiz";
import { Variant1 } from "./variants/Variant1";
import { RoundsVariant } from "./variants/RoundsVariant";

type Phase = "loading" | "error" | "menu" | "intro" | "part1" | "trans1" | "quiz" | "trans2" | "summary";
type Proto = typeof import("./minihra-protokol");

type Run = {
  settings: Settings & { variant: Variant };
  rng: Rng; order: ButtonId[]; quiz: QuizItem[];
  choices: Choice[]; attempts: AttemptResult[]; answers: Answer[];
  part1Done: boolean; quizDone: boolean;
};

export function Game() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [runId, setRunId] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [muted, setMute] = useState(false);
  const proto = useRef<Proto | null>(null);
  const pending = useRef<Settings | null>(null);
  const run = useRef<Run | null>(null);

  const startRun = (s: Settings, variant: Variant, rawRounds: unknown) => {
    const rng = mulberry32(s.seed);
    const order = config.shuffleButtons ? shuffle(BUTTON_IDS, rng) : [...BUTTON_IDS];
    const quiz = buildQuiz(mulberry32(s.seed ^ 0x5bd1e995));
    run.current = {
      settings: { ...s, variant, rounds: resolveRounds(variant, rawRounds) },
      rng, order, quiz, choices: [], attempts: [], answers: [], part1Done: false, quizDone: false,
    };
    setRunId((n) => n + 1);
    setPhase("intro");
  };
  const rawRounds = useRef<unknown>(undefined);

  useEffect(() => {
    let alive = true;
    import("./minihra-protokol").then((m) => {
      if (!alive) return;
      proto.current = m;
      m.startMinihra((_level, payload) => {
        try {
          const r = parsePayload(payload);
          setConfirm(false);
          if (!r.ok) { m.fail("INVALID_PAYLOAD", r.message); setPhase("error"); return; }
          rawRounds.current = r.rawRounds;
          if (r.settings.variant === null) { pending.current = r.settings; run.current = null; setPhase("menu"); }
          else startRun(r.settings, r.settings.variant, r.rawRounds);
        } catch (e) {
          m.fail("INTERNAL", String(e));
          setPhase("error");
        }
      });
    });
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "intro") return;
    const h = (e: KeyboardEvent) => { if (e.key === "Enter" && document.activeElement === document.body) setPhase("part1"); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase]);

  const r = run.current;
  const output = () => r && buildOutput({
    variant: r.settings.variant, seed: r.settings.seed, buttonOrder: r.order, rounds: r.settings.rounds,
    choices: r.choices, part1Done: r.part1Done, attempts: r.attempts, answers: r.answers, quizDone: r.quizDone,
  });

  const content = (() => {
    switch (phase) {
      case "loading": return <p className="my-auto text-center text-xl font-bold">{config.texts["loading"]}</p>;
      case "error": return <p className="my-auto text-center text-xl font-bold">{config.texts["loadError"]}</p>;
      case "menu": return <VariantMenu onPick={(v) => pending.current && startRun(pending.current, v, rawRounds.current)} />;
      case "intro": return r && <Intro key={runId} variant={r.settings.variant} settings={r.settings} onPlay={() => setPhase("part1")} />;
      case "part1": {
        if (!r) return null;
        const s = r.settings;
        const done = () => { r.part1Done = true; setPhase("trans1"); };
        return s.variant === 1 ? (
          <Variant1 key={runId} attempts={s.attempts} seconds={s.attemptSeconds} startPoints={s.startPoints} rng={r.rng} order={r.order}
            onRecord={(c) => r.choices.push(c)} onAttempt={(a) => r.attempts.push(a)} onDone={done} />
        ) : (
          <RoundsVariant key={runId} variant={s.variant} rounds={s.rounds} startPoints={s.startPoints} scenario={s.scenario} rng={r.rng} order={r.order}
            onRecord={(c) => r.choices.push(c)} onDone={done} />
        );
      }
      case "trans1": return <Transition key={`t1${runId}`} text={config.texts["trans1a"]!} after={config.texts["trans1b"]!.replace("{sec}", String(r?.settings.quizTimeSec ?? config.quiz.timeSec))} onDone={() => setPhase("quiz")} />;
      case "quiz": return r && <Quiz key={runId} items={r.quiz} timeSec={r.settings.quizTimeSec} onAnswer={(a) => r.answers.push(a)} onDone={() => { r.quizDone = true; setPhase("trans2"); }} />;
      case "trans2": return <Transition key={`t2${runId}`} text={config.texts["trans2"]!} onDone={() => setPhase("summary")} />;
      case "summary": {
        const out = output();
        if (!out) return null;
        return <Summary finalScore={out.finalScore} choices={r!.choices} variant={r!.settings.variant} startPoints={r!.settings.startPoints}
          onContinue={() => proto.current?.finish(1, out)} />;
      }
    }
  })();

  const canGiveUp = phase === "part1" || phase === "quiz";
  return (
    <Scenery>
      <header className="mb-3 flex items-center justify-between gap-2">
        <button onClick={() => { setMute(!muted); setMuted(!muted); }} aria-label={muted ? "Zapnout zvuk" : "Vypnout zvuk"}
          className="grid size-11 place-items-center rounded-xl bg-card/80 focus-visible:ring-4 focus-visible:ring-ring">
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
        {canGiveUp && (
          <button onClick={() => setConfirm(true)} className="min-h-11 rounded-xl bg-card/80 px-4 font-bold focus-visible:ring-4 focus-visible:ring-ring">
            {config.texts["giveUp"]}
          </button>
        )}
      </header>
      {content}
      {confirm && canGiveUp && <Confirm onNo={() => setConfirm(false)} onYes={() => { setConfirm(false); setPhase("summary"); }} />}
    </Scenery>
  );
}
