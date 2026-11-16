import { useEffect, useRef, useState } from "react";
import type { ButtonId } from "@/model/config";
import { config } from "@/model/config";

const KEYS: Record<string, number> = { "1": 0, "2": 1, "3": 2, ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2 };

export function useChoiceKeys(order: ButtonId[], enabled: boolean, onPick: (id: ButtonId) => void) {
  const cb = useRef(onPick);
  cb.current = onPick;
  useEffect(() => {
    if (!enabled) return;
    const h = (e: KeyboardEvent) => {
      const i = KEYS[e.key];
      if (i === undefined) return;
      const id = order[i];
      if (id) { e.preventDefault(); cb.current(id); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [order, enabled]);
}

/** Shows the hint after N seconds without a choice. */
export function useHint(roundKey: number, active: boolean) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(false);
    if (!active) return;
    const t = setTimeout(() => setShow(true), config.hintAfterSec * 1000);
    return () => clearTimeout(t);
  }, [roundKey, active]);
  return show;
}

export const revealMs = (cards: number) => config.flipMs + config.flipStaggerMs * (cards - 1) + 150;
