// Gentle synthesized sounds. Audio starts only after the first touch.
let ctx: AudioContext | null = null;
let muted = false;

export function unlockAudio() {
  if (ctx || typeof window === "undefined") return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (AC) ctx = new AC();
}
export const setMuted = (m: boolean) => { muted = m; };
export const isMuted = () => muted;

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.08, delay = 0) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sounds = {
  sun: (delay = 0) => { tone(880, 0.35, "sine", 0.06, delay); tone(1320, 0.3, "sine", 0.03, delay + 0.04); },
  cloud: (delay = 0) => tone(220, 0.4, "triangle", 0.05, delay),
  tick: (fast: boolean) => tone(fast ? 1000 : 800, 0.06, "square", 0.02),
  click: () => tone(520, 0.08, "sine", 0.04),
};
