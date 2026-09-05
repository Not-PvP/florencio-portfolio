import { useEffect, useRef, useState } from "react";
import { playHit } from "../shared/audio";

// ── Data ─────────────────────────────────────────────────────────────
// Each move is a real input sequence: press the arrow keys in `keys`
// order, then the `triggerKey` letter, to fire it. Clicking/tapping the
// row fires it directly too, so keyboard input is never the only path.
type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

interface ComboMove {
  id: string;
  keys: ArrowKey[];
  triggerKey: string; // lowercase single letter
  accent: string;
  moveName: string;
  target: string;
  url: string;
  resultText: string;
}

const MOVES: ComboMove[] = [
  {
    id: "email",
    keys: ["ArrowDown", "ArrowDown", "ArrowRight"],
    triggerKey: "j",
    accent: "#e8283c",
    moveName: "SIGNAL FLARE",
    target: "contactmarkflorencio@gmail.com",
    url: "mailto:contactmarkflorencio@gmail.com",
    resultText: "TRANSMISSION SENT",
  },
  {
    id: "github",
    keys: ["ArrowRight", "ArrowDown", "ArrowDown"],
    triggerKey: "k",
    accent: "#ff8a5b",
    moveName: "ARCHIVE DIVE",
    target: "github.com/Not-PvP",
    url: "https://github.com/Not-PvP",
    resultText: "VAULT UNLOCKED",
  },
  {
    id: "linkedin",
    keys: ["ArrowLeft", "ArrowRight", "ArrowDown"],
    triggerKey: "l",
    accent: "#c9a227",
    moveName: "NETWORK LINK",
    target: "linkedin.com/in/mark-angelo-florencio",
    url: "https://www.linkedin.com/in/mark-angelo-florencio-597765423/",
    resultText: "CONNECTION FORGED",
  },
];

const ARROW_GLYPH: Record<ArrowKey, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
};
const ARROW_KEYS = Object.keys(ARROW_GLYPH) as ArrowKey[];
// Rotation applied to the nub/trail group so a single "kicks upward"
// animation can be reused for every swipe direction — see the pad JSX.
const DIR_ANGLE: Record<ArrowKey, number> = {
  ArrowUp: 0,
  ArrowRight: 90,
  ArrowDown: 180,
  ArrowLeft: 270,
};
// Regular flat-topped octagon (radius 64, center 80,80) used for the
// fight-stick gate — vertices land so the N/E/S/W faces are flat, like
// a real arcade restrictor plate.
const OCTAGON_VERTS: [number, number][] = [
  [104.49, 20.87],
  [139.13, 55.51],
  [139.13, 104.49],
  [104.49, 139.13],
  [55.51, 139.13],
  [20.87, 104.49],
  [20.87, 55.51],
  [55.51, 20.87],
];
const MAX_BUFFER = Math.max(...MOVES.map((m) => m.keys.length));
const BUFFER_TIMEOUT_MS = 1600;

// Swipe gestures feed the exact same ArrowKey buffer as the keyboard does —
// a swipe up is indistinguishable from pressing ArrowUp once it lands in
// `buffer`. That's what lets touch and keyboard share every bit of combo-
// matching logic below instead of needing a parallel implementation.
const SWIPE_MIN_DISTANCE = 28; // px — below this it reads as a tap, not a swipe
const SWIPE_MAX_DURATION = 650; // ms — slower drags don't count as a swipe

// ── Background: shared ambient + cursor-reactive ember system ──────────

function sequencesMatch(tail: ArrowKey[], seq: ArrowKey[]): boolean {
  if (tail.length !== seq.length) return false;
  return tail.every((k, i) => k === seq[i]);
}

