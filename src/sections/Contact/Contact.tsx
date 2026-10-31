import { useCallback, useEffect, useRef, useState } from "react";
import { playFinishHim, playHit, playMiss, playSelect } from "../shared/audio";

type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

interface ComboMove {
  id: string;
  keys: ArrowKey[];
  triggerKey: string;
  accent: string;
  moveName: string;
  channel: string;
  action: string;
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
    channel: "Email",
    action: "Send email",
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
    channel: "GitHub",
    action: "Open GitHub",
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
    channel: "LinkedIn",
    action: "Connect",
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
const BUFFER_TIMEOUT_MS = 2200;

/** Finger travel (px) that registers one joystick direction. */
const PAD_STEP = 26;
/** Same direction twice in one drag needs this many steps of travel, so one flick counts once. */
const PAD_REPEAT_FACTOR = 3;

function openUrl(url: string) {
  if (url.startsWith("mailto:")) window.location.href = url;
  else window.open(url, "_blank", "noopener,noreferrer");
}

function sequencesMatch(tail: ArrowKey[], seq: ArrowKey[]): boolean {
  if (tail.length !== seq.length) return false;
  return tail.every((k, i) => k === seq[i]);
}

function detectTouch(): boolean {
  if (typeof window === "undefined") return false;
  const hasTouchSupport = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  return window.matchMedia("(hover: none)").matches || hasTouchSupport;
}

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

  const [isTouch, setIsTouch] = useState<boolean>(() => detectTouch());

  const [padDir, setPadDir] = useState<ArrowKey | null>(null);
  const [padPulse, setPadPulse] = useState<number>(0);

  const burstActiveRef = useRef<boolean>(false);
  const bufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const padDirTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const inViewRef = useRef<boolean>(false);
  const padRef = useRef<HTMLDivElement | null>(null);
  const padTouchRef = useRef<{
    id: number;
    ox: number;
    oy: number;
    last: ArrowKey | null;
  } | null>(null);
  const pendingOpenRef = useRef<string | null>(null);
  const [nub, setNub] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const bufferRef = useRef<ArrowKey[]>([]);

  const updateBuffer = useCallback((next: ArrowKey[]) => {
    bufferRef.current = next;
    setBuffer(next);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const hasTouchSupport = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const onChange = (e: MediaQueryListEvent) =>
      setIsTouch(e.matches || hasTouchSupport);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    burstActiveRef.current = burst !== null;
  }, [burst]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSmash(true);
          playFinishHim();
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

  const executeMove = useCallback((move: ComboMove, deferOpen = false) => {
    if (burstActiveRef.current) return;

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([18, 40, 30]);
    }
    playHit();

    updateBuffer([]);
    setLastTrigger(null);
    setShaking(true);
    setBurst({ text: move.resultText, color: move.accent });

    // Links open on finger-up when a drag finished the combo: a drag is not
    // a user gesture, so opening mid-drag gets blocked as a popup.
    if (deferOpen) pendingOpenRef.current = move.url;
    else openUrl(move.url);

    const shakeTimer = setTimeout(() => setShaking(false), 380);
    const clearTimer = setTimeout(() => setBurst(null), 900);

    pendingTimers.current.push(shakeTimer, clearTimer);
  }, [updateBuffer]);

  function flashMiss() {
    playMiss();
    setMiss(true);
    setTimeout(() => setMiss(false), 320);
  }

