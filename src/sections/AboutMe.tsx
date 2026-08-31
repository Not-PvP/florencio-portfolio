import { lazy, Suspense, useEffect, useState } from "react";
import heroPortrait from "../assets/hero-portrait.jpg";

// Lazy-loaded: the globe's land-mask bitmaps make it a heavy chunk on their
// own, and it's only ever visible in the roster (drawer-closed) view — no
// reason to make it part of AboutMe's initial bundle.
const EarthGlobe = lazy(() => import("./EarthGlobe"));

// Simplified roster data without explicit photos to reduce payload size
type Ally = { name: string; link: string };

const ALLIES: Ally[] = [
  { name: "Maya", link: "https://instagram.com" },
  { name: "Jonas", link: "https://instagram.com" },
  { name: "Aria", link: "https://instagram.com" },
  { name: "Leo", link: "https://instagram.com" },
  { name: "Nadia", link: "https://instagram.com" },
  { name: "Ken", link: "https://instagram.com" },
  { name: "Priya", link: "https://instagram.com" },
  { name: "Rico", link: "https://instagram.com" },
  { name: "Elin", link: "https://instagram.com" },
  { name: "Tomas", link: "https://instagram.com" },
];

const LEARNING_TAGS = [
  "WEB DEVELOPMENT",
  "DATABASES / SQL",
  "T3 STACK",
  "FLUTTER / DART",
  "REACT",
];

