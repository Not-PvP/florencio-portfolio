import type { ReactNode } from "react";

// Sparse background starfield — same restrained density as the rest of
// the site's "alive but calm" decoration. Kept small on purpose: this is
// a frame around the content, not a light show competing with it.
const BEZEL_STARS: { x: number; y: number; size: number; delay: number; bright?: boolean }[] = [
  { x: 5, y: 8, size: 2, delay: 0 },
  { x: 13, y: 62, size: 1.5, delay: 0.6 },
  { x: 22, y: 90, size: 2, delay: 1.1 },
  { x: 31, y: 5, size: 1.5, delay: 1.8 },
  { x: 41, y: 95, size: 1, delay: 0.3 },
  { x: 52, y: 3, size: 2.5, delay: 2.1, bright: true },
  { x: 60, y: 93, size: 1.5, delay: 1.4 },
  { x: 68, y: 7, size: 1, delay: 0.9 },
  { x: 77, y: 91, size: 2, delay: 1.7 },
  { x: 85, y: 10, size: 1.5, delay: 0.2 },
  { x: 92, y: 58, size: 2.5, delay: 2.4, bright: true },
  { x: 96, y: 28, size: 1.5, delay: 1.0 },
  { x: 3, y: 42, size: 1, delay: 1.6 },
  { x: 97, y: 78, size: 1.5, delay: 0.5 },
  { x: 10, y: 80, size: 1, delay: 2.0 },
  { x: 46, y: 97, size: 1.5, delay: 1.2 },
  { x: 64, y: 3, size: 1, delay: 0.8 },
  { x: 3, y: 94, size: 2, delay: 1.9 },
];

// A small amber-toned rock cluster tucked into the bottom-left corner —
// Defender's blue "wave" corner motif, reinterpreted as debris instead of
// a shoreline so it reads as space junk rather than a planet surface.
const BELT_ROCKS: { size: number; bottom: number; left: number; rotate: number; duration: number; delay: number }[] = [
  { size: 30, bottom: 6, left: 0, rotate: -6, duration: 7, delay: 0 },
  { size: 20, bottom: 24, left: 32, rotate: 10, duration: 8.5, delay: 1.2 },
  { size: 14, bottom: 0, left: 54, rotate: 4, duration: 6, delay: 2.3 },
];

interface ArcadeBezelProps {
  children: ReactNode;
}

