import { config, type GameConfig, type Profile } from "./config";

export type Choice = {
  round: number; button: string; level: number; stars: number; points: number; total: number; reactionMs: number;
  attempt?: number;
};

export const clamp100 = (v: number) => Math.min(100, Math.max(0, Math.round(v)));

/** Adverse result: variant 1 = cloud, variants 2–3 = at most one sun. */
export function isAdverse(variant: number, stars: number) {
  return variant === 1 ? stars === 0 : stars <= 1;
}

function levelScore(levels: number[]) {
  if (levels.length === 0) return null;
  return clamp100((levels.reduce((s, v) => s + v, 0) / levels.length / 2) * 100);
}

export function riskScore(choices: Choice[]) {
  return levelScore(choices.map((c) => c.level));
}

export function recoveryScore(variant: number, choices: Choice[], cfg: GameConfig = config) {
  const after: number[] = [];
  for (let i = 1; i < choices.length; i++) {
    const prev = choices[i - 1]!;
    const cur = choices[i]!;
    if ((prev.attempt ?? 0) !== (cur.attempt ?? 0)) continue;
    if (isAdverse(variant, prev.stars)) after.push(cur.level);
  }
  if (after.length < cfg.scoring.minRecoveryRounds) return riskScore(choices);
  return levelScore(after);
}

export function gameScore(variant: number, choices: Choice[], completed: boolean, cfg: GameConfig = config) {
  const risk = riskScore(choices);
  const recovery = recoveryScore(variant, choices, cfg);
  const enough = completed ? choices.length > 0 : choices.length >= cfg.scoring.minRoundsIncomplete;
  if (!enough || risk === null || recovery === null) return { risk, recovery, game: null as number | null };
  const s = cfg.scoring;
  return { risk, recovery, game: clamp100(s.gameRiskWeight * risk + s.gameRecoveryWeight * recovery) };
}

export type Answer = { question: number; choiceId: string | null; value: number | null; timedOut: boolean };

/** Quiz score; with no answered question returns 50 if quiz finished, else null. */
export function quizScore(answers: Answer[], quizFinished: boolean, cfg: GameConfig = config) {
  const answered = answers.filter((a) => a.value !== null);
  if (answered.length === 0) return quizFinished ? cfg.scoring.quizNoAnswerScore : null;
  const sum = answered.reduce((s, a) => s + (a.value ?? 0), 0);
  return clamp100((sum / (2 * answered.length)) * 100);
}

export function finalScore(game: number | null, quiz: number | null, cfg: GameConfig = config) {
  const s = cfg.scoring;
  const parts: [number, number][] = [];
  if (game !== null) parts.push([game, s.finalGameWeight]);
  if (quiz !== null) parts.push([quiz, s.finalQuizWeight]);
  if (parts.length === 0) return null;
  const w = parts.reduce((a, [, wt]) => a + wt, 0);
  return clamp100(parts.reduce((a, [v, wt]) => a + v * wt, 0) / w);
}

export function profileFor(score: number | null, cfg: GameConfig = config): Profile | null {
  if (score === null) return null;
  return cfg.profiles.find((p) => score <= p.max) ?? cfg.profiles[cfg.profiles.length - 1] ?? null;
}
