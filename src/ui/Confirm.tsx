import { useEffect, useRef } from "react";
import { config } from "@/model/config";

export function Confirm({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  const noRef = useRef<HTMLButtonElement>(null);
  useEffect(() => noRef.current?.focus(), []);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" role="dialog" aria-modal="true" onKeyDown={(e) => e.key === "Escape" && onNo()}>
      <div className="anim-rise w-full max-w-sm rounded-2xl bg-card p-5 text-center shadow-[var(--shadow-card)]">
        <p className="text-lg font-bold">{config.texts["giveUpConfirm"]}</p>
        <div className="mt-4 grid gap-2">
          <button ref={noRef} onClick={onNo} className="min-h-12 rounded-xl bg-primary font-bold text-primary-foreground focus-visible:ring-4 focus-visible:ring-ring">{config.texts["giveUpNo"]}</button>
          <button onClick={onYes} className="min-h-12 rounded-xl bg-secondary font-bold text-secondary-foreground focus-visible:ring-4 focus-visible:ring-ring">{config.texts["giveUpYes"]}</button>
        </div>
      </div>
    </div>
  );
}

export function PrimaryButton({ children, onClick, autoFocus }: { children: React.ReactNode; onClick: () => void; autoFocus?: boolean }) {
  return (
    <button autoFocus={autoFocus} onClick={onClick} className="min-h-14 w-full rounded-2xl bg-primary px-6 text-lg font-extrabold text-primary-foreground shadow-[var(--shadow-card)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring">
      {children}
    </button>
  );
}
