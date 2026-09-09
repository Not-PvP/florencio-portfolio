import { isMuted } from "../shared/audio";

// Short synthesized "select" blip — two quick square-wave tones, no
// external audio asset needed. Reused for both open and close so the
// column switch always has a bit of arcade feedback.
let sharedAudioCtx: AudioContext | null = null;
export function playSelectBlip(rising: boolean) {
  if (isMuted()) return; // respect the site-wide sound toggle
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new Ctx();
    const ctx = sharedAudioCtx;
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    const start = rising ? 220 : 340;
    const end = rising ? 440 : 200;
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(end, now + 0.09);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // Audio is a nice-to-have; never let it break the UI.
  }
}