export default function AboutMe() {
  const [open, setOpen] = useState<boolean>(false);
  const [textIn, setTextIn] = useState<boolean>(false);

  useEffect(() => {
    const t1 = setTimeout(() => setOpen(true), 80);
    const t2 = setTimeout(() => setTextIn(true), 520);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  function toggleDrawer() {
    setOpen((prev) => !prev);
  }

  const photoWidth = 460;
  const rosterWidth = 88;
  const currentWidth = open ? photoWidth : rosterWidth;

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
        @media (prefers-reduced-motion: reduce) {
          .mk-drawer { transition: none !important; }
          .mk-fade { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
        .mk-tab {
          transition: left 0.65s cubic-bezier(0.16, 0.9, 0.2, 1), background 0.15s ease, border-color 0.15s ease;
        }
        .mk-tab:hover {
          background: rgba(196,30,30,0.35);
          border-color: rgba(255,140,90,0.7);
        }
        .mk-tab:focus-visible {
          outline: 2px solid #ff8a5b;
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-tab { transition: background 0.15s ease, border-color 0.15s ease; }
        }

        .mk-roster-scroll {
          scrollbar-width: none;
          -webkit-mask-image: linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 24px), transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 24px), transparent 100%);
        }
        .mk-roster-scroll::-webkit-scrollbar {
          display: none;
        }
        .mk-ally {
          transition: transform 0.2s ease, border-color 0.2s ease, filter 0.2s ease;
          filter: grayscale(0.55);
          flex-shrink: 0;
        }
        .mk-ally:hover, .mk-ally:focus-visible {
          transform: scale(1.06);
          border-color: #ff8a5b !important;
          filter: grayscale(0);
        }
        .mk-ally:focus-visible {
          outline: 2px solid #ff8a5b;
          outline-offset: 2px;
        }

        .mk-tag {
          transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }
        .mk-tag:hover {
          border-color: #ff8a5b;
          color: #ff8a5b;
          background: rgba(232,40,60,0.08);
        }

        .mk-globe-slot {
          --globe-scale: 1;
          --globe-right: -45%;
          transition: opacity 0.4s ease;
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

@media (max-width: 2200px) {
  .mk-globe-slot { --globe-scale: 0.78; --globe-right: -1250px; } /* Was -1480px */
}
@media (max-width: 1900px) {
  .mk-globe-slot { --globe-scale: 0.6; --globe-right: -1080px; }  /* Was -1280px */
}
@media (max-width: 1560px) {
  .mk-globe-slot { --globe-scale: 0.45; --globe-right: -880px; }  /* Was -1070px */
}
@media (max-width: 1300px) {
  .mk-globe-slot { --globe-scale: 0.32; --globe-right: -680px; }  /* Was -840px */
}
        @media (max-width: 1080px) {
          .mk-globe-slot { display: none !important; }
          .mk-corner-glow { display: none !important; }
        }

        @media (max-width: 720px) {
          /* Let the section grow to fit its content instead of hard-clipping
             at 100vh. The drawer height below is a fixed vh, so the tab's
             top offset (also vh-based) still lines up with its bottom edge
             even once total content height exceeds one viewport. */
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
            /* Was cutting off top of head at 20%; pull the focal point up. */
            object-position: center 12% !important;
          }
          .mk-tab {
            display: flex !important;
            top: max(38vh, 260px) !important;
            left: 50% !important;
            transform: translate(-50%, -50%) rotate(90deg) !important;
          }
          .mk-tab:hover {
            transform: translate(-50%, -50%) rotate(90deg) !important;
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

          /* Roster: static grid, no scrolling — all allies visible at once. */
          .mk-roster-scroll {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            overflow: hidden !important;
            align-content: center !important;
            justify-content: center !important;
            gap: 10px !important;
            padding: 12px 24px !important;
            -webkit-mask-image: none !important;
            mask-image: none !important;
          }
          .mk-ally {
            width: 38px !important;
            height: 38px !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      <button
        type="button"
        className="mk-tab"
        onClick={toggleDrawer}
        aria-label={open ? "Close about me panel" : "Open about me panel"}
        aria-expanded={open}
        style={{
          position: "absolute",
          top: "50%",
          left: `${currentWidth - 5}px`,
          transform: "translateY(-50%)",
          zIndex: 3,
          width: "22px",
          height: "64px",
          background: "rgba(20,10,10,0.85)",
          border: "1px solid rgba(196,30,30,0.55)",
          borderLeft: "none",
          borderRadius: "0 8px 8px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <svg
          width="10"
          height="16"
          viewBox="0 0 10 16"
          fill="none"
          style={{
            transform: open ? "rotate(0deg)" : "rotate(180deg)",
            transition: "transform 0.3s ease",
          }}
        >
          <path
            d="M8 1L2 8L8 15"
            stroke="#ff8a5b"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

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
            width: `${currentWidth}px`,
            minWidth: `${currentWidth}px`,
            alignSelf: "stretch",
            position: "relative",
            background:
              "linear-gradient(160deg, #1a1010 0%, #0a0a0a 60%, #150a0a 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            transition:
              "width 0.65s cubic-bezier(0.16, 0.9, 0.2, 1), min-width 0.65s cubic-bezier(0.16, 0.9, 0.2, 1)",
          }}
        >
          {open ? (
            <>
              {/* Hero Portrait */}
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
            </>
          ) : (
            <div
              className="mk-roster-scroll"
              style={{
                width: "100%",
                height: "100%",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                padding: "32px 0",
              }}
            >
              {ALLIES.map((ally, idx) => (
                <a
                  key={idx}
                  href={ally.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mk-ally"
                  aria-label={ally.name}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    border: "1px solid rgba(196,30,30,0.55)",
                    background: "rgba(30,15,15,0.8)",
                    color: "#ff8a5b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  {/* Initials Placeholder */}
                  {ally.name.substring(0, 2).toUpperCase()}
                </a>
              ))}
            </div>
          )}
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
          {/* Globe — fills the empty right-hand space in the roster view.
              Drops in with a bounce whenever the drawer closes and lifts
              back out when it opens; fully unmounted below 1440px where
              there isn't room for it next to the text. */}
          <div
            className="mk-globe-slot"
            aria-hidden={open}
            style={{
              position: "absolute",
              top: "50%",
              right: "var(--globe-right, 170px)",
              transform: open
                ? "translateY(calc(-50% - 140px)) scale(var(--globe-scale, 1))"
                : "translateY(-50%) scale(var(--globe-scale, 1))",
              opacity: open ? 0 : 1,
              transition:
                "opacity 0.4s ease, transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)",
              pointerEvents: open ? "none" : "auto",
              zIndex: 0,
            }}
          >
            <Suspense fallback={null}>
              <EarthGlobe size={2500} />
            </Suspense>
          </div>

          {/* Real content — capped to the same width as its children so this
              wrapper doesn't silently stretch across the globe's space and
              swallow its hover/click events (it's zIndex 1, above the globe's
              zIndex 0, so an unconstrained full-width div here would block
              the canvas underneath even where nothing is visibly drawn). */}
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
