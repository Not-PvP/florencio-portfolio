import { useEffect, useState } from "react";
import { unlockAudio } from "./audio";

interface BootGateProps {
  onDismiss: () => void;
}

export default function BootGate({ onDismiss }: BootGateProps) {
  const [leaving, setLeaving] = useState(false);
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlicker(true), 260);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  function dismiss() {
    if (leaving) return;
    unlockAudio();
    setLeaving(true);
    setTimeout(onDismiss, 420);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        dismiss();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Press start to enter the site"
      onClick={dismiss}
      className={leaving ? "mk-boot-leave" : undefined}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes mk-boot-flicker-in {
          0% { opacity: 0; }
          8% { opacity: 0.7; }
          12% { opacity: 0.1; }
          20% { opacity: 0.85; }
          26% { opacity: 0.2; }
          40% { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes mk-press-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes mk-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .mk-boot-content {
          animation: mk-boot-flicker-in 0.9s steps(1) both;
        }
        .mk-press-text {
          animation: mk-press-pulse 1.4s ease-in-out infinite;
        }
        .mk-boot-leave {
          transition: opacity 0.4s ease;
          opacity: 0;
        }
        .mk-scanline-sweep {
          animation: mk-scanline 3.2s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-boot-content { animation: none !important; opacity: 1 !important; }
          .mk-press-text { animation: none !important; }
          .mk-scanline-sweep { display: none !important; }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="mk-scanline-sweep"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "120px",
          background:
            "linear-gradient(180deg, transparent, rgba(232,40,60,0.06), transparent)",
          pointerEvents: "none",
        }}
      />

      {flicker && (
        <div className="mk-boot-content" style={{ textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: "12px",
              letterSpacing: "0.4em",
              color: "#c41e1e",
              fontWeight: 700,
            }}
          >
            MATCH READY
          </p>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Anton', sans-serif",
              fontSize: "clamp(40px, 8vw, 84px)",
              color: "#f2f2f2",
              letterSpacing: "0.03em",
              textShadow:
                "0 0 30px rgba(232,40,60,0.55), 0 0 70px rgba(232,40,60,0.25)",
            }}
          >
            MARK ANGELO FLORENCIO
          </h1>
          <p
            className="mk-press-text"
            style={{
              marginTop: "40px",
              fontSize: "14px",
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            PRESS START
          </p>
        </div>
      )}
    </div>
  );
}