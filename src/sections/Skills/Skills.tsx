import { useEffect, useId, useRef, useState } from "react";
import { CATEGORIES } from "./skillsData";
import { SkillTile } from "./SkillTile";
import { playSelectBlip } from "./skillSound";

export default function Skills() {

  const [openId, setOpenId] = useState<string>("");
  const [sectionIn, setSectionIn] = useState<boolean>(false);

  const [flashId, setFlashId] = useState<string>("");
  const [reducedMotion, setReducedMotion] = useState<boolean>(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const [hoveredId, setHoveredId] = useState<string>("");

  const [entranceDone, setEntranceDone] = useState<boolean>(false);

  const [pendingId, setPendingId] = useState<string>("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function commitColumnSelect(id: string) {
    const opening = openId !== id;
    setOpenId((current) => (current === id ? "" : id));
    playSelectBlip(opening);
    if (opening && !reducedMotion) {
      setFlashId(id);
      window.setTimeout(() => setFlashId(""), 320);
    }
  }

  function handleColumnClick(id: string) {
    if (pendingId) return;
    if (reducedMotion) {
      commitColumnSelect(id);
      return;
    }
    setPendingId(id);
    window.setTimeout(() => {
      setPendingId("");
      commitColumnSelect(id);
    }, 65);
  }

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

  useEffect(() => {
    if (!sectionIn) return;
    const t = window.setTimeout(() => setEntranceDone(true), 1200);
    return () => window.clearTimeout(t);
  }, [sectionIn]);

  return (
    <div
      ref={rootRef}
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "transparent",
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 24px",
        boxSizing: "border-box",
      }}
    >
      <style>{`

        @keyframes frameDropIn {
          0% { opacity: 0; transform: translateY(-40px) scale(0.97); }
          60% { opacity: 1; transform: translateY(6px) scale(1.005); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes columnStepInLeft {
          0% { opacity: 0; transform: translateX(-46px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes columnStepInRight {
          0% { opacity: 0; transform: translateX(46px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        @keyframes selectFlash {
          0% { opacity: 0.85; }
          100% { opacity: 0; }
        }
        @keyframes selectSnap {
          0% { transform: scale(0.97); }
          55% { transform: scale(1.012); }
          100% { transform: scale(1); }
        }

        @keyframes headerSweep {
          0% { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(220%) skewX(-18deg); }
        }

        @keyframes windUp {
          0% { transform: scale(1); }
          100% { transform: scale(0.965); }
        }
        .mk-column.mk-windup {
          animation: windUp 0.065s ease-out forwards !important;
        }

        @keyframes bracketGlow {
          0%, 100% { filter: drop-shadow(0 0 0.5px var(--accent, #e8283c)); }
          50% { filter: drop-shadow(0 0 1.5px var(--accent, #e8283c)); }
        }

        @keyframes labelPunch {
          0% { transform: scale(0.85); }
          60% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        .mk-column {
          transition: flex-grow 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
                      background-color 0.25s ease, filter 0.3s ease,
                      transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
                      opacity 0.3s ease;
          flex-grow: 1;
          flex-basis: 0;
          cursor: pointer;
          background-color: rgba(255,255,255,0.015);
          transform: scale(1);
          transform-origin: center;

          --bracket: 16px;
          --bracket-w: 2px;
          background-image:
            linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14)),
            linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14)),
            linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14)),
            linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14)),
            linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14)),
            linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14)),
            linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14)),
            linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14));
          background-repeat: no-repeat;
          background-size:
            var(--bracket) var(--bracket-w), var(--bracket-w) var(--bracket),
            var(--bracket) var(--bracket-w), var(--bracket-w) var(--bracket),
            var(--bracket) var(--bracket-w), var(--bracket-w) var(--bracket),
            var(--bracket) var(--bracket-w), var(--bracket-w) var(--bracket);
          background-position:
            top left, top left,
            top right, top right,
            bottom left, bottom left,
            bottom right, bottom right;
          transition: flex-grow 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
                      background-color 0.25s ease, filter 0.3s ease,
                      transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
                      opacity 0.3s ease, background-size 0.3s ease;
        }
        .mk-column.mk-hovered:not(.open) {
          --bracket: 22px;
          background-color: rgba(255,255,255,0.045);
          transform: scale(1.025) translateY(-4px);
          z-index: 3;
          animation: bracketGlow 1.6s ease-in-out infinite;
        }
        .mk-column.open {
          --bracket: 22px;
          flex-grow: 6;
          cursor: default;
          background-color: rgba(255,255,255,0.03);
          animation: bracketGlow 2.2s ease-in-out infinite;
        }
        .mk-column.mk-hovered,
        .mk-column.open {
          background-image:
            linear-gradient(var(--accent, #e8283c), var(--accent, #e8283c)),
            linear-gradient(var(--accent, #e8283c), var(--accent, #e8283c)),
            linear-gradient(var(--accent, #e8283c), var(--accent, #e8283c)),
            linear-gradient(var(--accent, #e8283c), var(--accent, #e8283c)),
            linear-gradient(var(--accent, #e8283c), var(--accent, #e8283c)),
            linear-gradient(var(--accent, #e8283c), var(--accent, #e8283c)),
            linear-gradient(var(--accent, #e8283c), var(--accent, #e8283c)),
            linear-gradient(var(--accent, #e8283c), var(--accent, #e8283c));
        }

        .mk-columns-row.mk-has-hover .mk-column:not(.mk-hovered):not(.open) {
          opacity: 0.55;
          filter: saturate(0.35) brightness(0.8);
        }
        .mk-column:focus-visible {
          outline: 2px solid var(--accent, #e8283c);
          outline-offset: -2px;
        }
        .mk-column-label {
          transition: transform 0.2s ease;
        }
        .mk-column.mk-hovered .mk-column-label {
          animation: labelPunch 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .mk-column-bar {
          position: absolute;
          left: 10%;
          right: 10%;
          bottom: 0;
          height: 2px;
          background: rgba(255,255,255,0.12);
          overflow: hidden;
        }
        .mk-column-bar::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 30%;
          opacity: 0.4;
          background: var(--accent, #e8283c);
          transform: translateX(-50%);
          transition: width 0.3s ease, opacity 0.3s ease;
        }
        .mk-column:hover .mk-column-bar::after,
        .mk-column.mk-hovered .mk-column-bar::after {
          width: 100%;
          opacity: 1;
        }

        .mk-select-flash {
          position: absolute;
          inset: 0;
          background: #fff;
          pointer-events: none;
          animation: selectFlash 0.28s ease-out forwards;
          z-index: 5;
        }
        .mk-column.mk-snap {
          animation: selectSnap 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .mk-header-sweep {
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(232,40,60,0.28), transparent);
          animation: headerSweep 1.1s ease-out 0.5s both;
          pointer-events: none;
        }

        .mk-portrait-placeholder {
          transition: transform 0.4s ease, filter 0.4s ease;
        }
        .mk-column:hover .mk-portrait-placeholder,
        .mk-column.mk-hovered .mk-portrait-placeholder {
          transform: scale(1.07);
          filter: brightness(1.22);
        }

        .mk-rim {
          box-shadow: inset -8px 0 14px -16px var(--accent, #e8283c), inset 8px 0 14px -18px var(--accent, #e8283c);
          opacity: 0.4;
          transition: box-shadow 0.3s ease, opacity 0.3s ease;
        }
        .mk-column.mk-hovered .mk-rim,
        .mk-column.open .mk-rim {
          box-shadow: inset -14px 0 22px -16px var(--accent, #e8283c), inset 14px 0 22px -18px var(--accent, #e8283c);
          opacity: 0.55;
        }

        .mk-tile {
          animation: tileIn 0.32s ease-out both;
          opacity: 0;
        }
        @keyframes tileIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mk-tile-card {
          transition: border-color 0.2s ease, background 0.2s ease, transform 0.08s ease-out;
          position: relative;
        }
        .mk-tile-card:hover {
          background: rgba(255,255,255,0.05);
          z-index: 2;
        }

        .mk-brand-svg {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mk-brand-svg svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .mk-brand-svg.mk-brand-mono svg,
        .mk-brand-svg.mk-brand-mono svg path,
        .mk-brand-svg.mk-brand-mono svg g {
          fill: currentColor;
        }

        .mk-skills-grid {
          scrollbar-width: thin;
          scrollbar-color: rgba(232,40,60,0.6) transparent;
        }
        .mk-skills-grid::-webkit-scrollbar {
          width: 4px;
        }
        .mk-skills-grid::-webkit-scrollbar-track {
          background: transparent;
        }
        .mk-skills-grid::-webkit-scrollbar-thumb {
          background: rgba(232,40,60,0.6);
          border-radius: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          .mk-column { transition: none; }
          .mk-tile { animation: none; opacity: 1; }
          .mk-tile-card, .mk-column:hover .mk-portrait-placeholder { transform: none !important; }
          .mk-fade { animation: none !important; opacity: 1 !important; transform: none !important; }
          .mk-column-step { animation: none !important; opacity: 1 !important; transform: none !important; }
          .mk-column.mk-snap { animation: none !important; }
          .mk-column.mk-windup { animation: none !important; transform: none !important; }
          .mk-column.mk-hovered, .mk-column.open { animation: none !important; transform: none !important; }
          .mk-column-label { animation: none !important; }
          .mk-select-flash, .mk-header-sweep { display: none !important; }
          .mk-column-bar::after { transition: none; }
        }

        @media (max-width: 760px) {
          .mk-columns-row { flex-direction: column !important; height: auto !important; gap: 6px !important; }
          .mk-column { min-height: 68px; }
          .mk-column.open { min-height: 380px; padding: 20px 16px !important; }
        }
      `}</style>

      <div
        className="mk-fade"
        style={{
          width: "100%",
          maxWidth: "1180px",
          position: "relative",
          opacity: sectionIn ? 1 : 0,
          animation: sectionIn ? "frameDropIn 0.65s cubic-bezier(0.2, 0.85, 0.25, 1) both" : "none",
        }}
      >

        <p
          style={{
            margin: "0 0 10px",
            fontSize: "12px",
            letterSpacing: "0.35em",
            color: "#e8283c",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          LOADOUT
        </p>

        <div
          style={{
            position: "relative",
            border: "2px solid rgba(232,40,60,0.45)",
            borderRadius: "36px",
            overflow: "hidden",

            background:
              "linear-gradient(122deg, #150708 0%, #0d0d0d 38%, #0d0d0d 62%, #120a0d 100%)",
            boxShadow: "0 0 60px rgba(232,40,60,0.1)",
          }}
        >

          {[
            { top: 14, left: 14, borderWidth: "3px 0 0 3px" },
            { top: 14, right: 14, borderWidth: "3px 3px 0 0" },
            { bottom: 14, left: 14, borderWidth: "0 0 3px 3px" },
            { bottom: 14, right: 14, borderWidth: "0 3px 3px 0" },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "22px",
                height: "22px",
                borderColor: "rgba(232,40,60,0.85)",
                borderStyle: "solid",
                pointerEvents: "none",
                zIndex: 2,
                ...pos,
              }}
            />
          ))}

          <div
            style={{
              position: "relative",
              overflow: "hidden",
              padding: "28px 32px",
              borderBottom: "2px solid rgba(232,40,60,0.45)",
              textAlign: "center",
            }}
          >
            {sectionIn && <div className="mk-header-sweep" />}
            <h1
              style={{
                margin: 0,
                fontFamily: "'Anton', sans-serif",
                fontSize: "clamp(28px, 3.6vw, 44px)",
                color: "#f2f2f2",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                textShadow: "0 0 24px rgba(232,40,60,0.2)",
              }}
            >
              Choose a skill!
            </h1>
          </div>

          <div
            className={`mk-columns-row${hoveredId ? " mk-has-hover" : ""}`}
            style={{
              display: "flex",
              height: "520px",
              gap: "8px",
              padding: "20px",
              boxSizing: "border-box",
            }}
          >
            {CATEGORIES.map((category, ci) => {
              const isOpen = openId === category.id;
              const Icon = category.icon;
              const fromLeft = ci % 2 === 0;
              const justSelected = flashId === category.id;
              const isHovered = hoveredId === category.id;
              const isPending = pendingId === category.id;
              return (
                <div
                  key={category.id}
                  className={`mk-column mk-column-step ${isOpen ? "open" : ""} ${justSelected ? "mk-snap" : ""} ${isHovered ? "mk-hovered" : ""} ${isPending ? "mk-windup" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-label={`${category.label} category, ${category.skills.length} skills`}
                  onClick={() => handleColumnClick(category.id)}
                  onMouseEnter={() => setHoveredId(category.id)}
                  onMouseLeave={() => setHoveredId((current) => (current === category.id ? "" : current))}
                  onFocus={() => setHoveredId(category.id)}
                  onBlur={() => setHoveredId((current) => (current === category.id ? "" : current))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleColumnClick(category.id);
                    }
                  }}
                  style={
                    {
                      "--accent": category.accent,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: isOpen ? "flex-start" : "stretch",
                      padding: isOpen ? "28px 22px" : "0",
                      minWidth: 0,
                      overflow: "hidden",
                      position: "relative",
                      opacity: sectionIn ? 1 : 0,
                      animation:
                        sectionIn && !entranceDone
                          ? `${fromLeft ? "columnStepInLeft" : "columnStepInRight"} 0.5s cubic-bezier(0.2, 0.85, 0.25, 1) ${0.28 + ci * 0.09}s both`
                          : undefined,
                    } as React.CSSProperties
                  }
                >
                  {justSelected && <div className="mk-select-flash" />}
                  {!isOpen && <div className="mk-column-bar" />}
                  {!isOpen && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        zIndex: 2,
                        minWidth: "20px",
                        height: "20px",
                        padding: "0 5px",
                        borderRadius: "10px",
                        background: "rgba(10,10,10,0.65)",
                        border: `1px solid ${category.accent}88`,
                        color: category.accent,
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "10px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                      }}
                    >
                      {category.skills.length}
                    </span>
                  )}
                  {!isOpen && (
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {category.portraitUrl ? (
                        <img
                          src={category.portraitUrl}
                          alt={category.fighterName}
                          className="mk-portrait-placeholder"
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center top",
                          }}
                        />
                      ) : (
                        <div
                          className="mk-portrait-placeholder"
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(180deg, ${category.accent}14 0%, #0a0a0a 85%)`,
                          }}
                        >
                          <FighterSilhouette
                            color={category.accent}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                          />
                        </div>
                      )}

                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.85) 100%)",
                          pointerEvents: "none",
                        }}
                      />

                      <div className="mk-rim" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "3px",
                          paddingBottom: "20px",
                          width: "100%",
                        }}
                      >
                        <span
                          className="mk-column-label"
                          style={{
                            fontFamily: "'Anton', sans-serif",
                            fontSize: "17px",
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                            color: category.accent,
                            lineHeight: 1,
                            textAlign: "center",
                            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                          }}
                        >
                          {category.fighterName}
                        </span>
                        <span
                          style={{
                            fontSize: "9.5px",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.5)",
                            textAlign: "center",
                            lineHeight: 1.3,
                          }}
                        >
                          {category.label}
                        </span>
                      </div>
                    </div>
                  )}

                  {isOpen && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "26px",
                        }}
                      >
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "12px",
                            border: `1.5px solid ${category.accent}88`,
                            background: `${category.accent}18`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={22} strokeWidth={1.75} color={category.accent} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span
                            style={{
                              fontFamily: "'Anton', sans-serif",
                              fontSize: "19px",
                              letterSpacing: "0.02em",
                              textTransform: "uppercase",
                              color: category.accent,
                              lineHeight: 1,
                            }}
                          >
                            {category.fighterName}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.4)",
                            }}
                          >
                            {category.label}
                          </span>
                        </div>
                      </div>
                      <div
                        className="mk-skills-grid"
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "14px",
                          justifyContent: "center",
                          alignContent: "flex-start",
                          flex: "1 1 auto",
                          minHeight: 0,
                          overflowY: "auto",
                          overflowX: "hidden",
                          width: "100%",
                          paddingTop: "8px",
                        }}
                      >
                        {category.skills.map((skill, i) => (
                          <SkillTile
                            key={skill.name}
                            skill={skill}
                            accent={category.accent}
                            delay={i * 45}
                            reducedMotion={reducedMotion}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p
          style={{
            margin: "18px 0 0",
            fontSize: "10.5px",
            letterSpacing: "0.05em",
            color: "rgba(255,255,255,0.35)",
            textAlign: "center",
          }}
        >
          Tap a column to expand it
        </p>
      </div>
    </div>
  );
}

function FighterSilhouette({ color, style }: { color: string; style?: React.CSSProperties }) {
  const gradId = useId();
  return (
    <svg
      viewBox="0 0 200 260"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
      style={style}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.04" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="72" r="40" fill={`url(#${gradId})`} />
      <path
        d="M100 118 C60 118 24 150 18 260 L182 260 C176 150 140 118 100 118 Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}