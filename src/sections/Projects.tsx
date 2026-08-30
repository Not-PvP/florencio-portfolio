import { useEffect, useRef, useState } from "react";

// ── Data ─────────────────────────────────────────────────────────────
interface ProjectLink {
  label: string;
  url: string;
}

interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  links: ProjectLink[];
  cartColor: string;
}

const PROJECTS: Project[] = [
  {
    id: "cosign",
    name: "CoSign",
    tagline: "ML sign language app",
    description:
      "A machine learning app that reads sign language in real time — gamified like MonkeyType, but you're signing instead of typing. Includes a practice mode to drill individual hand signs. Full-stack build with separate frontend and backend.",
    stack: ["Python", "TensorFlow", "TypeScript", "Next.js", "Tailwind CSS", "Vercel"],
    links: [],
    cartColor: "#8a0303",
  },
  {
    id: "kramkard",
    name: "Kram Kard",
    tagline: "Multiplayer card game",
    description:
      "A real-time multiplayer card game — turn-based battles, a competitive leaderboard, and randomly generated cards with their own rarity and tier. Equal parts strategy and luck.",
    stack: ["TypeScript", "React", "Vite", "Socket.io", "Turso", "Railway"],
    links: [{ label: "GitHub", url: "https://github.com/Not-PvP/KramKard" }],
    cartColor: "#1c1e22",
  },
  {
    id: "parcomm",
    name: "ParComm",
    tagline: "Parking management system",
    description:
      "A real-time parking management system using QR-code ticketing and live occupancy dashboards. Guards scan tickets to track vehicle entry/exit, while students and admins get live visibility into available parking — built to cut down search time and campus traffic congestion.",
    stack: ["TypeScript", "Next.js", "React", "Tailwind CSS", "Firebase", "Vercel"],
    links: [
      { label: "GitHub", url: "https://github.com/Not-PvP/ParComm" },
      { label: "Live demo", url: "https://par-comm.vercel.app/" },
    ],
    cartColor: "#4a4e57",
  },
];

// More theatrical fan spread now that the cartridges have more room to
// themselves: wider spacing, sharper rotation, bigger pop on the selected card.
function fanTransform(offset: number, isSelected: boolean, hovered: boolean): string {
  if (isSelected && !hovered) {
    return "translate(0px, -20px) rotate(0deg) scale(1.12)";
  }
  const spread = hovered ? 54 : 46;
  const lift = hovered ? -10 : 0;
  const rotate = offset * (hovered ? 6 : 9);
  const translateX = offset * spread;
  const translateY = Math.abs(offset) * (hovered ? 5 : 10) + (isSelected ? lift - 20 : lift);
  const scale = isSelected ? (hovered ? 1.03 : 1.12) : hovered ? 0.96 : 0.86;
  return `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale})`;
}

