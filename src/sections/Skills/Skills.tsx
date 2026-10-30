import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, type Skill, type SkillCategory } from "./skillsData";
import { BRAND_SVGS, MONO_BRAND_ICONS } from "./brandSvgs";
import { playSelectBlip } from "./skillSound";
import { PROJECTS, PORTFOLIO_STACK } from "../../data/projects";
import RoundTag from "../shared/RoundTag";

interface RosterEntry {
  skill: Skill;
  category: SkillCategory;
}

const ROSTER: RosterEntry[] = CATEGORIES.flatMap((category) =>
  category.skills.map((skill) => ({ skill, category }))
);

const DEFAULT_SKILL = "TypeScript";

/** Which featured projects list this skill in their stack. */
function projectsUsing(skillName: string): string[] {
  const key = skillName.toLowerCase();
  const used = PROJECTS.filter((p) => p.stack.some((s) => s.toLowerCase() === key)).map((p) => p.name);
  if (PORTFOLIO_STACK.some((s) => s.toLowerCase() === key)) used.push("This portfolio");
  return used;
}

function BrandIcon({ skill, size }: { skill: Skill; size: number }) {
  const svg = skill.iconSlug ? BRAND_SVGS[skill.iconSlug] : undefined;
  if (!svg) {
    return (
      <span
        aria-hidden="true"
        style={{
          fontFamily: "var(--mk-font-pixel)",
          fontSize: Math.round(size * 0.28),
          color: "#e8e3dc",
          lineHeight: 1,
        }}
      >
        {skill.tag}
      </span>
    );
  }
  const mono = !!skill.iconSlug && MONO_BRAND_ICONS.has(skill.iconSlug);
  return (
    <span
      aria-hidden="true"
      className={`mk-sk-icon${mono ? " mk-sk-mono" : ""}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default function Skills() {
  const [selectedName, setSelectedName] = useState<string>(DEFAULT_SKILL);
  const [previewName, setPreviewName] = useState<string>("");
  const [sectionIn, setSectionIn] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isNarrow, setIsNarrow] = useState<boolean>(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches
  );
  const [notchX, setNotchX] = useState<number>(34);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const onChange = () => setIsNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // On mobile the detail box opens under the tapped tile's row, with its notch
  // pointing at that tile. Measure where the tile sits inside its group.
  useLayoutEffect(() => {
    if (!isNarrow) return;
    const measure = () => {
      const tile = rootRef.current?.querySelector<HTMLElement>('.mk-sk-tile[aria-pressed="true"]');
      const group = tile?.closest<HTMLElement>(".mk-sk-group");
      if (!tile || !group) return;
      const t = tile.getBoundingClientRect();
      const g = group.getBoundingClientRect();
      setNotchX(Math.round(t.left - g.left + t.width / 2));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isNarrow, selectedName]);

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
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const shownName = previewName || selectedName;
  const shown = ROSTER.find((e) => e.skill.name === shownName) ?? ROSTER[0];
  const usedIn = useMemo(() => projectsUsing(shown.skill.name), [shown.skill.name]);
  const picked = ROSTER.find((e) => e.skill.name === selectedName) ?? ROSTER[0];
  const pickedUsedIn = useMemo(() => projectsUsing(picked.skill.name), [picked.skill.name]);

  function choose(name: string) {
    if (name !== selectedName) playSelectBlip(true);
    setSelectedName(name);
  }

  function goToProjects() {
    document.querySelector('[data-section-id="projects"]')?.scrollIntoView({ behavior: "smooth" });
  }

  const accent = shown.category.accent;

  function renderUsed(list: string[]) {
    return list.length > 0 ? (
      <ul className="mk-sk-used">
        {list.map((name) => (
          <li key={name}>
            {name === "This portfolio" ? (
              <span className="mk-sk-proj mk-sk-proj-static">{name}</span>
            ) : (
              <button type="button" className="mk-sk-proj" onClick={goToProjects}>
                {name}
              </button>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <p className="mk-sk-none">Not in a featured project yet.</p>
    );
  }

  return (
    <div ref={rootRef} className="mk-sk-root">
      <style>{`
        .mk-sk-root {
          width: 100%;
          min-height: 100svh;
          font-family: var(--mk-font-body);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 72px 24px;
          box-sizing: border-box;
          isolation: isolate;
        }
        @keyframes mkSkFrameIn {
          from { opacity: 0; transform: translateY(-24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mkSkSlam {
          0% { transform: scale(1.12); filter: brightness(1.8); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        .mk-sk-frame {
          position: relative;
          width: 100%;
          max-width: 1180px;
          border: 1px solid rgba(232,40,60,0.55);
          border-radius: 0;
          background: #0e0b0c;
          
          padding: 36px 40px 40px;
          box-sizing: border-box;
          opacity: 0;
        }
        .mk-sk-frame.in { animation: mkSkFrameIn 0.6s cubic-bezier(0.2, 0.85, 0.25, 1) forwards; }
        .mk-sk-title {
          margin: 0 0 6px;
          font-family: var(--mk-font-display);
          font-size: clamp(30px, 3.8vw, 48px);
          line-height: 1;
          color: #f2f2f2;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .mk-sk-sub {
          margin: 0 0 32px;
          font-size: 14px;
          color: rgba(255,255,255,0.5);
        }
        .mk-sk-arena {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 40px;
          align-items: start;
        }
        .mk-sk-group + .mk-sk-group { margin-top: 22px; }
        .mk-sk-group-label {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 10px;
          font-size: 13px;
          color: rgba(255,255,255,0.62);
        }
        .mk-sk-group-label::before {
          content: "";
          width: 14px;
          height: 3px;
          background: var(--accent);
        }
        .mk-sk-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .mk-sk-tile {
          position: relative;
          width: 68px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid rgba(255,255,255,0.08);
          border-bottom: 3px solid color-mix(in srgb, var(--accent) 70%, transparent);
          border-radius: 0;
          background: #121317;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .mk-sk-tile:hover, .mk-sk-tile:focus-visible {
          border-color: var(--accent);
          background: color-mix(in srgb, var(--accent) 14%, #121317);
          outline: none;
        }
        .mk-sk-tile[aria-pressed="true"] {
          border: 2px solid #e8283c;
          border-bottom-width: 3px;
          
        }
        .mk-sk-tile[aria-pressed="true"]::after {
          content: "P1";
          position: absolute;
          top: -9px;
          left: -6px;
          font-family: var(--mk-font-pixel);
          font-size: 12px;
          line-height: 1;
          padding: 3px 4px;
          background: #e8283c;
          color: #0a0a0a;
          border-radius: 0;
        }
        .mk-sk-icon { display: inline-flex; }
        .mk-sk-icon svg { width: 100%; height: 100%; display: block; }
        .mk-sk-mono svg, .mk-sk-mono svg path, .mk-sk-mono svg g { fill: #e8e3dc; }

        .mk-sk-panel {
          position: sticky;
          top: 96px;
          border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
          border-radius: 0;
          background: #0d0d10;
          padding: 22px;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }
        .mk-sk-panel-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }
        .mk-sk-p1 {
          font-family: var(--mk-font-pixel);
          font-size: 12px;
          padding: 5px 7px;
          background: #e8283c;
          color: #0a0a0a;
          border-radius: 0;
        }
        .mk-sk-class {
          font-size: 13px;
          color: var(--accent);
        }
        .mk-sk-portrait {
          height: 180px;
          border-radius: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0c;
          border: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 18px;
          overflow: hidden;
        }
        .mk-sk-portrait-inner { display: flex; animation: mkSkSlam 0.28s cubic-bezier(0.2, 0.9, 0.3, 1); }
        .mk-sk-name {
          margin: 0 0 4px;
          font-family: var(--mk-font-display);
          font-size: 40px;
          line-height: 1;
          color: #f5f0e6;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          overflow-wrap: anywhere;
        }
        .mk-sk-cat { margin: 0 0 20px; font-size: 14px; color: rgba(255,255,255,0.55); }
        .mk-sk-used-label {
          margin: 0 0 8px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.08);
          font-size: 13px;
          color: rgba(255,255,255,0.6);
        }
        .mk-sk-used { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
        .mk-sk-proj {
          font: inherit;
          font-size: 13px;
          color: #f2f2f2;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 0;
          padding: 6px 10px;
          cursor: pointer;
        }
        .mk-sk-proj:hover, .mk-sk-proj:focus-visible { border-color: #ff8a5b; color: #ff8a5b; outline: none; }
        .mk-sk-proj-static { cursor: default; display: inline-block; line-height: normal; }
        .mk-sk-proj-static:hover { border-color: rgba(255,255,255,0.14); color: #f2f2f2; }
        .mk-sk-none { margin: 0; font-size: 13px; color: rgba(255,255,255,0.6); }

        .mk-sk-group { position: relative; }
        .mk-sk-dialog { display: none; }

        @keyframes mkSkBoxOpen {
          0% { clip-path: inset(0 0 100% 0); }
          100% { clip-path: inset(0 0 0 0); }
        }

        /* Mobile: no pinned panel. Tapping a tile opens an RPG-style text box
           right under its row, notched toward the tile you picked. */
        @media (max-width: 900px) {
          .mk-sk-frame { padding: 26px 18px 28px; }
          .mk-sk-arena { grid-template-columns: 1fr; gap: 0; }
          .mk-sk-panel { display: none; }
          .mk-sk-sub { margin-bottom: 24px; }
          .mk-sk-dialog {
            display: block;
            position: relative;
            margin: 16px 0 4px;
            padding: 14px 14px 16px;
            background: var(--mk-bg);
            border: 3px solid var(--mk-cream);
            box-shadow: 5px 5px 0 var(--accent);
            animation: mkSkBoxOpen 0.18s steps(4, end);
          }
          /* notch: cream outer triangle with a dark inner one to keep the border */
          .mk-sk-dialog::before,
          .mk-sk-dialog::after {
            content: "";
            position: absolute;
            left: calc(var(--notch) - 10px);
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
          }
          .mk-sk-dialog::before { top: -13px; border-bottom: 10px solid var(--mk-cream); }
          .mk-sk-dialog::after { top: -8px; border-bottom: 10px solid var(--mk-bg); }
          .mk-sk-dialog-head {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .mk-sk-dialog-icon {
            width: 52px;
            height: 52px;
            flex: none;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #121317;
            border-bottom: 3px solid var(--accent);
            animation: mkSkSlam 0.28s cubic-bezier(0.2, 0.9, 0.3, 1);
          }
          .mk-sk-dialog-name {
            margin: 0;
            font-family: var(--mk-font-display);
            font-size: 30px;
            line-height: 0.95;
            color: var(--mk-cream);
            text-transform: uppercase;
            overflow-wrap: anywhere;
          }
          .mk-sk-dialog-class { margin: 2px 0 0; font-size: 13px; color: var(--accent); }
          .mk-sk-dialog-label {
            margin: 14px 0 8px;
            font-size: 13px;
            color: rgba(255,255,255,0.6);
          }
        }
        @media (max-width: 480px) {
          .mk-sk-root { padding: 48px 12px; }
          .mk-sk-tile { width: 54px; height: 54px; }
          .mk-sk-row { gap: 6px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-sk-frame, .mk-sk-frame.in { animation: none; opacity: 1; }
          .mk-sk-portrait-inner { animation: none; }
          .mk-sk-tile, .mk-sk-panel { transition: none; }
          .mk-sk-dialog, .mk-sk-dialog-icon { animation: none !important; }
        }
      `}</style>

      <div
        className={`mk-sk-frame${sectionIn ? " in" : ""}`}
        style={{ "--accent": accent } as React.CSSProperties}
      >
        <RoundTag label="Round three" />
        <h2 className="mk-sk-title">Choose your skill</h2>
        <p className="mk-sk-sub">Hover or tap a tile to see where I've used it.</p>

        <div className="mk-sk-arena">
          <div onMouseLeave={() => setPreviewName("")}>
            {CATEGORIES.map((category) => (
              <section
                key={category.id}
                className="mk-sk-group"
                aria-label={category.label}
                style={{ "--accent": category.accent } as React.CSSProperties}
              >
                <h3 className="mk-sk-group-label" style={{ fontWeight: 400 }}>
                  {category.label}
                </h3>
                <ul className="mk-sk-row">
                  {category.skills.map((skill) => (
                    <li key={skill.name}>
                      <button
                        type="button"
                        className="mk-sk-tile"
                        aria-pressed={selectedName === skill.name}
                        aria-label={skill.name}
                        title={skill.name}
                        onClick={() => choose(skill.name)}
                        // Preview only feeds the desktop side panel. On touch it re-renders
                        // mid-tap and swallows the click, so skip it on narrow screens.
                        onMouseEnter={isNarrow ? undefined : () => setPreviewName(skill.name)}
                        onFocus={isNarrow ? undefined : () => setPreviewName(skill.name)}
                        onBlur={isNarrow ? undefined : () => setPreviewName("")}
                      >
                        <BrandIcon skill={skill} size={30} />
                      </button>
                    </li>
                  ))}
                </ul>
                {isNarrow && picked.category.id === category.id && (
                  <div
                    key={picked.skill.name}
                    className="mk-sk-dialog"
                    aria-live="polite"
                    style={{ "--notch": `${notchX}px` } as React.CSSProperties}
                  >
                    <div className="mk-sk-dialog-head">
                      <span className="mk-sk-dialog-icon">
                        <BrandIcon skill={picked.skill} size={34} />
                      </span>
                      <div>
                        <p className="mk-sk-dialog-name">{picked.skill.name}</p>
                        <p className="mk-sk-dialog-class">{picked.category.fighterName}</p>
                      </div>
                    </div>
                    <p className="mk-sk-dialog-label">Featured in</p>
                    {renderUsed(pickedUsedIn)}
                  </div>
                )}
              </section>
            ))}
          </div>

          <aside
            className="mk-sk-panel"
            aria-live="polite"
            style={{ "--accent": accent } as React.CSSProperties}
          >
            <div className="mk-sk-panel-top">
              <span className="mk-sk-p1">P1</span>
              <span className="mk-sk-class">{shown.category.fighterName}</span>
            </div>
            <div className="mk-sk-portrait">
              <div key={shown.skill.name} className="mk-sk-portrait-inner">
                <BrandIcon skill={shown.skill} size={84} />
              </div>
            </div>
            <p className="mk-sk-name">{shown.skill.name}</p>
            <p className="mk-sk-cat">{shown.category.label}</p>
            <p className="mk-sk-used-label">Featured in</p>
            {renderUsed(usedIn)}
          </aside>
        </div>
      </div>
    </div>
  );
}
