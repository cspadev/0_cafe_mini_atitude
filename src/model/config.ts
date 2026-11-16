import raw from "../../game.config.json";

export type ButtonId = "jistota" | "prilezitost" | "vrchol";
export const BUTTON_IDS: ButtonId[] = ["jistota", "prilezitost", "vrchol"];
export type Variant = 1 | 2 | 3;
export type Scenario = "A" | "B";

export type Profile = {
  id: string; max: number; name: string; icon: string; intro: string; description: string; motto: string;
};
export type Question = { id: number; text: string; answers: string[] };

export type GameConfig = {
  defaultVariant: Variant | null;
  startPoints: number;
  shuffleButtons: boolean;
  hintAfterSec: number;
  flipMs: number;
  flipStaggerMs: number;
  transitionSec: number;
  buttons: Record<ButtonId, { label: string; level: number }>;
  variant1: { attempts: number; attemptSeconds: number; payoffs: Record<ButtonId, { sun: number; cloud: number | "reset" }> };
  variant2: { rounds: number; scenario: Scenario; scenarios: Record<Scenario, Record<ButtonId, number[]>> };
  variant3: {
    rounds: number; pickSeconds: { first: number; next: number }; maxRun: number; spinMs: number;
    /** Suns (0..3) assigned to each wheel segment, clockwise from the top. */
    wheelLayout: number[];
    linear: Record<ButtonId, { base: number; rate: number }>;
  };
  effects: { bigWin: number; bigLoss: number };
  scoring: {
    gameRiskWeight: number; gameRecoveryWeight: number; finalGameWeight: number; finalQuizWeight: number;
    minRecoveryRounds: number; minRoundsIncomplete: number; quizNoAnswerScore: number;
  };
  tutorial: Record<string, string[]>;
  profiles: Profile[];
  quiz: { timeSec: number; count: number; questions: Question[] };
  texts: Record<string, string> & { variants: Record<string, string> };
};

export const config = raw as unknown as GameConfig;
