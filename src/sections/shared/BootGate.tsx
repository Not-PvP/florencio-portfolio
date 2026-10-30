import { useCallback, useEffect, useRef, useState } from "react";
import heroPortrait from "../../assets/hero-portrait.jpg";
import { playConfirm, startSoundFromGesture } from "./audio";

interface BootGateProps {
  onDismiss: () => void;
}

export default function BootGate({ onDismiss }: BootGateProps) {
  const [leaving, setLeaving] = useState(false);
  const [ready, setReady] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const capped = new Promise<void>((resolve) => setTimeout(resolve, 1200));
    Promise.race([fontsReady.then(() => {}), capped]).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const dismiss = useCallback(() => {
    if (leaving || startedRef.current) return;
    startedRef.current = true;
    startSoundFromGesture();
    playConfirm();
    setLeaving(true);
    setTimeout(onDismiss, 300);
  }, [leaving, onDismiss]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        dismiss();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Title screen"
      onClick={dismiss}
      className={`mk-title-root${leaving ? " mk-title-leave" : ""}${ready ? " mk-title-ready" : ""}`}
    >
      <style>{`
        .mk-title-root {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          overflow-y: auto;
          box-sizing: border-box;
          background: var(--mk-bg);
          font-family: var(--mk-font-body);
          cursor: pointer;
          user-select: none;
        }
        .mk-title-leave { opacity: 0; transition: opacity 0.3s steps(3); }
        .mk-title-card {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          align-items: end;
          gap: 56px;
          width: 100%;
          max-width: 980px;
          opacity: 0;
        }
        .mk-title-frame {
          position: relative;
          width: 260px;
          height: 330px;
          margin: 0 0 12px;
          border: 4px solid var(--mk-cream);
          background: #1a1210;
          box-shadow: 10px 10px 0 var(--mk-red);
          transform: rotate(-2deg);
          overflow: hidden;
        }
        .mk-title-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 4%;
          /* Face sits left of the photo's center, so pan right to center it. */
          transform: translateX(33px) scale(1.35);
          transform-origin: center 4%;
          image-rendering: auto;
          filter: saturate(0.78) contrast(1.12) brightness(0.9) hue-rotate(-12deg);
        }
        .mk-title-p1 {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
          padding: 4px 10px;
          font-size: 15px;
          font-weight: 700;
          color: var(--mk-bg);
          background: var(--mk-cream);
        }
        .mk-title-brand {
          margin: 0;
          font-family: var(--mk-font-display);
          font-weight: 400;
          font-size: clamp(76px, 13vw, 168px);
          line-height: 0.85;
          color: var(--mk-orange);
          text-shadow: none;
        }
        .mk-title-name { margin: 18px 0 0; font-size: 22px; font-weight: 700; color: var(--mk-cream); }
        .mk-title-line { margin: 8px 0 28px; max-width: 34ch; font-size: 17px; line-height: 1.5; color: var(--mk-text-2); }
        .mk-title-start { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 22px; }
        .mk-title-start .mk-btn { min-width: 200px; font-size: 20px; }
        .mk-title-hint { margin: 0; font-size: 14px; color: var(--mk-text-3); }
        .mk-title-cursor {
          display: inline-block;
          width: 10px;
          height: 18px;
          background: var(--mk-bg);
          animation: mk-title-blink 1s steps(1) infinite;
        }
        @keyframes mk-title-blink { 50% { opacity: 0; } }
        @keyframes mk-title-drop {
          from { transform: translateY(-40px) rotate(-2deg); opacity: 0; }
          to { transform: translateY(0) rotate(-2deg); opacity: 1; }
        }
        @keyframes mk-title-fade { to { opacity: 1; } }
        .mk-title-ready .mk-title-card { animation: mk-title-fade 0.2s steps(2) both; }
        .mk-title-ready .mk-title-frame { animation: mk-title-drop 0.4s steps(5) both; }

        @media (max-width: 720px) {
          .mk-title-root { padding-top: 32px; padding-bottom: 32px; }
          .mk-title-card { grid-template-columns: 1fr; gap: 36px; justify-items: start; }
          .mk-title-frame { width: 170px; height: 215px; box-shadow: 7px 7px 0 var(--mk-red); }
          .mk-title-name { font-size: 18px; }
        }
        @media (max-height: 560px) and (min-width: 721px) {
          .mk-title-frame { width: 190px; height: 240px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-title-card { opacity: 1 !important; animation: none !important; }
          .mk-title-frame { animation: none !important; }
          .mk-title-cursor { animation: none; }
        }
      `}</style>

      <div className="mk-title-card">
        <div className="mk-title-frame">
          <span className="mk-title-p1" aria-hidden="true">P1</span>
          <img src={heroPortrait} alt="Mark Angelo Florencio" />
        </div>

        <div>
          <h1 className="mk-title-brand">KRAM.DEV</h1>
          <p className="mk-title-name">Mark Angelo Florencio</p>
          <p className="mk-title-line">
            Software engineering student in Iloilo. I build web apps, mobile apps and games.
          </p>
          <div className="mk-title-start">
            <button type="button" className="mk-btn" autoFocus onClick={dismiss}>
              Press start
              <span className="mk-title-cursor" aria-hidden="true" />
            </button>
            <p className="mk-title-hint">Enter, space or tap. Sound turns on when you start.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
