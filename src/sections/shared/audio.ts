/**
 * Site audio. Everything is synthesized with the Web Audio API, so there are no
 * sound files to host. One shared AudioContext feeds three buses (sfx, music) into
 * a master gain and a compressor, which keeps loud moments from clipping.
 *
 * Browsers block sound until a user gesture, so sound starts muted. The title card
 * calls `startSoundFromGesture()` when you press start. The speaker button saves
 * your choice in localStorage and respects it on the next visit.
 */

export interface WindowWithWebkitAudio {
  webkitAudioContext?: typeof AudioContext;
}

const STORAGE_KEY = "mk-sound";
const MASTER_GAIN = 0.9;
const SFX_GAIN = 1;
const MUSIC_TARGET = 0.8;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let muted = true;
const listeners = new Set<(muted: boolean) => void>();

function readPref(): "on" | "off" | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "on" || v === "off" ? v : null;
  } catch {
    return null;
  }
}

function writePref(value: "on" | "off") {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage can be blocked; the choice then lasts for this visit only */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as WindowWithWebkitAudio).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 12;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.2;
    compressor.connect(ctx.destination);

    master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(compressor);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_GAIN;
    sfxBus.connect(master);

    const musicFilter = ctx.createBiquadFilter();
    musicFilter.type = "lowpass";
    musicFilter.frequency.value = 1800;
    musicFilter.Q.value = 0.5;
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(musicFilter);
    musicFilter.connect(master);

    document.addEventListener("visibilitychange", () => {
      if (!ctx) return;
      if (document.hidden) void ctx.suspend();
      else if (!muted) void ctx.resume();
    });
  }
  if (ctx.state === "suspended" && !document.hidden) void ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  return muted;
}

function applyMuted(next: boolean) {
  muted = next;
  listeners.forEach((fn) => fn(muted));
  if (muted) stopAmbientMusic();
  else startAmbientMusic();
}

export function setMuted(next: boolean): void {
  applyMuted(next);
}

/** Speaker button: flips sound and remembers the choice. */
export function toggleMuted(): boolean {
  applyMuted(!muted);
  writePref(muted ? "off" : "on");
  if (!muted) playClick();
  return muted;
}

