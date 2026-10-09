import { lazy, Suspense, useEffect, useState } from "react";
import heroPortrait from "../../assets/hero-portrait.jpg";

const EarthGlobe = lazy(() => import("./EarthGlobe"));

const PLAYER_STATS: [string, string][] = [
  ["Based in", "Iloilo, Philippines"],
  ["Class", "Software Engineering, year 2"],
  ["Main", "TypeScript and React"],
  ["Training", "T3 stack, SQL, Flutter"],
];
const DRAWER_WIDTH = 360;

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

        minHeight: "100vh",
        background: "transparent",
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
        position: "relative",
        overflow: "visible",
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

        .mk-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0;
          margin: 0;
          max-width: 560px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .mk-stat {
          padding: 12px 16px 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .mk-stat dt {
          font-size: 11px;
          color: #e8283c;
          margin: 0 0 4px;
        }
        .mk-stat dd {
          margin: 0;
          font-size: 14px;
          color: #f5f0e6;
        }

        .mk-corner-glow {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background:
            radial-gradient(ellipse 38% 50% at 100% 0%, rgba(196, 30, 30, 0.18), transparent 70%),
            radial-gradient(ellipse 38% 50% at 100% 100%, rgba(196, 30, 30, 0.18), transparent 70%);
        }

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
          .mk-globe-slot { --globe-scale: 0.78; --globe-right: -1700px; }
        }
        @media (max-width: 1900px) {
          .mk-globe-slot { --globe-scale: 0.6; --globe-right: -1550px; }
        }
        @media (max-width: 1560px) {
          .mk-globe-slot { --globe-scale: 0.45; --globe-right: -1250px; }
        }
        @media (max-width: 1300px) {
          .mk-globe-slot { --globe-scale: 0.32; --globe-right: -970px; }
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
            padding: 95px 20px 0 !important;
            box-sizing: border-box !important;
            gap: 8px !important;
          }
          .mk-drawer {
            order: 2;
            width: 100% !important;
            min-width: 100% !important;
            height: auto !important;
            aspect-ratio: 4 / 3 !important;
            min-height: 0 !important;
            border-radius: 18px !important;
            flex-shrink: 0 !important;
          }
          .mk-hero-photo {
            object-position: center 8% !important;
            transform: none !important;
          }
          .mk-hero-copy {
            padding: 8px 0 32px !important;
            flex: none !important;
          }
          .mk-hero-copy h1 {
            font-size: clamp(44px, 14vw, 64px) !important;
          }
          .mk-stat dd { font-size: 13px; }
          .mk-cta-primary { width: 100%; justify-content: center; }
          .mk-cta-ghost { flex: 1; justify-content: center; }
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
          paddingTop: "63px",
          minHeight: "100vh",
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
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.4)",
            boxSizing: "border-box",
            transition:
              "width 0.65s cubic-bezier(0.16, 0.9, 0.2, 1), min-width 0.65s cubic-bezier(0.16, 0.9, 0.2, 1)",
          }}
        >
          <img
            src={heroPortrait}
            alt="Mark Angelo Florencio"
            className="mk-hero-photo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 12%",
              transform: "scale(1.35)",
              transformOrigin: "center 12%",
              filter:
                "saturate(0.78) contrast(1.12) brightness(0.9) hue-rotate(-12deg)",
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(160deg, rgba(20,4,8,0.2) 0%, rgba(10,6,10,0.08) 45%, rgba(120,20,20,0.12) 100%)",
              mixBlendMode: "multiply",
            }}
          />
        </div>

        <div
          className="mk-hero-copy"
          style={{
            flex: 1,
            padding: "72px 56px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            opacity: textIn ? 1 : 0,
            transform: textIn ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >

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
                lineHeight: 0.92,
                margin: "0 0 28px 0",
                textTransform: "uppercase",
                textShadow: "0 0 24px rgba(232,40,60,0.35)",
              }}
            >
              Mark Angelo
              <br />
              Florencio
            </h1>


            <p
              style={{
                color: "#d8d0c8",
                fontSize: "17px",
                lineHeight: 1.7,
                maxWidth: "640px",
                margin: "0 0 24px 0",
              }}
            >
              I'm a 2nd-year Software Engineering student at Central
              Philippine University who builds real-time web apps with React and
              TypeScript. Off the clock, I'm usually gaming.
            </p>

            <style>{`
              .mk-cta {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-family: 'Press Start 2P', monospace;
                font-size: 9px;
                letter-spacing: 1px;
                text-transform: uppercase;
                text-decoration: none;
                padding: 12px 16px;
                border-radius: 2px;
                cursor: pointer;
                transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
              }
              .mk-cta:focus-visible { outline: 2px solid #ff8a5b; outline-offset: 3px; }
              .mk-cta-primary {
                background: #e8283c;
                color: #0a0a0a;
                border: 1px solid #e8283c;
                box-shadow: 0 0 18px rgba(232,40,60,0.45);
              }
              .mk-cta-primary:hover { background: #ff3b4f; transform: translateY(-1px); }
              .mk-cta-ghost {
                background: transparent;
                color: #d8d0c8;
                border: 1px solid rgba(255,255,255,0.18);
              }
              .mk-cta-ghost:hover { color: #ff8a5b; border-color: #ff8a5b; }
              @media (prefers-reduced-motion: reduce) {
                .mk-cta { transition: none; }
                .mk-cta-primary:hover { transform: none; }
              }
            `}</style>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                margin: "0 0 40px 0",
              }}
            >
              <button
                type="button"
                className="mk-cta mk-cta-primary"
                onClick={() =>
                  document
                    .querySelector('[data-section-id="projects"]')
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                View projects ▶
              </button>
              <a
                className="mk-cta mk-cta-ghost"
                href="https://github.com/Not-PvP"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a
                className="mk-cta mk-cta-ghost"
                href="mailto:contactmarkflorencio@gmail.com"
              >
                Email
              </a>
            </div>

            <dl className="mk-stats">
              {PLAYER_STATS.map(([label, value]) => (
                <div key={label} className="mk-stat">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}