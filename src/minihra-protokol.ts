// minihra-protokol.ts – minigame ↔ main game communication (protocol version 1)

type InitMessage = { type: "INIT"; version?: number; level?: number; payload?: unknown };
type ErrorCode = "MISSING_PAYLOAD" | "INVALID_PAYLOAD" | "INVALID_RESULT" | "INTERNAL";

const embedded = window.parent !== window; // running inside the main game's iframe?
let parentOrigin = "*";
let started = false;
let finished = false;

function post(message: object) {
  if (!embedded) {
    console.info("[minihra] standalone mode – message not sent:", message);
    return;
  }
  window.parent.postMessage({ version: 1, ...message }, parentOrigin);
}

/**
 * Starts communication. onInit receives level and payload from the main game.
 * When opened standalone (development) they come from the URL: ?level=2&payload={"rounds":3}
 */
export function startMinihra(onInit: (level: number | undefined, payload: unknown) => void) {
  if (started) return;
  started = true;

  if (!embedded) {
    const q = new URLSearchParams(window.location.search);
    const rawPayload = q.get("payload");
    let payload: unknown = undefined;
    if (rawPayload !== null) {
      try { payload = JSON.parse(rawPayload); } catch { payload = rawPayload; }
    }
    onInit(q.has("level") ? Number(q.get("level")) : undefined, payload);
    return;
  }

  let gotInit = false;
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return; // only messages from the main game
    const data = event.data as InitMessage;
    if (!data || data.type !== "INIT") return;
    gotInit = true;
    if (event.origin !== "null") parentOrigin = event.origin;
    finished = false; // a new INIT starts a new round from scratch
    const level = typeof data.level === "number" && Number.isFinite(data.level) ? data.level : undefined;
    onInit(level, data.payload);
  });
  post({ type: "READY" });

  // No INIT within a second (e.g. opened in a plain iframe, not by the main game):
  // start standalone, as if a default INIT had arrived.
  window.setTimeout(() => {
    if (gotInit) return;
    const q = new URLSearchParams(window.location.search);
    const rawPayload = q.get("payload");
    let payload: unknown = undefined;
    if (rawPayload !== null) {
      try { payload = JSON.parse(rawPayload); } catch { payload = rawPayload; }
    }
    onInit(q.has("level") ? Number(q.get("level")) : undefined, payload);
  }, 1000);
}

/** Ends the game and sends the result. successRate must be 0–1. */
export function finish(successRate: number, payload?: unknown) {
  if (finished) return;
  if (typeof successRate !== "number" || !Number.isFinite(successRate)) {
    fail("INVALID_RESULT", `Invalid successRate: ${String(successRate)}`);
    return;
  }
  finished = true;
  const rate = Math.min(1, Math.max(0, successRate));
  post({ type: "FINISH", successRate: rate, succesRate: rate, payload });
}

/** Reports that the game cannot continue. */
export function fail(code: ErrorCode, message: string) {
  finished = true;
  post({ type: "ERROR", code, message });
}