export function subscribeMuted(fn: (muted: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function unlockAudio(): void {
  getCtx();
}

/** Call from the first user gesture. Turns sound on unless the visitor muted it before. */
export function startSoundFromGesture(): void {
  getCtx();
  if (readPref() !== "off") applyMuted(false);
}

export function preloadSFX(): void {
  getCtx();
}

/* ---------- building blocks ---------- */

interface ToneOptions {
  type: OscillatorType;
  freq: number;
  to?: number;
  at?: number;
  dur: number;
  gain: number;
  bus?: GainNode | null;
  detune?: number;
}

function tone({ type, freq, to, at, dur, gain, bus, detune }: ToneOptions): void {
  const a = ctx;
  const out = bus ?? sfxBus;
  if (!a || !out) return;
  const t0 = at ?? a.currentTime;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  if (detune) osc.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noise(dur: number, gain: number, from: number, to: number, at = 0): void {
  const a = ctx;
  if (!a || !sfxBus) return;
  if (!noiseBuffer) {
    noiseBuffer = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t0 = a.currentTime + at;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filter = a.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(sfxBus);
  src.start(t0);
  src.stop(t0 + dur + 0.03);
}

function ready(): boolean {
  if (muted) return false;
  return getCtx() !== null;
}

function duckMusic(seconds = 0.35): void {
  if (!ctx || !musicBus || !musicOn) return;
  const now = ctx.currentTime;
  const g = musicBus.gain;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(MUSIC_TARGET * 0.3, now + 0.03);
  g.linearRampToValueAtTime(MUSIC_TARGET, now + 0.03 + seconds);
}

/* ---------- sound effects ---------- */

let lastClick = 0;

/** Short tick for buttons and links. */
export function playClick(): void {
  if (!ready()) return;
  const now = performance.now();
  if (now - lastClick < 40) return;
  lastClick = now;
  tone({ type: "square", freq: 760, to: 520, dur: 0.05, gain: 0.07 });
}

/** Menu move: pitch rises for forward, falls for back. */
export function playSelect(rising = true): void {
  if (!ready()) return;
  tone({ type: "square", freq: rising ? 330 : 470, to: rising ? 520 : 260, dur: 0.08, gain: 0.07 });
}

/** Confirm: a quick major arpeggio. Used by Press start. */
export function playConfirm(): void {
  if (!ready()) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone({ type: "square", freq: f, dur: 0.09, gain: 0.07, at: ctx!.currentTime + i * 0.055 })
  );
  tone({ type: "triangle", freq: 261.63, dur: 0.3, gain: 0.12 });
}

/** Wrong input: a low buzz. */
export function playMiss(): void {
  if (!ready()) return;
  tone({ type: "sawtooth", freq: 190, to: 90, dur: 0.16, gain: 0.09 });
}

/** Hit: noise crack plus a falling thump. Used for combos. */
export function playHit(): void {
  if (!ready()) return;
  duckMusic(0.5);
  noise(0.14, 0.5, 5200, 300);
  tone({ type: "sine", freq: 170, to: 48, dur: 0.22, gain: 0.5 });
  tone({ type: "square", freq: 420, to: 110, dur: 0.1, gain: 0.1 });
}

/** Cartridge going into the console, then the screen powering on. */
export function playInsert(quick = false): void {
  if (!ready()) return;
  const t = ctx!.currentTime;
  duckMusic(quick ? 0.5 : 1.4);
  if (!quick) {
    // cartridge scraping down the slot
    noise(0.34, 0.34, 4200, 700);
    tone({ type: "square", freq: 340, to: 150, dur: 0.3, gain: 0.07 });
  }
  const seat = quick ? 0 : 0.36;
  // the clunk when it seats
  tone({ type: "square", freq: 150, to: 45, dur: 0.18, gain: 0.34, at: t + seat });
  tone({ type: "triangle", freq: 90, to: 40, dur: 0.22, gain: 0.4, at: t + seat });
  noise(0.09, 0.5, 2600, 500, seat);
  // second, smaller click as the latch catches
  tone({ type: "square", freq: 900, to: 500, dur: 0.05, gain: 0.12, at: t + seat + 0.1 });
  if (!quick) {
    // power-on, lines up with the white flash at 0.9s
    tone({ type: "triangle", freq: 220, to: 880, dur: 0.28, gain: 0.2, at: t + 0.9 });
    tone({ type: "square", freq: 659.25, dur: 0.1, gain: 0.1, at: t + 1.0 });
    tone({ type: "square", freq: 1318.5, dur: 0.22, gain: 0.1, at: t + 1.1 });
  }
}

/** Rising run for the secret code. */
export function playUnlock(): void {
  if (!ready()) return;
  duckMusic(0.9);
  [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => {
    tone({ type: "square", freq: f, dur: 0.1, gain: 0.07, at: ctx!.currentTime + i * 0.07 });
    tone({ type: "triangle", freq: f / 2, dur: 0.14, gain: 0.08, at: ctx!.currentTime + i * 0.07 });
  });
}

/** Soft two-note chime for "copied". */
export function playChime(): void {
  if (!ready()) return;
  tone({ type: "sine", freq: 987.77, dur: 0.18, gain: 0.12 });
  tone({ type: "sine", freq: 1318.5, dur: 0.3, gain: 0.12, at: ctx!.currentTime + 0.09 });
}

/* ---------- music ---------- */

const BPM = 92;
const STEP_SECONDS = 60 / BPM / 2;
const STEPS_PER_BAR = 8;
const LOOKAHEAD_SECONDS = 0.25;

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

/** A minor loop: Am, F, C, G. `notes` feed the arpeggio, `bass` is the root. */
const CHORDS = [
  { bass: 45, notes: [57, 60, 64] },
  { bass: 41, notes: [53, 57, 60] },
  { bass: 48, notes: [55, 60, 64] },
  { bass: 43, notes: [50, 55, 59] },
];
const ARP = [0, 1, 2, 1, 0, 1, 2, 1];

let musicOn = false;
let musicTimer: number | undefined;
let nextStepTime = 0;
let stepIndex = 0;

function playMusicStep(step: number, at: number): void {
  const bar = Math.floor(step / STEPS_PER_BAR) % CHORDS.length;
  const inBar = step % STEPS_PER_BAR;
  const chord = CHORDS[bar];
  if (inBar === 0 || inBar === 4) {
    tone({ type: "square", freq: midi(chord.bass), dur: STEP_SECONDS * 3.2, gain: 0.1, at, bus: musicBus });
  }
  const note = chord.notes[ARP[inBar]] + (inBar % 4 === 2 ? 12 : 0);
  tone({ type: "triangle", freq: midi(note), dur: STEP_SECONDS * 1.6, gain: 0.07, at, bus: musicBus });
  if (inBar === 0 && bar % 2 === 1) {
    tone({ type: "square", freq: midi(chord.notes[2] + 12), dur: STEP_SECONDS * 2, gain: 0.025, at, bus: musicBus });
  }
}

function scheduleMusic(): void {
  if (!ctx) return;
  while (nextStepTime < ctx.currentTime + LOOKAHEAD_SECONDS) {
    playMusicStep(stepIndex, nextStepTime);
    nextStepTime += STEP_SECONDS;
    stepIndex = (stepIndex + 1) % (STEPS_PER_BAR * CHORDS.length);
  }
}

export function startAmbientMusic(): void {
  if (muted || musicOn) return;
  const a = getCtx();
  if (!a || !musicBus) return;
  musicOn = true;
  stepIndex = 0;
  nextStepTime = a.currentTime + 0.1;
  const g = musicBus.gain;
  g.cancelScheduledValues(a.currentTime);
  g.setValueAtTime(0, a.currentTime);
  g.linearRampToValueAtTime(MUSIC_TARGET, a.currentTime + 1.8);
  scheduleMusic();
  musicTimer = window.setInterval(scheduleMusic, 60);
}

export function stopAmbientMusic(): void {
  if (!musicOn || !ctx || !musicBus) return;
  musicOn = false;
  window.clearInterval(musicTimer);
  const now = ctx.currentTime;
  const g = musicBus.gain;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(0, now + 0.4);
}
