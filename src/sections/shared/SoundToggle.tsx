import { useEffect, useState } from "react";
import { isMuted, subscribeMuted, toggleMuted } from "./audio";

interface SoundToggleProps {
  active?: boolean;
}

export default function SoundToggle({ active = true }: SoundToggleProps) {
  const [muted, setMutedState] = useState(() => isMuted());
  const [pulse, setPulse] = useState(false);

  useEffect(() => subscribeMuted(setMutedState), []);

  useEffect(() => {
    if (!active) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const start = window.setTimeout(() => setPulse(true), 700);
    const stop = window.setTimeout(() => setPulse(false), 700 + 2600);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [active]);

  return (
    <button
      type="button"
      onClick={() => {
        setPulse(false);
        toggleMuted();
      }}
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
      aria-pressed={!muted}
      className={`mk-sound-btn${pulse ? " mk-sound-pulse" : ""}`}
      style={{
        position: "fixed",
        right: "18px",
        bottom: "18px",
        zIndex: 20,
        width: "44px",
        height: "44px",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "3px",
      }}
    >
      <style>{`
        .mk-sound-btn {
          background: linear-gradient(150deg, #241a17 0%, #0a0a0a 100%);
          border: 1px solid rgba(255,197,120,0.55);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.5), 0 0 8px rgba(255,170,90,0.18);
          transition: box-shadow 0.2s ease, background 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
        }
        .mk-sound-btn[aria-pressed="true"] {
          border-color: rgba(255,138,61,0.75);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.4), 0 0 14px rgba(232,90,40,0.4);
        }
        .mk-sound-btn:hover { transform: scale(1.08); }
        .mk-sound-btn:active { transform: scale(0.94); }
        .mk-sound-btn:focus-visible {
          outline: 2px solid #ff8a5b;
          outline-offset: 3px;
        }

        @keyframes mk-sound-pulse-ring {
          0%, 100% { box-shadow: inset 0 0 0 1px rgba(0,0,0,0.5), 0 0 8px rgba(255,170,90,0.18); transform: scale(1); }
          50% { box-shadow: inset 0 0 0 1px rgba(0,0,0,0.5), 0 0 22px rgba(255,170,90,0.65); transform: scale(1.1); }
        }
        .mk-sound-pulse {
          animation: mk-sound-pulse-ring 1.3s ease-in-out 2;
        }

        .mk-eq-bar {
          width: 3px;
          border-radius: 1px;
          background: rgba(255,255,255,0.55);
          height: 4px;
          transform-origin: center;
          transition: background 0.25s ease, height 0.25s ease;
        }
        .mk-sound-btn[aria-pressed="true"] .mk-eq-bar {
          background: linear-gradient(180deg, #ffd23f, #e8283c);
          animation-name: mk-eq-bounce;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }
        .mk-sound-btn[aria-pressed="true"] .mk-eq-bar:nth-child(1) { animation-duration: 0.62s; animation-delay: -0.1s; }
        .mk-sound-btn[aria-pressed="true"] .mk-eq-bar:nth-child(2) { animation-duration: 0.48s; animation-delay: -0.4s; }
        .mk-sound-btn[aria-pressed="true"] .mk-eq-bar:nth-child(3) { animation-duration: 0.71s; animation-delay: -0.2s; }
        .mk-sound-btn[aria-pressed="true"] .mk-eq-bar:nth-child(4) { animation-duration: 0.53s; animation-delay: -0.55s; }
        .mk-sound-btn[aria-pressed="true"] .mk-eq-bar:nth-child(5) { animation-duration: 0.66s; animation-delay: -0.3s; }

        @keyframes mk-eq-bounce {
          0% { height: 4px; }
          100% { height: 18px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .mk-sound-btn[aria-pressed="true"] .mk-eq-bar {
            animation: none !important;
          }
          .mk-sound-btn[aria-pressed="true"] .mk-eq-bar:nth-child(1) { height: 9px; }
          .mk-sound-btn[aria-pressed="true"] .mk-eq-bar:nth-child(2) { height: 15px; }
          .mk-sound-btn[aria-pressed="true"] .mk-eq-bar:nth-child(3) { height: 6px; }
          .mk-sound-btn[aria-pressed="true"] .mk-eq-bar:nth-child(4) { height: 17px; }
          .mk-sound-btn[aria-pressed="true"] .mk-eq-bar:nth-child(5) { height: 11px; }
          .mk-sound-pulse { animation: none !important; }
        }
      `}</style>
      <span className="mk-eq-bar" />
      <span className="mk-eq-bar" />
      <span className="mk-eq-bar" />
      <span className="mk-eq-bar" />
      <span className="mk-eq-bar" />
    </button>
  );
}
