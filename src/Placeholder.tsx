import { useEffect, useRef, useState } from "react";
import { config } from "@/model/config";

type Proto = typeof import("./minihra-protokol");
type Init = { type: "INIT"; level: number | undefined; payload: unknown };
type LogEntry = { time: string; direction: "in" | "out"; message: object };

export function Placeholder() {
  const [dev, setDev] = useState(false);
  const [init, setInit] = useState<Init | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [rate, setRate] = useState("0.8");
  const proto = useRef<Proto | null>(null);
  const details = config.placeholder;

  const push = (direction: LogEntry["direction"], message: object) => {
    setLog((entries) =>
      [{ time: new Date().toLocaleTimeString("cs-CZ"), direction, message }, ...entries].slice(
        0,
        30,
      ),
    );
  };

  useEffect(() => {
    let alive = true;
    import("./minihra-protokol").then((m) => {
      if (!alive) return;
      proto.current = m;
      m.startMinihra((level, payload) => {
        const message = { type: "INIT" as const, level, payload };
        setInit(message);
        setDone(false);
        push("in", message);
      });
      setReady(true);
      push("out", { type: "READY", version: 1 });
    });
    return () => {
      alive = false;
    };
  }, []);

  const finish = () => {
    if (!proto.current) throw new Error("Protocol is not ready");
    const value = Number(rate.replace(",", "."));
    if (!Number.isFinite(value)) {
      proto.current.fail("INVALID_RESULT", `Invalid successRate: ${rate}`);
      push("out", {
        type: "ERROR",
        version: 1,
        code: "INVALID_RESULT",
        message: `Invalid successRate: ${rate}`,
      });
      setDone(true);
      return;
    }
    proto.current.finish(value, { placeholder: true, id: config.gameId });
    const clamped = Math.min(1, Math.max(0, value));
    push("out", {
      type: "FINISH",
      version: 1,
      successRate: clamped,
      succesRate: clamped,
      payload: { placeholder: true, id: config.gameId },
    });
    setDone(true);
  };
  const fail = () => {
    if (!proto.current) throw new Error("Protocol is not ready");
    const message = `Placeholder ${config.gameId}: test error`;
    proto.current.fail("INTERNAL", message);
    push("out", { type: "ERROR", version: 1, code: "INTERNAL", message });
    setDone(true);
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#e6f7fb] font-sans text-[#002e34]">
      <section className="flex flex-1 flex-col items-center justify-center gap-2.5 px-6 py-12 text-center">
        <img src="/navis-actuaria.png" alt="" width="242" height="181" />
        <p className="text-lg text-[#3f6168]">{details.topic}</p>
        <h1 className="max-w-[14ch] text-4xl font-extrabold leading-tight sm:text-6xl">
          {details.name}
        </h1>
        <p className="max-w-[38ch] text-xl font-semibold">{details.teaser}</p>
        <p className="mt-5 rounded-full border-2 border-[#2dbde2] bg-white px-5 py-3 text-[17px] font-semibold">
          Minihra ještě není hotová, zatím ji nejde hrát.
          {details.expected && ` Počítáme s ní na ${details.expected}.`}
        </p>
        {done && <p className="mt-2 text-[#0a5d70]">Testovací výsledek byl odeslán hlavní hře.</p>}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 text-sm text-[#3f6168]">
        <button
          type="button"
          className="cursor-pointer underline"
          onClick={() => setDev((open) => !open)}
          aria-expanded={dev}
        >
          {dev ? "Skrýt informace pro vývojáře" : "Pro vývojáře"}
        </button>
        <span>
          {config.gameId} {details.version}
        </span>
        <img src="/actuaria-logo.svg" alt="Actuaria" width="176" height="21" />
      </footer>

      {dev && (
        <section
          className="flex flex-col gap-5 border-t-2 border-[#2dbde2] bg-white px-5 py-6"
          aria-label="Informace pro vývojáře"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Napojení na hlavní hru</h2>
              <p>Běží v iframe, host je připojen.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                successRate
                <input
                  className="w-20 rounded-full border-2 border-[#002e34] p-2"
                  type="text"
                  inputMode="decimal"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="rounded-full bg-[#0f7f98] px-5 py-2 text-white disabled:opacity-50"
                onClick={finish}
                disabled={!ready || done}
              >
                Odeslat FINISH
              </button>
              <button
                type="button"
                className="rounded-full border-2 border-[#002e34] px-5 py-2 disabled:opacity-50"
                onClick={fail}
                disabled={!ready || done}
              >
                Odeslat ERROR
              </button>
            </div>
          </div>
          <div>
            <h3 className="font-bold">Přijatý INIT</h3>
            <pre className="overflow-x-auto rounded-xl bg-[#e6f7fb] p-3">
              {init ? JSON.stringify(init, null, 2) : "zatím nic"}
            </pre>
          </div>
          <div>
            <h3 className="font-bold">Protokol (verze 1)</h3>
            <pre className="overflow-x-auto rounded-xl bg-[#e6f7fb] p-3">{`minihra → host   { type: "READY",  version: 1 }
host → minihra   { type: "INIT",   version?, level?, payload? }
minihra → host   { type: "FINISH", version: 1, successRate (0–1), succesRate, payload? }
minihra → host   { type: "ERROR",  version: 1, code, message }`}</pre>
          </div>
          <div>
            <h3 className="font-bold">Log zpráv</h3>
            <ol className="flex flex-col gap-2">
              {log.map((entry, index) => (
                <li key={index} className="flex flex-wrap gap-2 text-sm">
                  <span>{entry.time}</span>
                  <span>{entry.direction === "in" ? "host →" : "→ host"}</span>
                  <code className="break-all">{JSON.stringify(entry.message)}</code>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </main>
  );
}