// A galaxy-themed arcade cabinet bezel, hand-illustrated in the same
// vocabulary as the rest of the site (gradients + SVG shapes, no image
// assets). Four quiet corner motifs — a sun, a spiral galaxy, a ringed
// planet, a rock cluster — sit on a deep-space field around whatever
// "screen" content is passed in as children, echoing real cabinet side
// art (Defender's starfield-and-galaxy corners) without copying it.
export default function ArcadeBezel({ children }: ArcadeBezelProps) {
  return (
    <div className="ab-bezel">
      <style>{`
        .ab-bezel {
          position: relative;
          border-radius: 42px;
          padding: 30px;
          box-sizing: border-box;
          background:
            radial-gradient(circle at 15% 20%, rgba(130,60,190,0.22) 0%, transparent 45%),
            radial-gradient(circle at 12% 85%, rgba(217,119,6,0.16) 0%, transparent 40%),
            radial-gradient(circle at 85% 85%, rgba(232,40,60,0.2) 0%, transparent 50%),
            linear-gradient(160deg, #0a0612 0%, #05040a 55%, #0a0508 100%);
          box-shadow:
            inset 0 0 46px rgba(0,0,0,0.6),
            inset 0 0 90px rgba(130,60,190,0.07),
            0 14px 32px rgba(0,0,0,0.55),
            0 0 70px rgba(232,40,60,0.1);
        }

        .ab-star {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          z-index: 1;
          animation: abStarTwinkle 3.2s ease-in-out infinite;
        }
        .ab-star-bright { animation-duration: 2.4s; }
        @keyframes abStarTwinkle {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        .ab-sun {
          position: absolute;
          top: -18px;
          left: -18px;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fff3d6 0%, #ffb85b 28%, #e8283c 62%, rgba(232,40,60,0) 76%);
          box-shadow: 0 0 30px 10px rgba(255,166,74,0.32), 0 0 60px 20px rgba(232,40,60,0.16);
          z-index: 1;
          animation: abSunBreathe 3.6s ease-in-out infinite;
        }
        @keyframes abSunBreathe {
          0%, 100% { transform: scale(1); opacity: 0.92; }
          50% { transform: scale(1.06); opacity: 1; }
        }

        .ab-galaxy {
          position: absolute;
          top: -14px;
          right: -14px;
          width: 56px;
          height: 56px;
          z-index: 1;
        }
        .ab-galaxy-arms {
          transform-origin: 30px 30px;
          animation: abGalaxySpin 90s linear infinite;
        }
        @keyframes abGalaxySpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .ab-planet-wrap {
          position: absolute;
          bottom: -24px;
          right: -16px;
          width: 78px;
          height: 78px;
          z-index: 1;
        }
        .ab-planet-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 112px;
          height: 32px;
          border: 2px solid rgba(255,199,140,0.32);
          border-radius: 50%;
          transform: translate(-50%, -50%) rotate(-18deg);
          z-index: 0;
        }
        .ab-planet-body {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 32% 30%, #ffdcb0 0%, #d9713a 32%, #7a2b1f 68%, #2c0f0c 100%);
          box-shadow: inset -10px -10px 18px rgba(0,0,0,0.55), 0 0 24px rgba(217,113,58,0.22);
          z-index: 1;
        }

        .ab-belt {
          position: absolute;
          bottom: -8px;
          left: -10px;
          width: 84px;
          height: 60px;
          z-index: 1;
        }
        .ab-rock {
          position: absolute;
          animation-name: abRockDrift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes abRockDrift {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .ab-star, .ab-sun, .ab-galaxy-arms, .ab-rock { animation: none !important; }
        }

        @media (max-width: 760px) {
          .ab-bezel { padding: 16px; border-radius: 28px; }
          .ab-sun { width: 40px; height: 40px; top: -12px; left: -12px; }
          .ab-galaxy { width: 42px; height: 42px; top: -10px; right: -10px; }
          .ab-planet-wrap { width: 58px; height: 58px; bottom: -16px; right: -10px; }
          .ab-belt { transform: scale(0.72); transform-origin: bottom left; }
        }
      `}</style>

      {/* Star field */}
      {BEZEL_STARS.map((s, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={`ab-star${s.bright ? " ab-star-bright" : ""}`}
          style={{
            top: `${s.y}%`,
            left: `${s.x}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            boxShadow: s.bright
              ? "0 0 6px 2px rgba(255,255,255,0.9), 0 0 16px 4px rgba(232,40,60,0.35)"
              : "0 0 3px rgba(255,255,255,0.75)",
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Sun — peeks past the top-left corner, the scene's light source */}
      <div aria-hidden="true" className="ab-sun" />

      {/* Spiral galaxy — peeks past the top-right corner, lit cool to
          contrast the warm sun opposite it */}
      <svg aria-hidden="true" className="ab-galaxy" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="abGalaxyCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="35%" stopColor="#cdb6ff" />
            <stop offset="100%" stopColor="rgba(130,60,190,0)" />
          </radialGradient>
        </defs>
        <g className="ab-galaxy-arms">
          <path
            d="M30 30 C 20 20, 8 22, 6 34 C 4 46, 16 54, 28 50"
            fill="none"
            stroke="rgba(210,190,255,0.55)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M30 30 C 40 40, 52 38, 54 26 C 56 14, 44 6, 32 10"
            fill="none"
            stroke="rgba(210,190,255,0.4)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M30 30 C 22 24, 14 28, 14 36"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <circle cx="12" cy="14" r="0.8" fill="#fff" opacity="0.7" />
          <circle cx="50" cy="46" r="0.9" fill="#fff" opacity="0.6" />
          <circle cx="44" cy="12" r="0.6" fill="#fff" opacity="0.8" />
        </g>
        <circle cx="30" cy="30" r="6" fill="url(#abGalaxyCore)" />
      </svg>

      {/* Ringed planet — peeks past the bottom-right corner, shaded
          consistently with the sun up at top-left */}
      <div aria-hidden="true" className="ab-planet-wrap">
        <div className="ab-planet-ring" />
        <div className="ab-planet-body" />
      </div>

      {/* Rock cluster — tucked into the bottom-left corner, standing in
          for Defender's wave/planet-edge motif as drifting debris instead */}
      <div aria-hidden="true" className="ab-belt">
        {BELT_ROCKS.map((r, i) => (
          <svg
            key={i}
            className="ab-rock"
            width={r.size}
            height={r.size}
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              bottom: `${r.bottom}px`,
              left: `${r.left}px`,
              animationDuration: `${r.duration}s`,
              animationDelay: `${r.delay}s`,
              transform: `rotate(${r.rotate}deg)`,
            }}
          >
            <defs>
              <radialGradient id={`abRock${i}`} cx="32%" cy="28%" r="80%">
                <stop offset="0%" stopColor="#ffdca8" />
                <stop offset="55%" stopColor="#c97a1f" />
                <stop offset="100%" stopColor="#3a2308" />
              </radialGradient>
            </defs>
            <path
              d="M8 14 L18 6 L30 9 L36 20 L30 32 L16 36 L6 28 L4 20 Z"
              fill={`url(#abRock${i})`}
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="1"
            />
            <circle cx="16" cy="18" r="3" fill="rgba(0,0,0,0.28)" />
          </svg>
        ))}
      </div>

      {children}
    </div>
  );
}