// ── Main ─────────────────────────────────────────────────────────────
export default function Contact() {
  const [smash, setSmash] = useState<boolean>(false);
  const [smashDone, setSmashDone] = useState<boolean>(false);
  const [titleIn, setTitleIn] = useState<boolean>(false);
  const [listIn, setListIn] = useState<boolean>(false);
  const [shaking, setShaking] = useState<boolean>(false);
  const [miss, setMiss] = useState<boolean>(false);
  const [buffer, setBuffer] = useState<ArrowKey[]>([]);
  const [lastTrigger, setLastTrigger] = useState<string | null>(null);
  const [burst, setBurst] = useState<{ text: string; color: string } | null>(
    null
  );

  const [isTouch, setIsTouch] = useState<boolean>(false);
  // Transient — set on every valid swipe, cleared ~450ms later. Drives
  // the momentary nub-kick/trail-streak flash and the brightest face
  // highlight on the gate. `padPulse` is bumped alongside it purely to
  // force the nub/trail elements to remount and replay their keyframe
  // even when the same direction swipes twice in a row.
  const [padDir, setPadDir] = useState<ArrowKey | null>(null);
  const [padPulse, setPadPulse] = useState<number>(0);

  const burstActiveRef = useRef<boolean>(false);
  const bufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const padDirTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const inViewRef = useRef<boolean>(false);
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  // Mirrors `buffer` but is readable/writable synchronously, in the same
  // tick as the triggering key/touch event. executeMove's window.open only
  // survives the browser's popup blocker when called synchronously inside
  // the original user gesture — reading the buffer out of a setState
  // updater (which React can defer past that gesture) silently breaks
  // that, so combo/swipe completion checks read this ref instead.
  const bufferRef = useRef<ArrowKey[]>([]);

  function updateBuffer(next: ArrowKey[]) {
    bufferRef.current = next;
    setBuffer(next);
  }

  // Detect no-hover devices once on mount so we can swap "PRESS THE COMBO"
  // copy and the trigger-key badge for a dedicated swipe pad — matches the
  // same (hover: none) signal Background.tsx already uses to hide its
  // cursor glow on touch.
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    // hover:none alone misses some real touch devices (certain Android
    // browsers, foldables, anything with a paired mouse/stylus), so we
    // OR it with a hard capability check rather than relying on the
    // media query in isolation.
    const hasTouchSupport =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    setIsTouch(mq.matches || hasTouchSupport);
    const onChange = (e: MediaQueryListEvent) =>
      setIsTouch(e.matches || hasTouchSupport);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    burstActiveRef.current = burst !== null;
  }, [burst]);

  // Fire the entrance animation the first time this section scrolls into
  // view, instead of on page mount — otherwise Contact (mounted along
  // with every other section up front) finishes fading in before the
  // user has scrolled anywhere near it.
  //
  // Sequence: a full-screen "FINISH HIM" slams in huge (like the game's
  // announcer callout), holds a beat, then the whole overlay shrinks and
  // flies into the real inline title's position. The instant it arrives,
  // we swap to the normal in-flow heading and reveal the rest of the UI —
  // one continuous zoom rather than two elements trading off.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSmash(true);
          const tShrink = setTimeout(() => setSmashDone(true), 900);
          const t1 = setTimeout(() => setTitleIn(true), 950);
          const t2 = setTimeout(() => setListIn(true), 1150);
          pendingTimers.current.push(tShrink, t1, t2);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timers = pendingTimers.current;
    return () => {
      timers.forEach(clearTimeout);
      if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
      if (padDirTimerRef.current) clearTimeout(padDirTimerRef.current);
    };
  }, []);

  function executeMove(move: ComboMove) {
    if (burstActiveRef.current) return;

    // Short double-pulse on landing a move — silently does nothing on
    // desktop browsers/devices without the Vibration API rather than
    // throwing, so this is safe to call unconditionally. playHit() is
    // similarly a no-op while muted.
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([18, 40, 30]);
    }
    playHit();

    updateBuffer([]);
    setLastTrigger(null);
    setShaking(true);
    setBurst({ text: move.resultText, color: move.accent });

    // window.open must fire synchronously inside the user gesture (this
    // click/keydown handler) or browsers treat it as an unrequested popup
    // and silently block it. Opening it here — instead of inside the
    // setTimeout below — is what makes the links actually work; the burst
    // animation still plays out on its own timers afterward.
    window.open(move.url, "_blank", "noopener,noreferrer");

    const shakeTimer = setTimeout(() => setShaking(false), 380);
    const clearTimer = setTimeout(() => setBurst(null), 900);

    pendingTimers.current.push(shakeTimer, clearTimer);
  }

  function flashMiss() {
    setMiss(true);
    setTimeout(() => setMiss(false), 320);
  }

  function armBufferTimeout() {
    if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
    bufferTimerRef.current = setTimeout(() => {
      updateBuffer([]);
      setLastTrigger(null);
    }, BUFFER_TIMEOUT_MS);
  }

  // Only capture arrow keys while this section is actually on screen —
  // otherwise scrolling past it on a combined page would still hijack
  // every arrow-key press site-wide.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) {
          updateBuffer([]);
          setLastTrigger(null);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Real keyboard combo detection: arrow keys accumulate into a buffer,
  // then a trigger letter checks that buffer's tail against every move.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (burstActiveRef.current || !inViewRef.current) return;

      if ((ARROW_KEYS as string[]).includes(e.key)) {
        e.preventDefault();
        updateBuffer([...bufferRef.current, e.key as ArrowKey].slice(-MAX_BUFFER));
        armBufferTimeout();
        return;
      }

      const lower = e.key.toLowerCase();
      const candidate = MOVES.find((m) => m.triggerKey === lower);
      if (!candidate) return;

      e.preventDefault();
      setLastTrigger(lower.toUpperCase());
      const tail = bufferRef.current.slice(-candidate.keys.length);
      updateBuffer([]);
      if (sequencesMatch(tail, candidate.keys)) {
        executeMove(candidate);
      } else {
        flashMiss();
        setTimeout(() => setLastTrigger(null), 320);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent, move: ComboMove) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      executeMove(move);
    }
  }

  // ── Swipe pad: touch equivalent of the keyboard combo input ─────────
  // Scoped to a small dedicated pad rather than the whole section, so a
  // visitor can still scroll the page normally everywhere else in
  // Contact — only gestures that start inside the pad are read as combo
  // input. There's no separate "trigger key" on touch, so completing a
  // full sequence fires the move immediately instead of arming and
  // waiting for a letter press.
  function handlePadTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    swipeStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }

  function handlePadTouchEnd(e: React.TouchEvent) {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || burstActiveRef.current) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const duration = Date.now() - start.time;
    const distance = Math.max(Math.abs(dx), Math.abs(dy));

    if (distance < SWIPE_MIN_DISTANCE || duration > SWIPE_MAX_DURATION) return;

    const direction: ArrowKey =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "ArrowRight"
          : "ArrowLeft"
        : dy > 0
        ? "ArrowDown"
        : "ArrowUp";

    setPadDir(direction);
    setPadPulse((n) => n + 1);
    if (padDirTimerRef.current) clearTimeout(padDirTimerRef.current);
    padDirTimerRef.current = setTimeout(() => setPadDir(null), 450);

    const next = [...bufferRef.current, direction].slice(-MAX_BUFFER);
    const completed = MOVES.find((m) => sequencesMatch(next, m.keys));
    if (completed) {
      updateBuffer([]);
      executeMove(completed);
      return;
    }
    // Wrong direction anywhere in a sequence-in-progress reads as a
    // miss rather than silently building toward nothing — same feedback
    // language as a mistimed keyboard combo.
    const couldStillMatch = MOVES.some((m) =>
      m.keys.slice(0, next.length).every((k, i) => k === next[i])
    );
    if (!couldStillMatch) {
      updateBuffer([]);
      flashMiss();
      return;
    }
    updateBuffer(next);
    armBufferTimeout();
  }

  return (
    <div
      ref={sectionRef}
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "transparent",
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        boxSizing: "border-box",
      }}
    >
      <style>{`

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* The giant announcer-style "FINISH HIM" slam: punches onto the
           full screen oversized, holds a beat, then collapses down into
           the spot where the real inline title sits. */
        @keyframes finishHimSlam {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(2.6); filter: blur(10px); }
          18% { opacity: 1; transform: translate(-50%, -50%) scale(1.32); filter: blur(0px); }
          26% { transform: translate(-50%, -50%) scale(1.22); }
          70% { opacity: 1; transform: translate(-50%, -50%) scale(1.22); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.34); }
        }
        @keyframes finishHimFlash {
          0%, 14% { opacity: 0; }
          17% { opacity: 0.9; }
          32% { opacity: 0; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; text-shadow: 0 0 28px rgba(232,40,60,0.55), 0 0 60px rgba(232,40,60,0.25); }
          92% { opacity: 1; text-shadow: 0 0 28px rgba(232,40,60,0.55), 0 0 60px rgba(232,40,60,0.25); }
          93% { opacity: 0.4; text-shadow: none; }
          94% { opacity: 1; text-shadow: 0 0 28px rgba(232,40,60,0.55), 0 0 60px rgba(232,40,60,0.25); }
          96% { opacity: 0.6; text-shadow: none; }
          97% { opacity: 1; text-shadow: 0 0 28px rgba(232,40,60,0.55), 0 0 60px rgba(232,40,60,0.25); }
        }
        @keyframes screenShake {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-6px, 3px); }
          40% { transform: translate(5px, -4px); }
          60% { transform: translate(-4px, -2px); }
          80% { transform: translate(3px, 3px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes burstIn {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
          25% { transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes flashOut {
          from { opacity: 0.85; }
          to { opacity: 0; }
        }
        @keyframes slotPop {
          0% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        @keyframes missShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes padCoreBreathe {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes padGlowBreathe {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes padNubKick {
          0% { transform: translateY(0) scale(1); }
          28% { transform: translateY(-16px) scale(1.15); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes padTrailStreak {
          0% { opacity: 0; transform: scaleY(0.4) translateY(0); }
          25% { opacity: 0.95; }
          100% { opacity: 0; transform: scaleY(1.6) translateY(-22px); }
        }
        .mk-pad-core { transform-origin: 80px 80px; animation: padCoreBreathe 2.6s ease-in-out infinite; }
        .mk-pad-glow { animation: padGlowBreathe 2.6s ease-in-out infinite; }
        .mk-pad-nub { animation: padNubKick 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .mk-pad-trail { animation: padTrailStreak 0.45s ease-out; }

        .mk-shake { animation: screenShake 0.38s ease-in-out; }

        .mk-move {
          transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;
        }
        .mk-move:hover, .mk-move:focus-visible {
          background: rgba(255,255,255,0.035);
          border-color: rgba(255,138,91,0.6);
          transform: translateX(4px);
        }
        .mk-move:focus-visible {
          outline: 2px solid #ff8a5b;
          outline-offset: 2px;
        }
        .mk-move:active {
          transform: translateX(2px) scale(0.99);
        }

        @media (prefers-reduced-motion: reduce) {
          .mk-fade, .mk-title { animation: none !important; opacity: 1 !important; transform: none !important; text-shadow: 0 0 28px rgba(232,40,60,0.4) !important; }
          .mk-shake { animation: none !important; }
          .mk-move { transform: none !important; }
          .mk-finish-overlay { display: none !important; }
          .mk-pad-core, .mk-pad-glow, .mk-pad-nub, .mk-pad-trail { animation: none !important; }
        }

      `}</style>

      {/* Giant announcer-callout overlay: fires once on scroll-in, slams
          FINISH HIM onto the full screen, then collapses toward the real
          title's position before handing off to it. Fixed + centered so
          it works the same regardless of scroll position. */}
      {smash && !smashDone && (
        <>
          <div
            className="mk-finish-overlay"
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 8,
              background: "#e8283c",
              animation: "finishHimFlash 0.9s ease-out both",
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}
          />
          <div
            className="mk-finish-overlay"
            aria-hidden="true"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              zIndex: 9,
              fontFamily: "'Anton', sans-serif",
              fontSize: "clamp(48px, 9vw, 104px)",
              lineHeight: 0.92,
              color: "#f2f2f2",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              textShadow: "0 0 40px rgba(232,40,60,0.8), 0 0 90px rgba(232,40,60,0.4)",
              animation: "finishHimSlam 0.9s cubic-bezier(0.16, 0.9, 0.2, 1) both",
              pointerEvents: "none",
            }}
          >
            FINISH HIM
          </div>
        </>
      )}


      <div
        className={shaking ? "mk-shake" : undefined}
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "720px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <p
            className="mk-fade"
            style={{
              margin: 0,
              fontSize: "12px",
              letterSpacing: "0.35em",
              color: "#c41e1e",
              fontWeight: 700,
              opacity: titleIn ? 1 : 0,
              animation: titleIn ? "fadeUp 0.5s ease-out both" : "none",
            }}
          >
            NO MERCY
          </p>
          <h1
            className={titleIn ? "mk-title mk-fade" : "mk-fade"}
            style={{
              margin: "4px 0 12px",
              fontFamily: "'Anton', sans-serif",
              fontSize: "clamp(48px, 9vw, 104px)",
              lineHeight: 0.92,
              color: "#f2f2f2",
              letterSpacing: "0.02em",
              opacity: titleIn ? 1 : 0,
              animation: titleIn
                ? "fadeUp 0.6s ease-out 0.08s both, flicker 5.5s ease-in-out infinite 1.2s"
                : "none",
            }}
          >
            FINISH HIM
          </h1>
          <p
            className="mk-fade"
            style={{
              margin: 0,
              fontSize: "12px",
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.45)",
              opacity: titleIn ? 1 : 0,
              animation: titleIn
                ? "fadeUp 0.5s ease-out 0.16s both"
                : "none",
            }}
          >
            {isTouch ? "SWIPE THE COMBO BELOW" : "PRESS THE COMBO"}
          </p>
        </div>

        {/* ── Live input buffer HUD: 3 arrow slots + 1 trigger-key slot ── */}
        <div
          className="mk-fade"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            marginBottom: "32px",
            opacity: titleIn ? 1 : 0,
            animation: titleIn ? "fadeUp 0.5s ease-out 0.24s both" : "none",
          }}
        >
          {Array.from({ length: MAX_BUFFER + 1 }).map((_, i) => {
            const isTriggerSlot = i === MAX_BUFFER;
            const glyph = isTriggerSlot
              ? lastTrigger
              : buffer[i]
              ? ARROW_GLYPH[buffer[i]]
              : null;
            return (
              <div
                key={i}
                style={{
                  width: "34px",
                  height: "34px",
                  border: `1px solid ${
                    miss
                      ? "rgba(232,40,60,0.7)"
                      : glyph
                      ? "rgba(255,138,91,0.6)"
                      : "rgba(255,255,255,0.12)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  color: glyph ? "#ff8a5b" : "rgba(255,255,255,0.2)",
                  animation: glyph ? "slotPop 0.15s ease-out" : miss ? "missShake 0.3s ease-in-out" : "none",
                }}
              >
                {glyph ?? "·"}
              </div>
            );
          })}
        </div>

        {isTouch && (
          <div
            className="mk-fade"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              margin: "0 auto 32px",
              opacity: titleIn ? 1 : 0,
              animation: titleIn ? "fadeUp 0.5s ease-out 0.3s both" : "none",
            }}
          >
            <div
              onTouchStart={handlePadTouchStart}
              onTouchEnd={handlePadTouchEnd}
              style={{
                position: "relative",
                width: "176px",
                height: "176px",
                touchAction: "none",
              }}
            >
              {/* Ambient glow ring behind the gate — idle breathing pulse */}
              <div
                className="mk-pad-glow"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: "18px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(232,40,60,0.18) 0%, transparent 72%)",
                  pointerEvents: "none",
                }}
              />

              <svg
                viewBox="0 0 160 160"
                width="176"
                height="176"
                aria-hidden="true"
                style={{ position: "relative", pointerEvents: "none" }}
              >
                <defs>
                  <radialGradient id="mkPadCore" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ff8a5b" stopOpacity="0.9" />
                    <stop offset="55%" stopColor="#e8283c" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#e8283c" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* 8 gate faces — cardinal faces (N/E/S/W) light up from
                    dim -> armed (mid-combo) -> flash (just swiped/miss);
                    diagonal faces stay a fixed dim tone as pure structure. */}
                {OCTAGON_VERTS.map(([x1, y1], i) => {
                  const [x2, y2] = OCTAGON_VERTS[(i + 1) % OCTAGON_VERTS.length];
                  const cardinal: ArrowKey | null =
                    i === 7 ? "ArrowUp" : i === 1 ? "ArrowRight" : i === 3 ? "ArrowDown" : i === 5 ? "ArrowLeft" : null;

                  let stroke = "rgba(255,255,255,0.14)";
                  let width = 2;
                  if (cardinal) {
                    if (miss) {
                      stroke = "#e8283c";
                      width = 4;
                    } else if (padDir === cardinal) {
                      stroke = "#ff8a5b";
                      width = 4;
                    } else if (buffer.includes(cardinal)) {
                      stroke = "rgba(255,138,91,0.55)";
                      width = 3;
                    } else {
                      stroke = "rgba(255,255,255,0.22)";
                    }
                  }

                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={stroke}
                      strokeWidth={width}
                      strokeLinecap="round"
                      style={{ transition: "stroke 0.15s ease, stroke-width 0.15s ease" }}
                    />
                  );
                })}

                <circle
                  className="mk-pad-core"
                  cx={80}
                  cy={80}
                  r={26}
                  fill="url(#mkPadCore)"
                />

                {/* Nub + trail live in one rotated group so a single
                    "kick upward" animation reads correctly for every
                    swipe direction — see DIR_ANGLE. */}
                <g style={{ transform: `rotate(${DIR_ANGLE[padDir ?? "ArrowUp"]}deg)`, transformOrigin: "80px 80px" }}>
                  {padDir && (
                    <rect
                      key={`trail-${padPulse}`}
                      className="mk-pad-trail"
                      x={76}
                      y={34}
                      width={8}
                      height={26}
                      rx={4}
                      fill={miss ? "#e8283c" : "#ff8a5b"}
                      style={{ transformOrigin: "80px 80px" }}
                    />
                  )}
                  <circle
                    key={`nub-${padPulse}`}
                    className="mk-pad-nub"
                    cx={80}
                    cy={80}
                    r={11}
                    fill={miss ? "#e8283c" : "#f2f2f2"}
                    style={{ transformOrigin: "80px 80px" }}
                  />
                </g>
              </svg>
            </div>

            <span
              style={{
                fontSize: "9.5px",
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              SWIPE THE GATE
            </span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {MOVES.map((move, i) => (
            <button
              key={move.id}
              type="button"
              className="mk-move mk-fade"
              onClick={() => executeMove(move)}
              onKeyDown={(e) => handleKeyDown(e, move)}
              aria-label={
                isTouch
                  ? `Execute ${move.moveName}: swipe ${move.keys
                      .map((k) => ARROW_GLYPH[k])
                      .join(" ")} on the gate above, or activate to open ${move.target}`
                  : `Execute ${move.moveName}: press ${move.keys
                      .map((k) => ARROW_GLYPH[k])
                      .join(" ")} then ${move.triggerKey.toUpperCase()}, or activate to open ${move.target}`
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                width: "100%",
                padding: "16px 18px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                textAlign: "left",
                font: "inherit",
                color: "inherit",
                opacity: listIn ? 1 : 0,
                animation: listIn
                  ? `fadeUp 0.45s ease-out ${0.1 + i * 0.08}s both`
                  : "none",
              }}
            >
              <span
                className="mk-notation"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  flexShrink: 0,
                  width: isTouch ? "auto" : "108px",
                }}
              >
                {move.keys.map((k, gi) => (
                  <span
                    key={gi}
                    style={{
                      fontSize: "15px",
                      color: "rgba(255,255,255,0.55)",
                      width: "18px",
                      textAlign: "center",
                    }}
                  >
                    {ARROW_GLYPH[k]}
                  </span>
                ))}
                {!isTouch && (
                  <>
                    <span
                      style={{
                        fontSize: "9px",
                        color: "rgba(255,255,255,0.3)",
                        margin: "0 2px",
                      }}
                    >
                      +
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "3px",
                        color: "#0a0a0a",
                        background: move.accent,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {move.triggerKey.toUpperCase()}
                    </span>
                  </>
                )}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: "#f2f2f2",
                    marginBottom: "2px",
                  }}
                >
                  {move.moveName}
                </div>
                <div
                  style={{
                    fontSize: "10.5px",
                    color: "rgba(255,255,255,0.4)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {move.target}
                </div>
              </div>

              <span
                style={{
                  flexShrink: 0,
                  fontSize: "9.5px",
                  letterSpacing: "0.08em",
                  color: move.accent,
                  border: `1px solid ${move.accent}`,
                  padding: "5px 10px",
                }}
              >
                EXECUTE
              </span>
            </button>
          ))}
        </div>
      </div>

      {burst && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 5,
              background: burst.color,
              opacity: 0.85,
              animation: "flashOut 0.5s ease-out forwards",
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}
          />
          <div
            aria-live="polite"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              zIndex: 6,
              fontFamily: "'Anton', sans-serif",
              fontSize: "clamp(32px, 6vw, 64px)",
              color: "#f2f2f2",
              letterSpacing: "0.03em",
              textShadow: `0 0 30px ${burst.color}`,
              animation: "burstIn 0.9s ease-out forwards",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {burst.text}
          </div>
        </>
      )}
    </div>
  );
}