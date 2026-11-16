import type { ButtonId, Variant } from "./config";
import { finalScore, gameScore, profileFor, quizScore, type Answer, type Choice } from "./scoring";

export type AttemptResult = { attempt: number; finalPoints: number };

export type RunData = {
  variant: Variant;
  seed: number;
  buttonOrder: ButtonId[];
  rounds: number;
  choices: Choice[];
  part1Done: boolean;
  attempts?: AttemptResult[];
  answers: Answer[];
  quizDone: boolean;
};

export function buildOutput(d: RunData) {
  const completed = d.part1Done && d.quizDone;
  const g = gameScore(d.variant, d.choices, d.part1Done);
  const q = quizScore(d.answers, d.quizDone);
  const final = finalScore(g.game, q);
  const profile = profileFor(final);
  const n = d.choices.length;
  const share = (id: string) => (n ? Math.round((d.choices.filter((c) => c.button === id).length / n) * 100) / 100 : 0);
  const part1: Record<string, unknown> = {
    rounds: d.variant === 1 ? n : d.rounds,
    riskScore: g.risk,
    recoveryScore: g.recovery,
    gameScore: g.game,
    share: { jistota: share("jistota"), prilezitost: share("prilezitost"), vrchol: share("vrchol") },
    finalPoints: d.choices.at(-1)?.total ?? null,
    choices: d.choices,
  };
  if (d.variant === 1) {
    const att = d.attempts ?? [];
    part1["attempts"] = att;
    part1["maxPoints"] = att.length ? Math.max(...att.map((a) => a.finalPoints)) : null;
  }
  return {
    variant: d.variant,
    completed: completed && final !== null,
    seed: d.seed,
    buttonOrder: d.buttonOrder,
    part1,
    quiz: { score: q, answered: d.answers.filter((a) => a.value !== null).length, answers: d.answers },
    finalScore: final,
    profile: profile ? profile.id : null,
  };
}
