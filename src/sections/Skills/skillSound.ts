import { isMuted, type WindowWithWebkitAudio } from "../shared/audio";

let sharedAudioCtx: AudioContext | null = null;
export function playSelectBlip(rising: boolean) {
  if (isMuted()) return;
  try {
    const Ctx = window.AudioContext || (window as unknown as WindowWithWebkitAudio).webkitAudioContext;
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
  }
}