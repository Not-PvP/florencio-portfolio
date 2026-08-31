// ── Shared audio: ambient bed (procedural) + SFX (sample-based) ──────
// The ambient background drone is generated at call-time with the Web
// Audio API — no file, no loop seam to hide. Combo-hit and unlock SFX
// play real short audio files (see the "Sample-based one-shots" section
// below) for more punch than oscillators alone can give.
//
// AudioContext is created lazily on the first call after a real user
// gesture (tap/click/keydown) — browsers block autoplay otherwise, and
// creating it eagerly on import would just throw or sit suspended.

let ctx: AudioContext | null = null;
let muted = true; // default OFF — sound should never surprise someone on load
const listeners = new Set<(muted: boolean) => void>();

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
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
  // Ambient bed follows the same single mute switch as every SFX — no
  // separate music toggle to add to the HUD, and no code path where the
  // bed can keep playing after the user hits mute.
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

// Call this from within a user-gesture handler (click/tap/keydown) to
// unlock audio — used by the boot gate so the very first tap on the
// page both dismisses the intro and satisfies the browser's autoplay
// gesture requirement in one action.
export function unlockAudio(): void {
  getCtx();
  preloadSFX();
}

// ── Ambient background bed ───────────────────────────────────────────
// A low, moving drone rather than a melody — meant to sit under the UI
// and the SFX, not compete with either. Two slightly detuned low
// oscillators through a slow-sweeping lowpass filter, so it breathes
// instead of holding one static tone. Fully procedural like the rest of
// this file: no audio file to license, no loop seam to hide.
const MUSIC_TARGET_GAIN = 0.08; // stays well under SFX so a hit still cuts through
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

// Starts the ambient bed. Called automatically by setMuted() when sound
// is turned on — you shouldn't normally need to call this directly.
export function startAmbientMusic(): void {
  if (muted) return; // respects the same switch as every other sound here
  if (music) return; // already running
  const audio = getCtx();
  if (!audio) return;

  const now = audio.currentTime;

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(MUSIC_TARGET_GAIN, now + MUSIC_FADE_SECONDS);
  gain.connect(audio.destination);

  // A low fifth (C3 + G3) rather than a single tone — reads as a chord
  // bed without ever resolving into a hummable melody. Bumped up an
  // octave from the original C2/G2: most laptop and phone speakers roll
  // off steeply below ~150Hz, so that version was likely playing but
  // genuinely inaudible on typical hardware rather than actually broken.
  const oscA = audio.createOscillator();
  oscA.type = "sine";
  oscA.frequency.value = 130.81; // C3
  const oscB = audio.createOscillator();
  oscB.type = "sine";
  oscB.frequency.value = 196.0; // G3
  // A few cents of detune on each gives the pair a faint, slow beating
  // pattern instead of a perfectly static, obviously-synthetic drone.
  oscA.detune.value = -4;
  oscB.detune.value = 5;

  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 320;
  filter.Q.value = 0.7;

  // Slow LFO sweeps the filter cutoff up and down over ~18s so the tone
  // color drifts instead of sitting frozen — this is most of what makes
  // it feel alive rather than like a held organ note.
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

// Fades out and tears down the ambient bed. Called automatically by
// setMuted() when sound is turned off.
export function stopAmbientMusic(): void {
  if (!music || !ctx) return;
  const now = ctx.currentTime;
  const nodes = music;
  music = null; // clear immediately so a rapid re-toggle can't double-stop

  nodes.gain.gain.cancelScheduledValues(now);
  nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
  nodes.gain.gain.linearRampToValueAtTime(0, now + 0.8);

  const stopAt = now + 0.85;
  nodes.oscA.stop(stopAt);
  nodes.oscB.stop(stopAt);
  nodes.lfo.stop(stopAt);
}

// Briefly dips the ambient bed under a one-shot SFX so a combo landing
// or the easter-egg jingle still reads clearly instead of getting muddy
// against the drone. No-op if music isn't currently playing.
function duckMusicForHit(): void {
  if (!music || !ctx) return;
  const now = ctx.currentTime;
  const g = music.gain.gain;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(MUSIC_TARGET_GAIN * 0.3, now + 0.03);
  g.linearRampToValueAtTime(MUSIC_TARGET_GAIN, now + 0.03 + DUCK_SECONDS + 0.4);
}

// ── Sample-based one-shots ───────────────────────────────────────────
// Combo hits and the easter-egg unlock now play real recorded impact/
// confirmation sounds instead of raw oscillator tones — bare sine/
// square/triangle waves read instantly as "generated," and no amount of
// envelope tweaking fully escapes that. This is the one place in the
// file that isn't procedural.
//
// Drop your own royalty-free files at these paths (public folder, same
// convention as the "/resume.pdf" link in Contact.tsx) and everything
// below just starts working — no other code changes needed:
//   /sfx/hit-1.mp3, /sfx/hit-2.mp3, /sfx/hit-3.mp3   (a few variations —
//     add or remove entries in HIT_SFX_URLS freely)
//   /sfx/unlock.mp3
//
// Good CC0 (public domain, no attribution needed) sources sized right
// for an arcade/fighting-game feel:
//   https://kenney.nl/assets/impact-sounds   — punches/impacts for hits
//   https://kenney.nl/assets/digital-audio   — bright blips for unlock
//   https://kenney.nl/assets/interface-sounds
// If a file is missing, playback just silently no-ops (with a console
// warning) instead of throwing, so the site never breaks because an
// asset hasn't been dropped in yet.
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

// Kicks off fetching every SFX file so the first real playHit()/
// playUnlock() call doesn't stall on a network request. Called
// automatically by unlockAudio() from the boot gate's first tap — no
// extra wiring needed anywhere else.
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
  // A little random pitch variance per play — the single biggest thing
  // that keeps a repeated one-shot from starting to sound like a
  // looping robot the third time someone lands the same combo.
  source.playbackRate.value = 1 + (Math.random() * 2 - 1) * pitchJitter;

  const gain = audio.createGain();
  gain.gain.value = gainValue;
  source.connect(gain).connect(audio.destination);
  source.start(now);
}

// Combo-landing impact. Picks a random variation from HIT_SFX_URLS each
// time so the same combo doesn't sound identical on repeat.
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

// Bright confirmation sound for the easter egg unlock — distinct from
// the combo hit so it reads as "something new," not another contact
// move landing.
export async function playUnlock(): Promise<void> {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  const buffer = await loadBuffer(UNLOCK_SFX_URL);
  if (!buffer) return;
  duckMusicForHit();
  playBuffer(buffer, UNLOCK_GAIN, 0.02);
}