  const armBufferTimeout = useCallback(() => {
    if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
    bufferTimerRef.current = setTimeout(() => {
      updateBuffer([]);
      setLastTrigger(null);
    }, BUFFER_TIMEOUT_MS);
  }, [updateBuffer]);

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
  }, [updateBuffer]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (burstActiveRef.current || !inViewRef.current) return;

      if ((ARROW_KEYS as string[]).includes(e.key)) {
        e.preventDefault();
        playSelect(e.key === "ArrowUp" || e.key === "ArrowRight");
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
  }, [armBufferTimeout, executeMove, updateBuffer]);

  function handleKeyDown(e: React.KeyboardEvent, move: ComboMove) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      executeMove(move);
    }
  }

  function registerDirection(direction: ArrowKey) {
    playSelect(direction === "ArrowUp" || direction === "ArrowRight");
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
    setPadDir(direction);
    setPadPulse((n) => n + 1);
    if (padDirTimerRef.current) clearTimeout(padDirTimerRef.current);
    padDirTimerRef.current = setTimeout(() => setPadDir(null), 450);

    const next = [...bufferRef.current, direction].slice(-MAX_BUFFER);
    const completed = MOVES.find((m) => sequencesMatch(next, m.keys));
    if (completed) {
      updateBuffer([]);
      executeMove(completed, true);
      return;
    }

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

  function handlePadTouchStart(e: React.TouchEvent) {
    const t = e.changedTouches[0];
    padTouchRef.current = { id: t.identifier, ox: t.clientX, oy: t.clientY, last: null };
  }

  function handlePadTouchMove(e: React.TouchEvent) {
    const s = padTouchRef.current;
    if (!s) return;
    const t = Array.from(e.touches).find((x) => x.identifier === s.id);
    if (!t) return;

    let dx = t.clientX - s.ox;
    let dy = t.clientY - s.oy;
    const direction: ArrowKey =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "ArrowRight"
          : "ArrowLeft"
        : dy > 0
        ? "ArrowDown"
        : "ArrowUp";
    const travel = Math.max(Math.abs(dx), Math.abs(dy));
    const needed = direction === s.last ? PAD_STEP * PAD_REPEAT_FACTOR : PAD_STEP;

    if (travel >= needed) {
      s.last = direction;
      s.ox = t.clientX;
      s.oy = t.clientY;
      dx = 0;
      dy = 0;
      if (!burstActiveRef.current) registerDirection(direction);
    }

    // The nub follows the finger inside the ring (SVG units, viewBox is 160).
    const width = padRef.current?.getBoundingClientRect().width || 176;
    const k = 160 / width;
    const len = Math.hypot(dx, dy);
    const cap = Math.min(len, PAD_STEP);
    const scale = len > 0 ? cap / len : 0;
    setNub({ x: dx * scale * k, y: dy * scale * k });
  }

  function endPadTouch() {
    padTouchRef.current = null;
    setNub({ x: 0, y: 0 });
    const url = pendingOpenRef.current;
    pendingOpenRef.current = null;
    if (url) openUrl(url);
  }

  return (
    <div
      ref={sectionRef}
      style={{
        width: "100%",
        minHeight: "100svh",
        // Dark until the slam finishes, then a hard cut to red.
        background: smashDone ? "var(--mk-red)" : "#0a0a0a",
        fontFamily: "var(--mk-font-body)",
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
        .mk-copy-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px 14px;
          margin-top: 22px;
          font-size: 13px;
        }
        .mk-copy-addr { color: rgba(255,255,255,0.6); user-select: all; }
        .mk-copy-btn {
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          color: #f5f0e6;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 0;
          padding: 7px 12px;
          cursor: pointer;
        }
        .mk-copy-btn:hover, .mk-copy-btn:focus-visible { border-color: #ff8a5b; color: #ff8a5b; outline: none; }
        .mk-copy-status { flex-basis: 100%; text-align: center; color: #ff6b7a; min-height: 0; }
        .mk-copy-status:empty { display: none; }

        @media (max-width: 600px) {
          .mk-move-alias, .mk-move-action { display: none !important; }
        }


        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes finishHimSlam {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(1.8); }
          18% { opacity: 1; transform: translate(-50%, -50%) scale(1.18); }
          26% { transform: translate(-50%, -50%) scale(1.12); }
          70% { opacity: 1; transform: translate(-50%, -50%) scale(1.12); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.34); }
        }
        @keyframes finishHimFlash {
          0%, 14% { opacity: 0; }
          17% { opacity: 0.5; }
          32% { opacity: 0; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1;  }
          92% { opacity: 1;  }
          93% { opacity: 0.4;  }
          94% { opacity: 1;  }
          96% { opacity: 0.6;  }
          97% { opacity: 1;  }
        }
        @keyframes screenShake {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-3px, 1.5px); }
          40% { transform: translate(2.5px, -2px); }
          60% { transform: translate(-2px, -1px); }
          80% { transform: translate(1.5px, 1.5px); }
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
          from { opacity: 0.45; }
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
          28% { transform: translateY(-6px) scale(1.08); }
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

        @keyframes mk-contact-grid-pulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        .mk-contact-grid {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          animation: mk-contact-grid-pulse 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .mk-fade, .mk-title { animation: none !important; opacity: 1 !important; transform: none !important;  }
          .mk-shake { animation: none !important; }
          .mk-move { transform: none !important; }
          .mk-finish-overlay { display: none !important; }
          .mk-pad-core, .mk-pad-glow, .mk-pad-nub, .mk-pad-trail { animation: none !important; }
          .mk-contact-grid { animation: none !important; }
        }

      `}</style>

      <div
        aria-hidden="true"
        className="mk-contact-grid"
        style={{ display: "none" }}
      />

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
              fontFamily: "var(--mk-font-display)",
              fontSize: "clamp(48px, 9vw, 104px)",
              lineHeight: 0.92,
              color: "#f2f2f2",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              
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
              color: "#0a0a0a",
              fontSize: "16px",
              fontWeight: 700,
              opacity: titleIn ? 1 : 0,
              animation: titleIn ? "fadeUp 0.5s ease-out both" : "none",
            }}
          >
            FINAL ROUND
          </p>
          <h1
            className={titleIn ? "mk-title mk-fade" : "mk-fade"}
            style={{
              margin: "4px 0 12px",
              fontFamily: "var(--mk-font-display)",
              fontSize: "clamp(64px, 14vw, 168px)",
              lineHeight: 0.88,
              color: "#f5f0e6",
              textShadow: "6px 6px 0 #0a0a0a",
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
              fontSize: "17px",
              fontWeight: 700,
              color: "#0a0a0a",
              opacity: titleIn ? 1 : 0,
              animation: titleIn
                ? "fadeUp 0.5s ease-out 0.16s both"
                : "none",
            }}
          >
            {isTouch ? "Drag the joystick, or tap a move" : "Press the combo, or click a move"}
          </p>
        </div>

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
          {Array.from({ length: isTouch ? MAX_BUFFER : MAX_BUFFER + 1 }).map((_, i) => {
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
                  width: "44px",
                  height: "44px",
                  background: "#0a0a0a",
                  border: `3px solid ${
                    miss ? "#ffffff" : glyph ? "#ff8a5b" : "#0a0a0a"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  color: glyph ? "#ff8a5b" : "rgba(255,255,255,0.45)",
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
              gap: "14px",
              margin: "0 auto 32px",
              opacity: titleIn ? 1 : 0,
              animation: titleIn ? "fadeUp 0.5s ease-out 0.3s both" : "none",
            }}
          >
            <div
              ref={padRef}
              onTouchStart={handlePadTouchStart}
              onTouchMove={handlePadTouchMove}
              onTouchEnd={endPadTouch}
              onTouchCancel={endPadTouch}
              role="img"
              aria-label="Joystick. Drag in a direction to enter a combo."
              style={{
                position: "relative",
                width: "min(74vw, 290px)",
                aspectRatio: "1 / 1",
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <svg
                viewBox="0 0 200 200"
                width="100%"
                height="100%"
                aria-hidden="true"
                style={{ display: "block", pointerEvents: "none", overflow: "visible" }}
              >
                {/* Arcade stick in 3/4 view: base, restrictor gate, shaft, ball top. */}
                <ellipse cx={104} cy={160} rx={86} ry={30} fill="rgba(10,10,10,0.28)" />
                <ellipse cx={100} cy={146} rx={80} ry={36} fill="#7a1420" />
                <rect x={20} y={128} width={160} height={18} fill="#7a1420" />
                <ellipse cx={100} cy={128} rx={80} ry={36} fill="#0a0a0a" />
                <ellipse cx={100} cy={128} rx={80} ry={36} fill="none" stroke="#2a2a30" strokeWidth={3} />
                {[[34, 128], [166, 128], [100, 98], [100, 158]].map(([sx, sy]) => (
                  <rect key={`${sx}-${sy}`} x={sx - 3} y={sy - 2} width={6} height={4} fill="#3a3a42" />
                ))}

                <g transform="translate(100 128) scale(0.72 0.33) translate(-80 -80)">
                  {OCTAGON_VERTS.map(([x1, y1], i) => {
                    const [x2, y2] = OCTAGON_VERTS[(i + 1) % OCTAGON_VERTS.length];
                    const cardinal: ArrowKey | null =
                      i === 7 ? "ArrowUp" : i === 1 ? "ArrowRight" : i === 3 ? "ArrowDown" : i === 5 ? "ArrowLeft" : null;

                    let stroke = "#2e2e35";
                    let width = 3;
                    if (cardinal) {
                      if (miss) {
                        stroke = "#f5f0e6";
                        width = 5;
                      } else if (padDir === cardinal) {
                        stroke = "#ff8a5b";
                        width = 6;
                      } else if (buffer.includes(cardinal)) {
                        stroke = "#a0533a";
                        width = 5;
                      } else {
                        stroke = "#4a4a52";
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
                        strokeLinecap="square"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </g>

                {(() => {
                  // nub is in the old 160-unit space, capped near 16; tilt the stick with it.
                  const bx = 100 + nub.x * 2.4;
                  const by = 64 + nub.y * 1.5;
                  const ball = miss ? "#f5f0e6" : "#ff8a5b";
                  const ballShade = miss ? "#c9c2b6" : "#d95d00";
                  return (
                    <>
                      <ellipse cx={100 + nub.x * 1.3} cy={128 + nub.y * 0.6} rx={22} ry={9} fill="rgba(0,0,0,0.45)" />
                      <ellipse cx={100} cy={128} rx={15} ry={7} fill="#3a3a42" stroke="#0a0a0a" strokeWidth={2} />
                      <line x1={100} y1={127} x2={bx} y2={by} stroke="#0a0a0a" strokeWidth={15} strokeLinecap="round" />
                      <line x1={100} y1={127} x2={bx} y2={by} stroke="#bfb8ad" strokeWidth={8} strokeLinecap="round" />
                      <line x1={98} y1={124} x2={bx - 3} y2={by} stroke="#ece6dc" strokeWidth={2} />
                      <g
                        key={`ball-${padPulse}`}
                        className={padDir ? "mk-pad-nub" : undefined}
                        style={{ transformBox: "fill-box", transformOrigin: "center" }}
                      >
                        <circle cx={bx} cy={by} r={29} fill="#0a0a0a" />
                        <circle cx={bx} cy={by} r={26} fill={ballShade} />
                        <circle cx={bx - 3} cy={by - 4} r={22} fill={ball} />
                        <rect x={bx - 15} y={by - 17} width={9} height={6} fill="#ffe0cf" />
                        <rect x={bx - 17} y={by - 10} width={4} height={5} fill="#ffe0cf" />
                      </g>
                    </>
                  );
                })()}
              </svg>
            </div>

            <span
              style={{
                fontSize: "15px",
                letterSpacing: "0.03em",
                color: "#0a0a0a",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Drag in a direction to enter it
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
                      .join(" ")} on the gate above, or activate to open ${move.channel}`
                  : `Execute ${move.moveName}: press ${move.keys
                      .map((k) => ARROW_GLYPH[k])
                      .join(" ")} then ${move.triggerKey.toUpperCase()}, or activate to open ${move.channel}`
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                width: "100%",
                padding: "16px 18px",
                background: "#0a0a0a",
                border: "3px solid #0a0a0a",
                boxShadow: "6px 6px 0 #7a1420",
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
                      fontSize: "16px",
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
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.6)",
                        margin: "0 2px",
                      }}
                    >
                      +
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 0,
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
                    fontSize: "16px",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    color: "#f2f2f2",
                    marginBottom: "4px",
                  }}
                >
                  {move.channel}
                  <span className="mk-move-alias" style={{ marginLeft: "10px", fontSize: "13px", fontWeight: 400, color: move.accent, letterSpacing: "0.08em" }}>
                    {move.moveName}
                  </span>
                </div>
              </div>

              <span
                className="mk-move-action"
                style={{
                  flexShrink: 0,
                  fontSize: "13px",
                  letterSpacing: "0.04em",
                  color: move.accent,
                  border: `1px solid ${move.accent}`,
                  padding: "7px 12px",
                  whiteSpace: "nowrap",
                }}
              >
                {move.action}
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
              opacity: 0.45,
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
              fontFamily: "var(--mk-font-display)",
              fontSize: "clamp(32px, 6vw, 64px)",
              color: "#f2f2f2",
              letterSpacing: "0.03em",
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