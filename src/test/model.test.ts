import { describe, expect, it } from "vitest";
import { BUTTON_IDS } from "@/model/config";
import { payoffV3, payoutRow, stats, wheelSegment, wheelValues } from "@/model/payoffs";
import { balancedStars } from "@/model/sequence";
import { mulberry32 } from "@/model/rng";
import { finalScore, gameScore, profileFor, quizScore, recoveryScore, type Choice } from "@/model/scoring";
import { buildQuiz } from "@/model/quiz";
import { parsePayload } from "@/model/settings";
import { buildOutput } from "@/model/output";

const ch = (level: number, stars: number): Choice => ({ round: 1, button: BUTTON_IDS[level]!, level, stars, points: 0, total: 0, reactionMs: 1 });

describe("variant 3", () => {
  it("all buttons have mean exactly 6.0", () => {
    for (const id of BUTTON_IDS) expect(stats(payoutRow(3, id, "B")).mean).toBe(6);
  });
  it("wheels have mean 6 and the drawn segment pays the drawn stars", () => {
    for (const id of BUTTON_IDS) {
      const v = wheelValues(id);
      expect(v.reduce((a, b) => a + b, 0) / v.length).toBe(6);
      for (let stars = 0; stars < 4; stars++) {
        const seg = wheelSegment(stars, mulberry32(stars + 1));
        expect(v[seg]).toBe(payoffV3(id, stars));
      }
    }
  });
  it("balanced blocks 1:3:3:1, no run > 3, first not 3, deterministic", () => {
    for (let seed = 1; seed < 200; seed++) {
      const s = balancedStars(24, mulberry32(seed));
      expect(s[0]).not.toBe(3);
      for (let b = 0; b < 3; b++) expect([...s.slice(b * 8, b * 8 + 8)].sort().join("")).toBe("01112223");
      let run = 1;
      for (let i = 1; i < s.length; i++) { run = s[i] === s[i - 1] ? run + 1 : 1; expect(run).toBeLessThanOrEqual(3); }
      expect(balancedStars(24, mulberry32(seed))).toEqual(s);
    }
  });
});

describe("scoring", () => {
  it("0 rounds gives null", () => expect(gameScore(3, [], false).game).toBeNull());
  it("fewer than 5 rounds when given up gives null", () => expect(gameScore(3, [ch(2, 3), ch(2, 3)], false).game).toBeNull());
  it("always Vrchol = 100, always Jistota = 0", () => {
    expect(gameScore(3, Array(8).fill(ch(2, 0)), true).game).toBe(100);
    expect(gameScore(3, Array(8).fill(ch(0, 0)), true).game).toBe(0);
  });
  it("recovery falls back to risk with < 2 adverse rounds", () => {
    const c = [ch(1, 3), ch(2, 0), ch(0, 3), ch(1, 3)];
    expect(recoveryScore(3, c)).toBe(50);
  });
  it("quiz: no answers = 50 when finished, null when given up", () => {
    expect(quizScore([{ question: 1, choiceId: null, value: null, timedOut: true }], true)).toBe(50);
    expect(quizScore([], false)).toBeNull();
    expect(quizScore([{ question: 1, choiceId: "C", value: 2, timedOut: false }, { question: 2, choiceId: null, value: null, timedOut: true }], true)).toBe(100);
  });
  it("final score weights and re-weighting", () => {
    expect(finalScore(100, 0)).toBe(70);
    expect(finalScore(null, 80)).toBe(80);
    expect(finalScore(null, null)).toBeNull();
  });
  it("profile thresholds 40 / 41 / 59 / 60", () => {
    expect(profileFor(40)?.id).toBe("opatrny_strateg");
    expect(profileFor(41)?.id).toBe("rozvazny_riskr");
    expect(profileFor(59)?.id).toBe("rozvazny_riskr");
    expect(profileFor(60)?.id).toBe("odvazny_experimentator");
  });
});

describe("quiz", () => {
  it("shuffles answers but keeps value with answer", () => {
    const q = buildQuiz(mulberry32(3));
    expect(q).toHaveLength(5);
    for (const item of q) for (const o of item.options) expect(o.value).toBe("ABC".indexOf(o.choiceId));
  });
});

describe("payload", () => {
  it("works without payload", () => {
    const r = parsePayload(undefined);
    expect(r.ok).toBe(true);
  });
  it("invalid values fall back, wrong shape errors", () => {
    const r = parsePayload({ variant: 3, rounds: 500, seed: 1 });
    expect(r.ok && r.settings.rounds).toBe(8);
    expect(parsePayload({ variant: 3, rounds: 16 }).ok && (parsePayload({ variant: 3, rounds: 16 }) as { settings: { rounds: number } }).settings.rounds).toBe(8);
    expect(parsePayload("x").ok).toBe(false);
    expect(parsePayload([1]).ok).toBe(false);
  });
  it("output has no NaN", () => {
    const out = buildOutput({ variant: 3, seed: 1, buttonOrder: [...BUTTON_IDS], rounds: 8, choices: [], part1Done: false, answers: [], quizDone: false });
    expect(out.finalScore).toBeNull();
    expect(out.completed).toBe(false);
    expect(JSON.stringify(out)).not.toContain("NaN");
  });
});
