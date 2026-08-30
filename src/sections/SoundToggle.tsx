import { useEffect, useState } from "react";
import { isMuted, subscribeMuted, toggleMuted } from "./audio";

// ── Sound toggle ──────────────────────────────────────────────────────
// A speaker glyph is a fine icon but it's static and forgettable next to
// the rest of the HUD. This instead reads as a tiny live waveform: five
// bars bouncing at staggered speeds when sound is on, and — playing off
// the health bar sitting right above it — flatlining dead level when
// muted, like a monitor with no pulse. Same gold-bevel HUD chrome as
// the health bar plate so the two widgets read as one system.
export default function SoundToggle() {
  const [muted, setMutedState] = useState(true);

  useEffect(() => {
    setMutedState(isMuted());
    return subscribeMuted(setMutedState);
  }, []);

  return (
    <button
      type="button"
      onClick={() => toggleMuted()}
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
      aria-pressed={!muted}
      className="mk-sound-btn"
      style={{
        position: "fixed",
        left: "18px",
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
          background: linear-gradient(150deg, #1a1414 0%, #0a0a0a 100%);
          border: 1px solid rgba(255,197,120,0.4);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.5);
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

        .mk-eq-bar {
          width: 3px;
          border-radius: 1px;
          background: rgba(255,255,255,0.35);
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