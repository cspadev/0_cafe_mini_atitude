import { config, type ButtonId, type Scenario, type GameConfig } from "./config";

/** Variant 1: one card, sun or cloud. Returns new total. */
export function payoffV1(button: ButtonId, sun: boolean, total: number, cfg: GameConfig = config) {
  const p = cfg.variant1.payoffs[button];
  const v = sun ? p.sun : p.cloud;
  if (v === "reset") return { points: -total, total: 0 };
  return { points: v, total: total + v };
}

export function tableV2(scenario: Scenario, cfg: GameConfig = config) {
  return cfg.variant2.scenarios[scenario];
}

export function payoffV2(button: ButtonId, stars: number, scenario: Scenario, cfg: GameConfig = config) {
  return tableV2(scenario, cfg)[button][stars] ?? 0;
}

export function payoffV3(button: ButtonId, stars: number, cfg: GameConfig = config) {
  const l = cfg.variant3.linear[button];
  return l.base + l.rate * stars;
}

/** Payout per number of suns (0..3) for variants 2–3. */
export function payoutRow(variant: 2 | 3, button: ButtonId, scenario: Scenario, cfg: GameConfig = config): number[] {
  return [0, 1, 2, 3].map((s) => (variant === 2 ? payoffV2(button, s, scenario, cfg) : payoffV3(button, s, cfg)));
}

const BINOM = [1 / 8, 3 / 8, 3 / 8, 1 / 8];

/** Variant 3: points on each segment of a button's wheel. */
export function wheelValues(button: ButtonId, cfg: GameConfig = config): number[] {
  return cfg.variant3.wheelLayout.map((s) => payoffV3(button, s, cfg));
}

/** Variant 3: segment index (shared by all wheels) matching the drawn number of suns. */
export function wheelSegment(stars: number, rng: () => number, cfg: GameConfig = config): number {
  const idx = cfg.variant3.wheelLayout.flatMap((s, i) => (s === stars ? [i] : []));
  return idx[Math.floor(rng() * idx.length)]!;
}

export function stats(row: number[]) {
  const mean = row.reduce((s, v, i) => s + v * (BINOM[i] ?? 0), 0);
  const varc = row.reduce((s, v, i) => s + (v - mean) ** 2 * (BINOM[i] ?? 0), 0);
  return { mean, sd: Math.sqrt(varc) };
}
