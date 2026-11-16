// npm run calc – mean / SD of payout tables, analytic and simulated.
import { config, BUTTON_IDS } from "../src/model/config";
import { payoutRow, stats } from "../src/model/payoffs";
import { mulberry32 } from "../src/model/rng";

const rng = mulberry32(42);
for (const [name, variant, scenario] of [["V2 scénář A", 2, "A"], ["V2 scénář B", 2, "B"], ["V3", 3, "B"]] as const) {
  const rounds = variant === 3 ? config.variant3.rounds : config.variant2.rounds;
  console.log(`\n${name}`);
  const means: number[] = [];
  for (const id of BUTTON_IDS) {
    const row = payoutRow(variant, id, scenario);
    const a = stats(row);
    let sum = 0, sq = 0, below = 0;
    const N = 100_000;
    for (let g = 0; g < N; g++) {
      let total = config.startPoints;
      for (let r = 0; r < rounds; r++) {
        let s = 0; for (let k = 0; k < 3; k++) if (rng() < 0.5) s++;
        const v = row[s]!; sum += v; sq += v * v; total += v;
      }
      if (total < 0) below++;
    }
    const n = N * rounds, m = sum / n;
    means.push(a.mean);
    console.log(`${id.padEnd(12)} EV ${a.mean.toFixed(2)} SD ${a.sd.toFixed(1)} | sim EV ${m.toFixed(2)} SD ${Math.sqrt(sq / n - m * m).toFixed(1)} | pod nulou ${(below / N * 100).toFixed(1)} %`);
  }
  if (Math.max(...means) - Math.min(...means) > 0.5) console.log("Pozor: střední hodnoty se liší o víc než 0,5 bodu.");
}