// ── Component ────────────────────────────────────────────────────────
export default function Projects() {
  const [selectedId, setSelectedId] = useState<string>(PROJECTS[0].id);
  const [flash, setFlash] = useState<boolean>(false);
  const [cartsHovered, setCartsHovered] = useState<boolean>(false);
  const [sectionIn, setSectionIn] = useState<boolean>(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = PROJECTS.find((p) => p.id === selectedId) ?? PROJECTS[0];
  const selectedIndex = PROJECTS.findIndex((p) => p.id === selectedId);

  function selectProject(id: string) {
    if (id === selectedId) return;
    setFlash(true);
    setSelectedId(id);
    setTimeout(() => setFlash(false), 260);
  }

  // Fade this section in the first time it scrolls into view, rather
  // than all at once on page mount — otherwise it (and everything below
  // the hero) would just be sitting there at full opacity before the
  // user ever scrolls to it.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionIn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className="mk-projects-root"
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "transparent",
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 48px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        /* Title punches in with a hit-stop snap, like a combo landing,
           instead of a plain fade. */
        @keyframes titleSlam {
          0% { opacity: 0; transform: scale(1.4); filter: blur(6px); }
          55% { opacity: 1; transform: scale(0.96); filter: blur(0px); }
          70% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        /* Select row slots up from below like a cartridge being pushed
           into the console, with a brief red flash at the moment it lands. */
        @keyframes rowSlotIn {
          0% { opacity: 0; transform: translateY(60px); }
          65% { opacity: 1; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes rowFlash {
          0%, 60% { box-shadow: 0 0 0 rgba(232,40,60,0); }
          68% { box-shadow: 0 0 80px rgba(232,40,60,0.35); }
          100% { box-shadow: 0 0 0 rgba(232,40,60,0); }
        }
        @keyframes wipeFlash {
          from { opacity: 0.9; }
          to { opacity: 0; }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mk-cart {
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.2s ease;
          cursor: pointer;
        }
        .mk-cart:hover {
          filter: brightness(1.15);
        }
        .mk-cart:focus-visible {
          outline: 2px solid #e8283c;
          outline-offset: 4px;
        }
        .mk-link {
          transition: background 0.15s ease, color 0.15s ease;
        }
        .mk-link:hover {
          background: #e8283c;
          color: #0a0a0a;
        }
        .mk-console-btn {
          cursor: pointer;
        }
        .mk-console-btn .mk-console-pill {
          transition: fill 0.15s ease;
        }
        .mk-console-btn:hover .mk-console-pill {
          fill: #e8283c;
        }
        .mk-console-btn:hover .mk-console-btn-label {
          fill: #ff9aa5;
        }
        .mk-panel {
          scrollbar-width: thin;
          scrollbar-color: rgba(232,40,60,0.5) transparent;
        }
        .mk-panel::-webkit-scrollbar {
          width: 4px;
        }
        .mk-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        .mk-panel::-webkit-scrollbar-thumb {
          background: rgba(232,40,60,0.5);
          border-radius: 2px;
        }
        .mk-panel::-webkit-scrollbar-button {
          display: none;
          width: 0;
          height: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-panel { animation: none !important; }
          .mk-wipe { display: none !important; }
          .mk-cart { transition: filter 0.15s ease; }
          .mk-fade { animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; box-shadow: none !important; }
        }

        /* Two fixed 360px columns side by side don't fit a phone screen.
           Stack cartridges above the console instead, and let both
           shrink together (same aspect ratio, so the SVG's percentage-
           based screen cutout still lines up at any width). */
        @media (max-width: 780px) {
          .mk-select-row { flex-direction: column !important; gap: 36px !important; }
          .mk-cart-cluster, .mk-console-wrap {
            width: 360px !important;
            transform: scale(var(--mk-project-scale, 1));
            transform-origin: top center;
          }
        }
        @media (max-width: 500px) {
          .mk-projects-root { padding: 40px 16px !important; }
        }
        @media (max-width: 420px) {
          .mk-cart-cluster, .mk-console-wrap { --mk-project-scale: 0.82; }
        }
        @media (max-width: 360px) {
          .mk-cart-cluster, .mk-console-wrap { --mk-project-scale: 0.72; }
        }
      `}</style>

      {/* low red uplight, like stage lights hitting the floor from below — static, cheap, grounded */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background:
            "radial-gradient(ellipse 55% 35% at 50% 100%, rgba(232,40,60,0.14), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="mk-fade"
        style={{
          textAlign: "center",
          marginBottom: "26px",
          opacity: sectionIn ? 1 : 0,
          animation: sectionIn ? "titleSlam 0.7s cubic-bezier(0.2, 0.9, 0.25, 1) both" : "none",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            letterSpacing: "0.35em",
            color: "#e8283c",
            fontWeight: 700,
          }}
        >
          ROUND TWO
        </p>
        <h1
          style={{
            margin: "4px 0 0",
            fontFamily: "'Anton', sans-serif",
            fontSize: "clamp(28px, 3.6vw, 44px)",
            color: "#f2f2f2",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            lineHeight: 1,
            textShadow: "0 0 24px rgba(232,40,60,0.2)",
          }}
        >
          Select your project
        </h1>
      </div>

      {/* Select screen — cartridges + console, side by side. maxWidth is sized
          to actually fit both (cluster 360 + gap 72 + console 360 = 792px)
          so it no longer wraps onto two lines on desktop. */}
      <div
        className="mk-select-row mk-fade"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "72px",
          flexWrap: "wrap",
          width: "100%",
          maxWidth: "920px",
          borderRadius: "24px",
          opacity: sectionIn ? 1 : 0,
          animation: sectionIn
            ? "rowSlotIn 0.6s cubic-bezier(0.2, 0.85, 0.25, 1) 0.22s both, rowFlash 0.6s ease-out 0.22s both"
            : "none",
        }}
      >
        {/* Cartridges */}
        <div
          className="mk-cart-cluster"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "18px",
            width: "360px",
          }}
        >
          <div
            onMouseEnter={() => setCartsHovered(true)}
            onMouseLeave={() => setCartsHovered(false)}
            style={{
              position: "relative",
              width: "360px",
              height: "260px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 50% 55%, rgba(232,40,60,0.34), transparent 68%)",
                opacity: cartsHovered ? 1 : 0,
                transition: "opacity 0.35s ease",
                pointerEvents: "none",
              }}
            />
            {PROJECTS.map((project, i) => {
              const isSelected = project.id === selectedId;
              const offset = i - selectedIndex;
              return (
                <button
                  key={project.id}
                  type="button"
                  className="mk-cart"
                  onClick={() => selectProject(project.id)}
                  aria-pressed={isSelected}
                  aria-label={`Select ${project.name}`}
                  style={{
                    position: "absolute",
                    border: "none",
                    background: "none",
                    padding: 0,
                    transform: fanTransform(offset, isSelected, cartsHovered),
                    zIndex: isSelected ? 10 : 5 - Math.abs(offset),
                  }}
                >
                  <CartridgeSVG
                    color={project.cartColor}
                    highlighted={isSelected}
                    name={project.name}
                    tagline={project.tagline}
                  />
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "12px",
                color: "#ff6b7a",
                fontWeight: 700,
                letterSpacing: "0.1em",
              }}
            >
              {String(selectedIndex + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.1em",
              }}
            >
              / {String(PROJECTS.length).padStart(2, "0")} CARTRIDGES
            </span>
          </div>
        </div>

        {/* Console */}
        <div className="mk-console-wrap" style={{ position: "relative", width: "360px", flexShrink: 0 }}>
          <ConsoleShellSVG leftLink={selected.links[0]} rightLink={selected.links[1]} />

          <div
            style={{
              position: "absolute",
              top: "8.79%",
              left: "10%",
              width: "80%",
              height: "40%",
              background: "#0a0a0a",
              overflow: "hidden",
              padding: "14px 16px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)",
                pointerEvents: "none",
              }}
            />

            {flash && (
              <div
                className="mk-wipe"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(232,40,60,0.3)",
                  animation: "wipeFlash 0.26s ease-out forwards",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
            )}

            <div
              key={selected.id}
              className="mk-panel"
              style={{
                position: "relative",
                animation: "panelIn 0.3s ease-out both",
                height: "100%",
                overflowY: "auto",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "10.5px",
                  letterSpacing: "0.2em",
                  color: "#e8283c",
                  fontWeight: 700,
                }}
              >
                {selected.tagline.toUpperCase()}
              </p>
              <h2
                style={{
                  margin: "4px 0 10px",
                  fontFamily: "'Anton', sans-serif",
                  fontSize: "22px",
                  color: "#f2f2f2",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                }}
              >
                {selected.name}
              </h2>

              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "11px",
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {selected.description}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginBottom: "10px",
                }}
              >
                {selected.stack.map((tech) => (
                  <span
                    key={tech}
                    style={{
                      fontSize: "9px",
                      padding: "4px 7px",
                      border: "1px solid rgba(232,40,60,0.5)",
                      color: "#ff6b7a",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConsoleShellSVGProps {
  leftLink?: ProjectLink;
  rightLink?: ProjectLink;
}

function ConsoleShellSVG({ leftLink, rightLink }: ConsoleShellSVGProps) {
  return (
    <svg viewBox="0 0 420 660" width="100%" height="auto" style={{ display: "block" }}>
      <defs>
        <linearGradient id="shellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#232428" />
          <stop offset="50%" stopColor="#1a1b1e" />
          <stop offset="100%" stopColor="#131315" />
        </linearGradient>
        <linearGradient id="screenFrameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2c2d31" />
          <stop offset="100%" stopColor="#1c1d20" />
        </linearGradient>
        <linearGradient id="screenGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d0d0d" />
          <stop offset="100%" stopColor="#050505" />
        </linearGradient>
        <radialGradient id="dpadCenterGrad" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#3f4044" />
          <stop offset="100%" stopColor="#222325" />
        </radialGradient>
        <linearGradient id="stickGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a3b3e" />
          <stop offset="100%" stopColor="#232427" />
        </linearGradient>
        <radialGradient id="btnAGrad" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#e8283c" />
          <stop offset="60%" stopColor="#a3132a" />
          <stop offset="100%" stopColor="#6b0818" />
        </radialGradient>
        <radialGradient id="btnBGrad" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#c41e30" />
          <stop offset="60%" stopColor="#8a0f22" />
          <stop offset="100%" stopColor="#5c0714" />
        </radialGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      <path
        d="M 26 0
           L 394 0
           Q 420 0 420 26
           L 420 580
           Q 420 660 340 660
           L 80 660
           Q 0 660 0 580
           L 0 26
           Q 0 0 26 0
           Z"
        fill="url(#shellGrad)"
        stroke="#3a3b3f"
        strokeWidth="1.5"
      />

      <rect x="168" y="0" width="84" height="10" fill="#101012" />
      <rect x="176" y="0" width="68" height="5" fill="#050506" />

      <rect x="24" y="40" width="372" height="300" rx="20" fill="url(#screenFrameGrad)" filter="url(#softShadow)" />
      <rect x="42" y="58" width="336" height="264" rx="6" fill="url(#screenGlassGrad)" />
      <rect x="42" y="58" width="336" height="264" rx="6" fill="none" stroke="#000" strokeWidth="1" opacity="0.6" />

      <g transform="translate(108, 418)">
        <rect x="-15" y="-50" width="30" height="100" rx="7" fill="url(#stickGrad)" />
        <rect x="-50" y="-15" width="100" height="30" rx="7" fill="url(#stickGrad)" />
        <circle cx="0" cy="0" r="17" fill="url(#dpadCenterGrad)" />
      </g>

      <g transform="translate(296, 412) rotate(-12)">
        <circle cx="64" cy="-6" r="24" fill="url(#btnAGrad)" />
        <text x="64" y="-1.5" textAnchor="middle" fontSize="13" fill="#3a0509" fontFamily="monospace" fontWeight="bold">
          A
        </text>
        <circle cx="4" cy="20" r="24" fill="url(#btnBGrad)" />
        <text x="4" y="24.5" textAnchor="middle" fontSize="13" fill="#3a0509" fontFamily="monospace" fontWeight="bold">
          B
        </text>
      </g>

      {leftLink ? (
        <a href={leftLink.url} target="_blank" rel="noopener noreferrer" className="mk-console-btn">
          <g transform="translate(150, 500) rotate(-12)">
            <rect className="mk-console-pill" x="0" y="0" width="52" height="14" rx="7" fill="#2a2b2e" />
          </g>
          <text
            className="mk-console-btn-label"
            x="176"
            y="542"
            textAnchor="middle"
            fontSize="8.5"
            fill="#a9abaf"
            fontFamily="monospace"
            letterSpacing="0.03em"
          >
            {leftLink.label.toUpperCase()}
          </text>
        </a>
      ) : (
        <>
          <g transform="translate(150, 500) rotate(-12)">
            <rect x="0" y="0" width="52" height="14" rx="7" fill="#2a2b2e" />
          </g>
          <text x="176" y="542" textAnchor="middle" fontSize="8.5" fill="#6a6b6e" fontFamily="monospace" letterSpacing="0.05em">
            SELECT
          </text>
        </>
      )}

      {rightLink ? (
        <a href={rightLink.url} target="_blank" rel="noopener noreferrer" className="mk-console-btn">
          <g transform="translate(218, 500) rotate(-12)">
            <rect className="mk-console-pill" x="0" y="0" width="52" height="14" rx="7" fill="#2a2b2e" />
          </g>
          <text
            className="mk-console-btn-label"
            x="244"
            y="542"
            textAnchor="middle"
            fontSize="8.5"
            fill="#a9abaf"
            fontFamily="monospace"
            letterSpacing="0.03em"
          >
            {rightLink.label.toUpperCase()}
          </text>
        </a>
      ) : (
        <>
          <g transform="translate(218, 500) rotate(-12)">
            <rect x="0" y="0" width="52" height="14" rx="7" fill="#2a2b2e" />
          </g>
          <text x="244" y="542" textAnchor="middle" fontSize="8.5" fill="#6a6b6e" fontFamily="monospace" letterSpacing="0.05em">
            START
          </text>
        </>
      )}

      <g stroke="#3a3b3f" strokeWidth="4" strokeLinecap="round" opacity="0.8">
        <line x1="330" y1="592" x2="346" y2="576" />
        <line x1="346" y1="592" x2="362" y2="576" />
        <line x1="362" y1="592" x2="378" y2="576" />
        <line x1="378" y1="592" x2="394" y2="576" />
      </g>
    </svg>
  );
}

interface CartridgeSVGProps {
  color: string;
  highlighted: boolean;
  name: string;
  tagline: string;
}

// Scaled up from 132×109 to 160×132 so the cartridges hold their own
// against the console now that they have more room.
function CartridgeSVG({ color, highlighted, name, tagline }: CartridgeSVGProps) {
  // Only clamp text that would actually overflow the label — short names
  // like "COSIGN" should render at their natural size, not get stretched
  // out to fill the box. Rough width estimate is enough here since we're
  // only deciding whether to engage the safety clamp, not doing precise typesetting.
  const displayName = name.toUpperCase();
  const nameNaturalWidth = displayName.length * 8.5 * 0.62;
  const nameClamp =
    nameNaturalWidth > 118 ? { textLength: 118, lengthAdjust: "spacingAndGlyphs" as const } : {};

  const displayTagline = `> ${tagline.toUpperCase()}_`;
  const taglineNaturalWidth = displayTagline.length * 7.5 * 0.6;
  const taglineClamp =
    taglineNaturalWidth > 128 ? { textLength: 128, lengthAdjust: "spacingAndGlyphs" as const } : {};

  return (
    <svg
      viewBox="0 0 170 140"
      width="160"
      height="132"
      style={{
        filter: highlighted
          ? "drop-shadow(0 10px 20px rgba(232,40,60,0.4))"
          : "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
      }}
    >
      <rect x="5" y="16" width="160" height="118" rx="7" fill="#2c2e33" stroke="#111214" strokeWidth="2" />
      <rect x="48" y="0" width="72" height="19" rx="3" fill="#1a1b1e" />
      <rect x="56" y="4" width="56" height="6" rx="2" fill="#0d0d0e" />

      <rect
        x="17"
        y="38"
        width="134"
        height="72"
        rx="3"
        fill={color}
        stroke={highlighted ? "#e8283c" : "rgba(255,255,255,0.15)"}
        strokeWidth={highlighted ? "2.5" : "1"}
      />

      {/* Name is printed in a chunky pixel font, like art on the actual
          plastic — rendered twice (a dark "ink" pass offset behind a
          bright pass) for a cheap little print-shadow / chromatic pop.
          Only clamps to a fixed width when the name is actually too long. */}
      <text
        x="85"
        y="63"
        textAnchor="middle"
        fontSize="8.5"
        fill="#00000055"
        fontFamily="'Press Start 2P', monospace"
        {...nameClamp}
      >
        {displayName}
      </text>
      <text
        x="84"
        y="62"
        textAnchor="middle"
        fontSize="8.5"
        fill="#f2f2f2"
        fontFamily="'Press Start 2P', monospace"
        {...nameClamp}
      >
        {displayName}
      </text>

      {/* Tagline reads like a status line on a boot screen. Same
          clamp logic — only compresses when it would otherwise spill
          past the cartridge edge. */}
      <text
        x="84"
        y="90"
        textAnchor="middle"
        fontSize="7.5"
        fill="rgba(255,255,255,0.55)"
        fontFamily="'Space Mono', monospace"
        {...taglineClamp}
      >
        {displayTagline}
      </text>

      <rect x="21" y="120" width="126" height="7" rx="2" fill="#111214" />
      <rect x="21" y="120" width="126" height="1.5" fill="#3a3b3f" />
    </svg>
  );
}