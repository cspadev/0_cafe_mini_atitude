// npm run simulate – artificial players and their scores (variant 3).
import { config, BUTTON_IDS } from "../src/model/config";
import { balanced } from "../src/model/sequence";
import { mulberry32 } from "../src/model/rng";
import { payoffV3 } from "../src/model/payoffs";
import { gameScore, isAdverse, type Choice } from "../src/model/scoring";

type Bot = (prevStars: number | null, rng: () => number) => number;
const bots: Record<string, Bot> = {
  "vždy Jistota": () => 0,
  "vždy Vrchol": () => 2,
  "náhodný": (_p, r) => Math.floor(r() * 3),
  "po ☁ víc": (p, r) => (p !== null && isAdverse(3, p) ? 2 : Math.floor(r() * 2)),
  "po ☁ míň": (p, r) => (p !== null && isAdverse(3, p) ? 0 : 1 + Math.floor(r() * 2)),
};
for (const [name, bot] of Object.entries(bots)) {
  let risk = 0, rec = 0; const N = 2000;
  for (let g = 0; g < N; g++) {
    const rng = mulberry32(g + 1);
    let total = config.startPoints; let prev: number | null = null;
    const choices: Choice[] = balanced(config.variant3.rounds, rng).map((d, i) => {
      const level = bot(prev, rng); const id = BUTTON_IDS[level]!;
      const points = payoffV3(id, d.stars); total += points; prev = d.stars;
      return { round: i + 1, button: id, level, stars: d.stars, points, total, reactionMs: 0 };
    });
    const s = gameScore(3, choices, true); risk += s.risk ?? 0; rec += s.recovery ?? 0;
  }
  console.log(`${name.padEnd(14)} risk ${(risk / N).toFixed(1)}  recovery ${(rec / N).toFixed(1)}`);
}
