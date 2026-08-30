import { useEffect, useRef, useState } from "react";
import { playUnlock } from "./audio";

// ── Hidden global combo ──────────────────────────────────────────────
// Classic Konami shape (↑↑↓↓←→←→) plus a trigger letter, reusing the
// exact same buffer/trigger pattern Contact.tsx uses for its visible
// moves — this one just listens site-wide instead of only while a
// section is in view, since it's meant to be found, not advertised.
type Key = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
const SECRET_SEQUENCE: Key[] = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
];
const SECRET_TRIGGER = "b";
const ARROW_KEYS: Key[] = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const BUFFER_TIMEOUT_MS = 2200;

export default function EasterEgg() {
  const [unlocked, setUnlocked] = useState(false);
  const bufferRef = useRef<Key[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function reset() {
      bufferRef.current = [];
    }
    function armTimeout() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(reset, BUFFER_TIMEOUT_MS);
    }
    function onKeyDown(e: KeyboardEvent) {
      // Don't hijack input fields — only listen when nothing is being typed into.
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ((ARROW_KEYS as string[]).includes(e.key)) {
        bufferRef.current = [...bufferRef.current, e.key as Key].slice(
          -SECRET_SEQUENCE.length
        );
        armTimeout();
        return;
      }

      if (e.key.toLowerCase() !== SECRET_TRIGGER) return;
      const tail = bufferRef.current;
      const matches =
        tail.length === SECRET_SEQUENCE.length &&
        tail.every((k, i) => k === SECRET_SEQUENCE[i]);
      if (matches) {
        setUnlocked(true);
        playUnlock();
      }
      reset();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!unlocked) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Secret unlocked"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.82)",
        padding: "24px",
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
      }}
      onClick={() => setUnlocked(false)}
    >
      <style>{`
        @keyframes mk-egg-in {
          0% { opacity: 0; transform: scale(0.85); }
          60% { opacity: 1; transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        .mk-egg-panel { animation: mk-egg-in 0.4s cubic-bezier(0.2,0.8,0.2,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .mk-egg-panel { animation: none !important; }
        }
      `}</style>
      <div
        className="mk-egg-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "440px",
          width: "100%",
          border: "2px solid #e8283c",
          borderRadius: "12px",
          background: "#0d0d0d",
          padding: "32px 28px",
          textAlign: "center",
          boxShadow: "0 0 60px rgba(232,40,60,0.35)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "11px",
            letterSpacing: "0.35em",
            color: "#e8283c",
            fontWeight: 700,
          }}
        >
          SECRET UNLOCKED
        </p>
        <h2
          style={{
            margin: "0 0 16px",
            fontFamily: "'Anton', sans-serif",
            fontSize: "28px",
            color: "#f2f2f2",
            letterSpacing: "0.02em",
          }}
        >
          DEVELOPER MODE
        </h2>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "13px",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.65)",
          }}
        >
          {/* Swap this for whatever's actually fun to reveal — a hidden
              project, a GitHub contribution graph embed, a blooper reel,
              a real Easter egg link. Placeholder for now. */}
          You found the hidden input. This is the spot for something only
          the people who actually dig around get to see.
        </p>
        <button
          type="button"
          onClick={() => setUnlocked(false)}
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#0a0a0a",
            background: "#e8283c",
            border: "none",
            borderRadius: "4px",
            padding: "10px 22px",
            cursor: "pointer",
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}