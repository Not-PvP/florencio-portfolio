import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "./skillsData";
import { SkillTile } from "./SkillTile";
import { playSelectBlip } from "./skillSound";

// ── Component ────────────────────────────────────────────────────────
export default function Skills() {
  // Empty = no column expanded yet, matching the resting state.
  const [openId, setOpenId] = useState<string>("");
  const [sectionIn, setSectionIn] = useState<boolean>(false);
  // Tracks the column that just got selected so it can play a one-shot
  // flash/snap moment, then clears itself once the animation finishes.
  const [flashId, setFlashId] = useState<string>("");
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  // Tracks which column the pointer is over so the rest of the row can
  // dim and desaturate — a spotlight/target-lock effect, like narrowing
  // focus onto a fighter at a select screen.
  const [hoveredId, setHoveredId] = useState<string>("");
  // Once the one-shot entrance animation has had time to finish, we stop
  // setting `animation` inline so the hover/open glow keyframes (driven by
  // CSS classes) aren't silently overridden by the inline style.
  const [entranceDone, setEntranceDone] = useState<boolean>(false);
  // The column mid wind-up: briefly true between a click/Enter and the
  // actual open/close committing, so a short "hit-stop" beat can play —
  // fighting games pause a frame right before an impact actually lands.
  const [pendingId, setPendingId] = useState<string>("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const columnRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
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
    if (pendingId) return; // debounce: a wind-up is already in flight
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

  // Left/Right moves focus between columns like a real character-select
  // screen; Enter/Space (handled per-column) locks the focused one in.
  function handleRowKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const refs = columnRefs.current;
    const currentIndex = refs.findIndex((el) => el === document.activeElement);
    if (currentIndex === -1) return;
    e.preventDefault();
    const dir = e.key === "ArrowLeft" ? -1 : 1;
    const nextIndex = (currentIndex + dir + refs.length) % refs.length;
    refs[nextIndex]?.focus();
  }

  // Fade in the first time this section scrolls into view, matching the
  // hero's entrance instead of just appearing at full opacity whenever
  // the user happens to scroll past.
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

  // Longest entrance delay is ~0.28s + 4*0.09s plus its own 0.5s duration;
  // give it a little headroom before handing "animation" back to CSS.
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
        /* Eyebrow + card frame drop in from above like a UI panel powering
           on, instead of a plain fade. */
        @keyframes frameDropIn {
          0% { opacity: 0; transform: translateY(-40px) scale(0.97); }
          60% { opacity: 1; transform: translateY(6px) scale(1.005); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* Each fighter-select column steps in from alternating sides,
           like they're walking onto the select screen one by one. */
        @keyframes columnStepInLeft {
          0% { opacity: 0; transform: translateX(-46px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes columnStepInRight {
          0% { opacity: 0; transform: translateX(46px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        /* The one signature "fight's on" moment: a hard white flash and a
           snap-zoom overshoot, fired once when a column is selected. Every
           other interaction in this section stays calm on purpose. */
        @keyframes selectFlash {
          0% { opacity: 0.85; }
          100% { opacity: 0; }
        }
        @keyframes selectSnap {
          0% { transform: scale(0.97); }
          55% { transform: scale(1.012); }
          100% { transform: scale(1); }
        }
        /* One-time diagonal light sweep across the header rule on entrance. */
        @keyframes headerSweep {
          0% { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(220%) skewX(-18deg); }
        }
        /* Sparks kick off the four bracket corners the instant a column
           is locked in, timed with the flash. */
        @keyframes sparkBurst {
          0% { opacity: 1; transform: scale(0.3); }
          100% { opacity: 0; transform: scale(2.4); }
        }
        /* Hit-stop: a tiny compress-and-hold right as a selection is made,
           before the flash/snap lands — the beat of stillness a fighting
           game freezes on right before impact registers. */
        @keyframes windUp {
          0% { transform: scale(1); }
          100% { transform: scale(0.965); }
        }
        .mk-column.mk-windup {
          animation: windUp 0.065s ease-out forwards !important;
        }
        /* A slow glow breathing on the bracket corners of whichever column
           currently has focus — hover or open — so the "lock" reads as
           alive rather than a static state swap. */
        @keyframes bracketGlow {
          0%, 100% { filter: drop-shadow(0 0 2px var(--accent, #e8283c)); }
          50% { filter: drop-shadow(0 0 7px var(--accent, #e8283c)); }
        }
        /* Category label gives a small punch when its column becomes the
           hovered target, like a name-plate snapping into place. */
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
          /* Corner-bracket frame instead of a flat border: four small L
             marks in the category accent, HUD target-lock style. */
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
        /* Spotlight: once anything in the row is hovered, the columns that
           are neither hovered nor open sink back — like the rest of the
           roster fading out of focus at a select screen. */
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
        .mk-spark {
          position: absolute;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: radial-gradient(circle, #fff 0%, var(--accent, #e8283c) 55%, transparent 75%);
          pointer-events: none;
          animation: sparkBurst 0.4s ease-out forwards;
          z-index: 6;
        }

        /* Health-bar style underline for closed columns: a thin track that
           fills from the center outward on hover. */
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
          width: 0%;
          background: var(--accent, #e8283c);
          transform: translateX(-50%);
          transition: width 0.3s ease;
        }
        .mk-column:hover .mk-column-bar::after {
          width: 100%;
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
          box-shadow: inset -12px 0 20px -14px var(--accent, #e8283c), inset 12px 0 20px -16px var(--accent, #e8283c);
          opacity: 0.7;
          transition: box-shadow 0.3s ease, opacity 0.3s ease;
        }
        .mk-column.mk-hovered .mk-rim,
        .mk-column.open .mk-rim {
          box-shadow: inset -22px 0 34px -12px var(--accent, #e8283c), inset 22px 0 34px -14px var(--accent, #e8283c);
          opacity: 1;
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
        /* Single-color brand marks (Turso, Railway, Render, Vercel, Anthropic,
           Express, Zod, Gemini) ship with NO fill attribute at all, which per
           the SVG spec defaults to solid black — not currentColor. Force
           their un-filled shapes to pick up the tile's accent color instead,
           without touching any icon that already sets its own real brand
           color (e.g. Python's blue/yellow, JavaScript's yellow). */
        .mk-brand-svg.mk-brand-mono svg,
        .mk-brand-svg.mk-brand-mono svg path,
        .mk-brand-svg.mk-brand-mono svg g {
          fill: currentColor;
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
          .mk-select-flash, .mk-header-sweep, .mk-spark { display: none !important; }
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
        {/* Eyebrow, echoing the other sections */}
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

        {/* One bordered card holding the header strip + the column row */}
        <div
          style={{
            position: "relative",
            border: "2px solid rgba(232,40,60,0.45)",
            borderRadius: "36px",
            overflow: "hidden",
            // A restrained diagonal wash — a hint of the VS-screen split
            // without turning into a hard two-tone panel.
            background:
              "linear-gradient(122deg, #150708 0%, #0d0d0d 38%, #0d0d0d 62%, #120a0d 100%)",
            boxShadow: "0 0 60px rgba(232,40,60,0.1)",
          }}
        >
          {/* HUD-style corner brackets on the outer panel, echoing the
              per-column bracket treatment below. */}
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

          {/* Sound toggle removed — handled by the site-wide sound control */}

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
            onKeyDown={handleRowKeyDown}
            style={{
              display: "flex",
              height: "520px",
              gap: "3px",
              padding: "14px",
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
                  ref={(el) => { columnRefs.current[ci] = el; }}
                  className={`mk-column mk-column-step ${isOpen ? "open" : ""} ${justSelected ? "mk-snap" : ""} ${isHovered ? "mk-hovered" : ""} ${isPending ? "mk-windup" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-label={`${category.label} category`}
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
                  {justSelected && (
                    <div className="mk-select-flash">
                      <span className="mk-spark" style={{ top: "10px", left: "10px" }} />
                      <span className="mk-spark" style={{ top: "10px", right: "10px" }} />
                      <span className="mk-spark" style={{ bottom: "10px", left: "10px" }} />
                      <span className="mk-spark" style={{ bottom: "10px", right: "10px" }} />
                    </div>
                  )}
                  {!isOpen && <div className="mk-column-bar" />}
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
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: `linear-gradient(180deg, ${category.accent}10 0%, #0a0a0a 85%)`,
                          }}
                        >
                          <Icon size={56} strokeWidth={1} color={`${category.accent}55`} />
                        </div>
                      )}

                      {/* bottom gradient so the name reads over either the image or the placeholder */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.85) 100%)",
                          pointerEvents: "none",
                        }}
                      />

                      {/* Hard rim-light in the category's own accent, like a
                          fighter lit from the side on a VS screen — and it
                          flares brighter once this column has focus. */}
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
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "14px",
                          justifyContent: "center",
                          alignContent: "flex-start",
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