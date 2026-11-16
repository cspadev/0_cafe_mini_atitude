import type { ReactNode } from "react";
import { config, type ButtonId } from "@/model/config";
import { ButtonIcon, CHOICE_STYLE } from "./art";

type Props = { order: ButtonId[]; disabled: boolean; onPick: (id: ButtonId) => void; payouts: Record<ButtonId, ReactNode>; selected?: ButtonId | null | undefined };

export function ChoiceButtons({ order, disabled, onPick, payouts, selected }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-3">
      {order.map((id, i) => {
        const s = CHOICE_STYLE[id];
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(id)}
            aria-keyshortcuts={String(i + 1)}
            aria-pressed={selected === undefined ? undefined : selected === id}
            className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 ${selected === id ? "border-current ring-4 ring-ring/40" : "border-transparent"} bg-card p-2 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-current focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-60 disabled:hover:translate-y-0 min-[900px]:flex-col min-[900px]:items-stretch min-[900px]:text-center ${s.text}`}
          >
            <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${s.bg} text-on-choice min-[900px]:mx-auto`}>
              <ButtonIcon id={id} className="size-7" />
            </span>
            <span className="flex-1">
              <span className="block text-lg font-extrabold">{config.buttons[id].label}</span>
              <span className="tabular block text-sm font-semibold text-foreground">{payouts[id]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
