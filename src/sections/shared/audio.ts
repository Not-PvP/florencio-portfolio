
let ctx: AudioContext | null = null;
let muted = true;
const listeners = new Set<(muted: boolean) => void>();

export interface WindowWithWebkitAudio {
  webkitAudioContext?: typeof AudioContext;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as WindowWithWebkitAudio).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  listeners.forEach((fn) => fn(muted));

  if (muted) {
    stopAmbientMusic();
  } else {
    startAmbientMusic();
  }
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

export function subscribeMuted(fn: (muted: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function unlockAudio(): void {
  getCtx();
  preloadSFX();
}

const MUSIC_TARGET_GAIN = 0.08;
const MUSIC_FADE_SECONDS = 2.2;
const DUCK_SECONDS = 0.18;

interface MusicNodes {
  gain: GainNode;
  oscA: OscillatorNode;
  oscB: OscillatorNode;
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
}

let music: MusicNodes | null = null;

export function startAmbientMusic(): void {
  if (muted) return;
  if (music) return;
  const audio = getCtx();
  if (!audio) return;

  const now = audio.currentTime;

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(MUSIC_TARGET_GAIN, now + MUSIC_FADE_SECONDS);
  gain.connect(audio.destination);

  const oscA = audio.createOscillator();
  oscA.type = "sine";
  oscA.frequency.value = 130.81;
  const oscB = audio.createOscillator();
  oscB.type = "sine";
  oscB.frequency.value = 196.0;

  oscA.detune.value = -4;
  oscB.detune.value = 5;

  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 320;
  filter.Q.value = 0.7;

  const lfo = audio.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 1 / 18;
  const lfoGain = audio.createGain();
  lfoGain.gain.value = 140;
  lfo.connect(lfoGain).connect(filter.frequency);

  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(gain);

  oscA.start(now);
  oscB.start(now);
  lfo.start(now);

  music = { gain, oscA, oscB, filter, lfo, lfoGain };
}

export function stopAmbientMusic(): void {
  if (!music || !ctx) return;
  const now = ctx.currentTime;
  const nodes = music;
  music = null;

  nodes.gain.gain.cancelScheduledValues(now);
  nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
  nodes.gain.gain.linearRampToValueAtTime(0, now + 0.8);

  const stopAt = now + 0.85;
  nodes.oscA.stop(stopAt);
  nodes.oscB.stop(stopAt);
  nodes.lfo.stop(stopAt);
}

function duckMusicForHit(): void {
  if (!music || !ctx) return;
  const now = ctx.currentTime;
  const g = music.gain.gain;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(MUSIC_TARGET_GAIN * 0.3, now + 0.03);
  g.linearRampToValueAtTime(MUSIC_TARGET_GAIN, now + 0.03 + DUCK_SECONDS + 0.4);
}

const HIT_SFX_URLS = ["/sfx/hit-1.mp3", "/sfx/hit-2.mp3", "/sfx/hit-3.mp3"];
const UNLOCK_SFX_URL = "/sfx/unlock.mp3";
const HIT_GAIN = 0.9;
const UNLOCK_GAIN = 0.8;

const bufferCache = new Map<string, AudioBuffer>();
const loadingPromises = new Map<string, Promise<AudioBuffer | null>>();

function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(url);
  if (cached) return Promise.resolve(cached);
  const pending = loadingPromises.get(url);
  if (pending) return pending;

  const audio = getCtx();
  if (!audio) return Promise.resolve(null);

  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return res.arrayBuffer();
    })
    .then((data) => audio.decodeAudioData(data))
    .then((buf) => {
      bufferCache.set(url, buf);
      return buf;
    })
    .catch((err) => {
      console.warn(
        `[audio] Couldn't load "${url}" — drop the file in place to hear it.`,
        err
      );
      return null;
    });

  loadingPromises.set(url, promise);
  return promise;
}

export function preloadSFX(): void {
  if (!getCtx()) return;
  [...HIT_SFX_URLS, UNLOCK_SFX_URL].forEach((url) => {
    loadBuffer(url);
  });
}

function playBuffer(buffer: AudioBuffer, gainValue: number, pitchJitter: number): void {
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;

  const source = audio.createBufferSource();
  source.buffer = buffer;

  source.playbackRate.value = 1 + (Math.random() * 2 - 1) * pitchJitter;

  const gain = audio.createGain();
  gain.gain.value = gainValue;
  source.connect(gain).connect(audio.destination);
  source.start(now);
}

export async function playHit(): Promise<void> {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  const url = HIT_SFX_URLS[Math.floor(Math.random() * HIT_SFX_URLS.length)];
  const buffer = await loadBuffer(url);
  if (!buffer) return;
  duckMusicForHit();
  playBuffer(buffer, HIT_GAIN, 0.06);
}

export async function playUnlock(): Promise<void> {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  const buffer = await loadBuffer(UNLOCK_SFX_URL);
  if (!buffer) return;
  duckMusicForHit();
  playBuffer(buffer, UNLOCK_GAIN, 0.02);
}