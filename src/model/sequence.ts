import { shuffle, type Rng } from "./rng";

export type Draw = { stars: number; cards: boolean[] };

/** Random card layout for a given number of suns. */
export function layout(stars: number, count: number, rng: Rng): boolean[] {
  const cards = Array.from({ length: count }, (_, i) => i < stars);
  return shuffle(cards, rng);
}

/** Independent draws: each card is a sun with 50 %. */
export function independent(rounds: number, cardCount: number, rng: Rng): Draw[] {
  return Array.from({ length: rounds }, () => {
    const cards = Array.from({ length: cardCount }, () => rng() < 0.5);
    return { stars: cards.filter(Boolean).length, cards };
  });
}

const BLOCK = [3, 2, 2, 2, 1, 1, 1, 0];

function longestRunOk(seq: number[], maxRun: number) {
  let run = 1;
  for (let i = 1; i < seq.length; i++) {
    run = seq[i] === seq[i - 1] ? run + 1 : 1;
    if (run > maxRun) return false;
  }
  return true;
}

/** Balanced draws: blocks of 8 with exactly 1×3, 3×2, 3×1, 1×0 suns. */
export function balancedStars(rounds: number, rng: Rng, maxRun = 3): number[] {
  const blocks = Math.ceil(rounds / BLOCK.length);
  const out: number[] = [];
  for (let b = 0; b < blocks; b++) {
    let block: number[] = [];
    for (let tries = 0; tries < 1000; tries++) {
      block = shuffle(BLOCK, rng);
      const candidate = [...out, ...block];
      if (b === 0 && block[0] === 3) continue;
      if (longestRunOk(candidate, maxRun)) break;
    }
    out.push(...block);
  }
  return out.slice(0, rounds);
}

export function balanced(rounds: number, rng: Rng, maxRun = 3): Draw[] {
  return balancedStars(rounds, rng, maxRun).map((stars) => ({ stars, cards: layout(stars, 3, rng) }));
}
