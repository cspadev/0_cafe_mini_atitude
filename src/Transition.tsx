import { useEffect, useState } from "react";
import { config } from "@/model/config";
import { PrimaryButton } from "@/ui/Confirm";

/** Waiting screen (3 s), optionally followed by a message with a button. */
export function Transition({ text, after, onDone }: { text: string; after?: string; onDone: () => void }) {
  const [phase, setPhase] = useState<"wait" | "after">("wait");
  useEffect(() => {
    const t = setTimeout(() => (after ? setPhase("after") : onDone()), config.transitionSec * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="anim-rise my-auto grid gap-5 rounded-3xl bg-card/90 p-6 text-center shadow-[var(--shadow-card)]" aria-live="polite">
      {phase === "wait" ? (
        <>
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-muted border-t-primary motion-reduce:animate-none" />
          <p className="text-xl font-bold">{text}</p>
        </>
      ) : (
        <>
          <p className="text-lg">{after}</p>
          <PrimaryButton autoFocus onClick={onDone}>{config.texts["continue"]}</PrimaryButton>
        </>
      )}
    </div>
  );
}
