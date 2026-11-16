import { config, type GameConfig, type Scenario, type Variant } from "./config";
import { randomSeed } from "./rng";

export type Settings = {
  variant: Variant | null;
  rounds: number;
  attempts: number;
  attemptSeconds: number;
  startPoints: number;
  scenario: Scenario;
  quizTimeSec: number;
  seed: number;
};

export type ParseResult = { ok: true; settings: Settings; rawRounds: unknown } | { ok: false; message: string };

const intIn = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : undefined;

/** Validates payload; invalid single values fall back to defaults. */
export function parsePayload(payload: unknown, cfg: GameConfig = config, makeSeed = randomSeed): ParseResult {
  if (payload !== undefined && payload !== null && (typeof payload !== "object" || Array.isArray(payload))) {
    return { ok: false, message: "payload must be an object" };
  }
  const p = (payload ?? {}) as Record<string, unknown>;
  const variant = (intIn(p["variant"], 1, 3) ?? cfg.defaultVariant ?? null) as Variant | null;
  const seed = typeof p["seed"] === "number" && Number.isInteger(p["seed"]) ? (p["seed"] as number) : makeSeed();
  const scenario = p["scenario"] === "A" || p["scenario"] === "B" ? (p["scenario"] as Scenario) : cfg.variant2.scenario;
  return {
    ok: true,
    rawRounds: p["rounds"],
    settings: {
      variant,
      rounds: resolveRounds(variant, p["rounds"], cfg),
      attempts: intIn(p["attempts"], 1, 5) ?? cfg.variant1.attempts,
      attemptSeconds: intIn(p["attemptSeconds"], 15, 180) ?? cfg.variant1.attemptSeconds,
      startPoints: intIn(p["startPoints"], 0, 1000) ?? cfg.startPoints,
      scenario,
      quizTimeSec: intIn(p["quizTimeSec"], 3, 60) ?? cfg.quiz.timeSec,
      seed,
    },
  };
}

export function resolveRounds(variant: Variant | null, raw: unknown, cfg: GameConfig = config) {
  const r = intIn(raw, 4, 48);
  if (variant === 3) return cfg.variant3.rounds;
  return r ?? cfg.variant2.rounds;
}
