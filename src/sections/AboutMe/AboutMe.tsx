import { lazy, Suspense, useEffect, useState } from "react";
import heroPortrait from "../../assets/hero-portrait.jpg";

// Lazy-loaded: the globe's land-mask bitmaps make it a heavy chunk on their
// own — worth keeping out of AboutMe's initial bundle.
const EarthGlobe = lazy(() => import("./EarthGlobe"));

const LEARNING_TAGS = [
  "WEB DEVELOPMENT",
  "DATABASES / SQL",
  "T3 STACK",
  "FLUTTER / DART",
  "REACT",
];

// Fixed frame width — no more roster/photo toggle, so this is just "how
// wide is the photo panel", not "one of two states it can be in".
const DRAWER_WIDTH = 460;
// Narrower starting width used only for the on-mount reveal animation, so
// the frame still has a little "sliding open" character on load.
const PEEK_WIDTH = 90;

export default function AboutMe() {
  const [revealed, setRevealed] = useState<boolean>(false);
  const [textIn, setTextIn] = useState<boolean>(false);

  useEffect(() => {
    const t1 = setTimeout(() => setRevealed(true), 80);
    const t2 = setTimeout(() => setTextIn(true), 520);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const drawerWidth = revealed ? DRAWER_WIDTH : PEEK_WIDTH;

  return (
    <div
      className="mk-about-root"
      style={{
        width: "100%",
        height: "100vh",
        background: "transparent",
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes globeFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-drawer { transition: none !important; }
          .mk-fade { animation: none !important; opacity: 1 !important; transform: none !important; }
          .mk-globe-slot { animation: none !important; opacity: 1 !important; }
        }

        .mk-tag {
          transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }
        .mk-tag:hover {
          border-color: #ff8a5b;
          color: #ff8a5b;
          background: rgba(232,40,60,0.08);
        }

        .mk-corner-glow {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background:
            radial-gradient(ellipse 38% 50% at 100% 0%, rgba(196, 30, 30, 0.38), transparent 70%),
            radial-gradient(ellipse 38% 50% at 100% 100%, rgba(196, 30, 30, 0.38), transparent 70%);
        }

        /* Globe — anchored to the right edge of the copy column, mostly
           cropped off-screen. Scales down at narrower viewports so it
           never crowds the text; hidden below 1080px where there isn't
           room for it at all. */
        .mk-globe-slot {
          position: absolute;
          top: 50%;
          right: var(--globe-right, -1750px);
          transform: translateY(-50%) scale(var(--globe-scale, 1));
          z-index: 0;
          opacity: 0;
          animation: globeFadeIn 0.8s ease 0.4s forwards;
        }
        @media (max-width: 2200px) {
          .mk-globe-slot { --globe-scale: 0.78; --globe-right: -1440px; }
        }
@media (max-width: 1900px) {
  .mk-globe-slot { --globe-scale: 0.6; --globe-right: -1290px; }
}
        }
        @media (max-width: 1560px) {
          .mk-globe-slot { --globe-scale: 0.45; --globe-right: -1020px; }
        }
        @media (max-width: 1300px) {
          .mk-globe-slot { --globe-scale: 0.32; --globe-right: -790px; }
        }
        @media (max-width: 1080px) {
          .mk-globe-slot { display: none !important; }
        }

        @media (max-width: 720px) {
          .mk-about-root {
            height: auto !important;
            min-height: 100vh !important;
            overflow: visible !important;
          }
          .mk-hero-row {
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh !important;
          }
          .mk-drawer {
            width: 100% !important;
            min-width: 100% !important;
            height: 38vh !important;
            min-height: 260px !important;
          }
          .mk-hero-photo {
            object-position: center 12% !important;
          }
          .mk-hero-copy {
            padding: 32px 22px 56px !important;
            flex: none !important;
          }
          .mk-hero-copy h1 {
            font-size: clamp(34px, 11vw, 56px) !important;
          }
          .mk-hero-copy p {
            font-size: 15px !important;
            line-height: 1.6 !important;
          }
        }
      `}</style>

      <div
        className="mk-hero-row"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
        }}
      >
        <div className="mk-corner-glow" aria-hidden="true" />
        <div
          className="mk-drawer"
          style={{
            width: `${drawerWidth}px`,
            minWidth: `${drawerWidth}px`,
            alignSelf: "stretch",
            position: "relative",
            background:
              "linear-gradient(160deg, #1a1010 0%, #0a0a0a 60%, #150a0a 100%)",
            overflow: "hidden",
            transition:
              "width 0.65s cubic-bezier(0.16, 0.9, 0.2, 1), min-width 0.65s cubic-bezier(0.16, 0.9, 0.2, 1)",
          }}
        >
          <img
            src={heroPortrait}
            alt="Hero Portrait"
            className="mk-hero-photo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              filter:
                "saturate(0.78) contrast(1.12) brightness(0.9) hue-rotate(-12deg)",
            }}
          />
          {/* Color-grade overlay: nudges the warm cast toward the site's
              cool crimson/black palette without touching the source file. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(160deg, rgba(20,4,8,0.35) 0%, rgba(10,6,10,0.15) 45%, rgba(120,20,20,0.22) 100%)",
              mixBlendMode: "multiply",
            }}
          />
        </div>

        <div
          className="mk-hero-copy"
          style={{
            flex: 1,
            padding: "60px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            opacity: textIn ? 1 : 0,
            transform: textIn ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {/* Globe — fills the dead space to the right of the copy column.
              Click Manila on it to drop the "PHILIPPINES" pin. */}
          <div className="mk-globe-slot">
            <Suspense fallback={null}>
              <EarthGlobe size={2500} />
            </Suspense>
          </div>

          <div style={{ position: "relative", zIndex: 1, maxWidth: "640px" }}>
            <div
              style={{
                color: "#e8283c",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "11px",
                letterSpacing: "3px",
                marginBottom: "18px",
              }}
            >
              CHALLENGER APPROACHING
            </div>

            <h1
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: "clamp(48px, 6.5vw, 96px)",
                color: "#f5f0e6",
                lineHeight: 0.95,
                margin: "0 0 32px 0",
                textShadow: "0 0 24px rgba(232,40,60,0.35)",
              }}
            >
              ABOUT ME
            </h1>

            <div
              style={{
                color: "#8a7f78",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "10px",
                letterSpacing: "2px",
                marginBottom: "14px",
              }}
            >
              — INFORMATION —
            </div>

            <p
              style={{
                color: "#d8d0c8",
                fontSize: "17px",
                lineHeight: 1.7,
                maxWidth: "640px",
                margin: "0 0 40px 0",
              }}
            >
              Hello, I'm a junior (2nd year) student pursuing my Bachelor of
              Science in Software Engineering. I love writing code, picking up
              new skills, and gaming in my free time. This portfolio follows a
              fighter-theme style, keep scrolling to continue your journey.
            </p>

            <div
              style={{
                color: "#8a7f78",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "10px",
                letterSpacing: "2px",
                marginBottom: "16px",
              }}
            >
              — CURRENTLY LEARNING —
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                maxWidth: "640px",
              }}
            >
              {LEARNING_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="mk-tag"
                  style={{
                    border: "1px solid rgba(196,30,30,0.55)",
                    color: "#d8d0c8",
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "8px",
                    letterSpacing: "0.5px",
                    padding: "6px 10px",
                    borderRadius: "2px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}