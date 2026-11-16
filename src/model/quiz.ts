import { config, type GameConfig } from "./config";
import { shuffle, type Rng } from "./rng";

export type QuizOption = { choiceId: "A" | "B" | "C"; text: string; value: number };
export type QuizItem = { question: number; text: string; options: QuizOption[] };

const IDS = ["A", "B", "C"] as const;

/** Builds quiz items; answer order is shuffled, value stays with the answer. */
export function buildQuiz(rng: Rng, cfg: GameConfig = config): QuizItem[] {
  const count = Math.min(10, Math.max(3, cfg.quiz.count));
  return cfg.quiz.questions.slice(0, count).map((q) => ({
    question: q.id,
    text: q.text,
    options: shuffle(
      q.answers.slice(0, 3).map((text, i) => ({ choiceId: IDS[i]!, text, value: i })),
      rng,
    ),
  }));
}
