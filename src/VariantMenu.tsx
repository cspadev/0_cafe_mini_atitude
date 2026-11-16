import { config, type Variant } from "@/model/config";

export function VariantMenu({ onPick }: { onPick: (v: Variant) => void }) {
  return (
    <div className="anim-rise my-auto grid gap-3">
      <h1 className="text-center text-3xl font-extrabold">{config.texts["menuTitle"]}</h1>
      {([1, 2, 3] as Variant[]).map((v) => (
        <div key={v} className="flex items-center gap-3 rounded-2xl bg-card/90 p-4 shadow-[var(--shadow-card)]">
          <p className="flex-1">{config.texts.variants[String(v)]}</p>
          <button onClick={() => onPick(v)} className="min-h-12 rounded-xl bg-primary px-5 font-extrabold text-primary-foreground focus-visible:ring-4 focus-visible:ring-ring">{config.texts["menuPlay"]}</button>
        </div>
      ))}
    </div>
  );
}
