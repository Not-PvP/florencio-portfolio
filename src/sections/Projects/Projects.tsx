import { useEffect, useRef, useState } from "react";
import { Trophy } from "lucide-react";
import { Cartridge, CARTRIDGE_CSS } from "./Cartridge";
import { ConsoleShellSVG } from "./Gameboy";
import { PROJECTS, type Project } from "../../data/projects";

interface GithubStats {
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  pushedAt: string;
  createdAt: string;
  sizeKb: number;
  license: string | null;
  contributors: number;
}

type StatsState =
  | { status: "private" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: GithubStats };

function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const [, owner, repo] = u.pathname.split("/");
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "TODAY";
  if (days === 1) return "1 DAY AGO";
  if (days < 30) return `${days} DAYS AGO`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} MO AGO`;
  return `${Math.floor(months / 12)} YR AGO`;
}

export default function Projects() {
  const [selectedId, setSelectedId] = useState<string>(PROJECTS[0].id);
  const [flash, setFlash] = useState<boolean>(false);
  const [sectionIn, setSectionIn] = useState<boolean>(false);
  const [statsByProject, setStatsByProject] = useState<Record<string, StatsState>>(() =>
    Object.fromEntries(
      PROJECTS.map((p) => {
        const hasGithub = p.links.some((l) => l.label.toLowerCase() === "github");
        return [p.id, { status: hasGithub ? "loading" : "private" } as StatsState];
      })
    )
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  const [poweredOn, setPoweredOn] = useState<boolean>(false);
  const [inserting, setInserting] = useState<boolean>(false);
  const [insertingProject, setInsertingProject] = useState<Project | null>(null);
  const hasAutoInserted = useRef<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        PROJECTS.map(async (project) => {
          const ghLink = project.links.find((l) => l.label.toLowerCase() === "github");
          const parsed = ghLink ? parseGithubRepo(ghLink.url) : null;
          if (!parsed) return [project.id, { status: "private" } as StatsState] as const;

          try {
            const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
            if (!res.ok) throw new Error("bad response");
            const json = await res.json();

            let contributors = 0;
            try {
              const contribRes = await fetch(
                `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contributors?per_page=100&anon=true`
              );
              if (contribRes.ok) {
                const contribJson = await contribRes.json();
                if (Array.isArray(contribJson)) contributors = contribJson.length;
              }
            } catch {
            }

            return [
              project.id,
              {
                status: "ready",
                data: {
                  stars: json.stargazers_count ?? 0,
                  forks: json.forks_count ?? 0,
                  openIssues: json.open_issues_count ?? 0,
                  language: json.language ?? null,
                  pushedAt: json.pushed_at ?? json.updated_at ?? new Date().toISOString(),
                  createdAt: json.created_at ?? new Date().toISOString(),
                  sizeKb: json.size ?? 0,
                  license: json.license?.spdx_id ?? null,
                  contributors,
                },
              } as StatsState,
            ] as const;
          } catch {
            return [project.id, { status: "error" } as StatsState] as const;
          }
        })
      );
      if (!cancelled) setStatsByProject(Object.fromEntries(entries));
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const triggerCartridgeInsertion = (project: Project) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSelectedId(project.id);

    if (reduceMotion) {
      setPoweredOn(true);
      return;
    }

    setPoweredOn(false);
    setInsertingProject(project);
    setInserting(true);

    window.setTimeout(() => {
      setInserting(false);
      setPoweredOn(true);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 260);
    }, 900);
  };

  function selectProject(id: string) {
    if (inserting) return;
    if (id === selectedId && poweredOn) return;

    const project = PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
    triggerCartridgeInsertion(project);
  }

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionIn(true);

          if (!hasAutoInserted.current) {
            hasAutoInserted.current = true;
            triggerCartridgeInsertion(PROJECTS[0]);
          }

          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const selected = PROJECTS.find((p) => p.id === selectedId) ?? PROJECTS[0];

  return (
    <div
      ref={rootRef}
      className="mk-projects-root"
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#08080a",
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px 24px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      <style>{`
        @keyframes titleSlam {
          0% { opacity: 0; transform: translateY(-20px) scale(1.1); filter: blur(10px); }
          60% { opacity: 1; transform: translateY(2px) scale(0.98); filter: blur(0px); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes rowSlotIn {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes wipeFlash {
          from { opacity: 1; background: #ffffff; }
          to { opacity: 0; background: rgba(232,40,60,0); }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); filter: blur(2px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes panelSlideRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes cartInsertSlide {
          0%   { transform: translateY(-260px) rotate(-2deg); opacity: 0; }
          15%  { opacity: 1; }
          65%  { transform: translateY(12px) rotate(0deg); }
          80%  { transform: translateY(-4px); }
          90%  { transform: translateY(2px); opacity: 1; }
          100% { transform: translateY(6px); opacity: 0; }
        }
        .mk-cart-insert-anim {
          animation: cartInsertSlide 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes blinkText {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }
        .mk-blink {
          animation: blinkText 0.9s infinite ease-in-out;
        }
        .mk-stat-fill {
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mk-stat-box {
          background: rgba(18, 19, 23, 0.85);
          border: 1px solid rgba(232,40,60,0.25);
          border-radius: 10px;
          padding: 18px 20px;
          transition: border-color 0.3s ease;
        }
        .mk-stat-box:hover {
          border-color: rgba(232,40,60,0.5);
        }
        .mk-cart {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease;
          cursor: pointer;
          outline: none;
        }
        .mk-cart:hover {
          filter: drop-shadow(0 12px 24px rgba(232,40,60,0.4)) brightness(1.15);
        }
        .mk-cart:focus-visible {
          filter: drop-shadow(0 0 16px #e8283c);
        }
        .mk-link {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mk-link:hover {
          background: #e8283c !important;
          color: #ffffff !important;
          box-shadow: 0 0 15px rgba(232,40,60,0.6);
          transform: translateY(-2px);
        }
        .mk-panel {
          scrollbar-width: thin;
          scrollbar-color: rgba(232,40,60,0.6) transparent;
        }
        .mk-panel::-webkit-scrollbar {
          width: 4px;
        }
        .mk-panel::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .mk-panel::-webkit-scrollbar-thumb {
          background: rgba(232,40,60,0.6);
          border-radius: 4px;
        }
        .mk-bg-grid {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
        }
        ${CARTRIDGE_CSS}
        .mk-shelf {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 26px;
          margin: 0 0 18px;
          padding: 0 0 18px;
          list-style: none;
          position: relative;
        }
        /* the shelf ledge the cartridges stand on */
        .mk-shelf::after {
          content: "";
          position: absolute;
          left: -24px;
          right: -24px;
          bottom: 0;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(180deg, #2a2b31, #16171b);
          box-shadow: 0 6px 14px rgba(0,0,0,0.55);
        }
        .mk-slot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
          color: inherit;
          font: inherit;
        }
        .mk-slot .mk-gbc {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease;
          filter: drop-shadow(0 10px 14px rgba(0,0,0,0.55));
        }
        .mk-slot:hover .mk-gbc, .mk-slot:focus-visible .mk-gbc {
          transform: translateY(-8px) rotate(-1.5deg);
          filter: drop-shadow(0 16px 18px rgba(0,0,0,0.6)) drop-shadow(0 0 14px rgba(232,40,60,0.35));
        }
        .mk-slot:focus-visible { outline: none; }
        .mk-slot:focus-visible .mk-slot-cap { color: #ff8a5b; }
        .mk-slot-cap { font-size: 11px; color: rgba(255,255,255,0.5); white-space: nowrap; }
        .mk-slot-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .mk-slot-ghost {
          width: 150px;
          aspect-ratio: 57 / 65;
          box-sizing: border-box;
          border: 2px dashed rgba(232,40,60,0.45);
          border-radius: 6px 6px 14px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 10px;
          font-size: 11px;
          line-height: 1.5;
          color: #ff6b7a;
          background: rgba(232,40,60,0.05);
        }
        .mk-console-links {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }
        .mk-console-link {
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          color: #f5f0e6;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          padding: 8px 14px;
        }
        .mk-console-link:hover, .mk-console-link:focus-visible { border-color: #ff8a5b; color: #ff8a5b; outline: none; }
        .mk-console-private { font-size: 12px; color: rgba(255,255,255,0.45); padding: 8px 0; }

        @media (min-width: 1101px) {
          .mk-arena-row { grid-template-columns: 370px 300px !important; gap: 56px !important; }
        }
        .mk-info-award {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px;
          margin-bottom: 18px;
          border-radius: 8px;
          background: rgba(201,162,39,0.1);
          border: 1px solid rgba(201,162,39,0.35);
          color: #e9c75a;
        }
        .mk-info-award small { display: block; font-size: 10px; color: rgba(233,199,90,0.75); margin-bottom: 2px; }
        .mk-info-award strong { font-size: 13px; color: #f5f0e6; }
        .mk-info-label { margin: 0 0 8px; font-size: 11px; color: rgba(255,255,255,0.5); }
        .mk-info-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
        .mk-info-chip { font-size: 11px; color: #f5f0e6; border: 1px solid rgba(255,255,255,0.14); border-radius: 4px; padding: 4px 8px; }
        .mk-info-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
        @media (max-width: 600px) {
          .mk-shelf { gap: 12px; padding-bottom: 14px; }
          .mk-shelf::after { left: -8px; right: -8px; }
          .mk-slot .mk-gbc { --w: 96px !important; }
          .mk-slot-ghost { width: 96px; font-size: 10px; padding: 6px; }
          .mk-slot-cap { font-size: 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-slot .mk-gbc, .mk-slot:hover .mk-gbc { transition: none; transform: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .mk-panel { animation: none !important; }
          .mk-wipe { display: none !important; }
          .mk-cart { transition: filter 0.15s ease; }
          .mk-fade { animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; box-shadow: none !important; }
          .mk-cart-insert-anim { animation: none !important; opacity: 0 !important; }
          .mk-blink { animation: none !important; }
        }

        @media (max-width: 1100px) {
          .mk-arena-row {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .mk-stats-sidebar {
            width: 100% !important;
            max-width: 420px !important;
            flex-direction: row !important;
            gap: 20px !important;
          }
          .mk-stat-box {
            flex: 1;
          }
        }
        @media (max-width: 600px) {
          .mk-stats-sidebar {
            flex-direction: column !important;
            max-width: 100% !important;
          }
          .mk-projects-root {
            padding: 32px 16px !important;
          }
          .mk-console-wrap {
            width: 100% !important;
            max-width: 340px !important;
          }
        }
      `}</style>

      <div className="mk-bg-grid" style={{ position: "absolute", inset: 0, zIndex: -2, pointerEvents: "none" }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background:
            "radial-gradient(ellipse 65% 45% at 50% 60%, rgba(232,40,60,0.09), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {[
        { top: 22, left: 22, borderWidth: "3px 0 0 3px" },
        { top: 22, right: 22, borderWidth: "3px 3px 0 0" },
        { bottom: 22, left: 22, borderWidth: "0 0 3px 3px" },
        { bottom: 22, right: 22, borderWidth: "0 3px 3px 0" },
      ].map((pos, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "26px",
            height: "26px",
            borderColor: "rgba(232,40,60,0.6)",
            borderStyle: "solid",
            pointerEvents: "none",
            ...pos,
          }}
        />
      ))}

      <div
        className="mk-fade"
        style={{
          textAlign: "center",
          marginBottom: "40px",
          opacity: sectionIn ? 1 : 0,
          animation: sectionIn ? "titleSlam 0.7s cubic-bezier(0.16, 1, 0.3, 1) both" : "none",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(232,40,60,0.1)",
            border: "1px solid rgba(232,40,60,0.3)",
            padding: "4px 12px",
            borderRadius: "20px",
            marginBottom: "12px",
          }}
        >
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#e8283c", boxShadow: "0 0 8px #e8283c" }} />
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              letterSpacing: "0.3em",
              color: "#ff6b7a",
              fontWeight: 700,
            }}
          >
            ROUND TWO
          </p>
        </div>
        <h1
          style={{
            margin: "0",
            fontFamily: "'Anton', sans-serif",
            fontSize: "clamp(32px, 4.5vw, 56px)",
            color: "#ffffff",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            lineHeight: 1,
            textShadow: "0 0 30px rgba(232,40,60,0.35)",
          }}
        >
          Select Your Project
        </h1>
      </div>

      <ul className="mk-shelf" aria-label="Project cartridges">
        {PROJECTS.map((project) => {
          const loaded = project.id === selectedId && (poweredOn || inserting);
          return (
            <li key={project.id}>
              {loaded ? (
                <div className="mk-slot-empty">
                  <div className="mk-slot-ghost">{project.name} is in the console</div>
                  <span className="mk-slot-cap">Now playing</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="mk-slot"
                  aria-label={`Load ${project.name}: ${project.tagline}`}
                  onClick={() => {
                    selectProject(project.id);
                    arenaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  <Cartridge
                    name={project.name}
                    tagline={project.tagline}
                    color={project.cartColor}
                    image={project.image}
                  />
                  <span className="mk-slot-cap">Load {project.name}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div
        ref={arenaRef}
        className="mk-arena-row"
        style={{
          display: "grid",
          gridTemplateColumns: "auto",
          justifyContent: "center",
          alignItems: "center",
          justifyItems: "center",
          width: "100%",
          maxWidth: "1280px",
          gap: "32px",
        }}
      >

        <div
          className="mk-console-wrap mk-fade"
          style={{
            position: "relative",
            width: "370px",
            flexShrink: 0,
            opacity: sectionIn ? 1 : 0,
            animation: sectionIn
              ? "rowSlotIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both"
              : "none",
          }}
        >
          <ConsoleShellSVG leftLink={selected.links[0]} rightLink={selected.links[1]} />

          {inserting && insertingProject && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "-110px",
                  transform: "translateX(-50%)",
                  width: "132px",
                  height: "120px",
                  overflow: "hidden",
                  zIndex: 15,
                  pointerEvents: "none",
                }}
              >
                <div className="mk-cart-insert-anim" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                  <Cartridge
                    name={insertingProject.name}
                    tagline={insertingProject.tagline}
                    color={insertingProject.cartColor}
                    image={insertingProject.image}
                    width={116}
                  />
                </div>
              </div>
            </>
          )}

          <div
            style={{
              position: "absolute",
              top: "8.79%",
              left: "10%",
              width: "80%",
              height: "40%",
              background: "#08090c",
              borderRadius: "4px",
              overflow: "hidden",
              padding: "16px 18px",
              boxSizing: "border-box",
              boxShadow: "inset 0 0 18px rgba(0,0,0,0.9)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >

            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%)",
                backgroundSize: "100% 4px",
                pointerEvents: "none",
                zIndex: 3,
                opacity: 0.6,
              }}
            />

            {flash && (
              <div
                className="mk-wipe"
                style={{
                  position: "absolute",
                  inset: 0,
                  animation: "wipeFlash 0.26s ease-out forwards",
                  pointerEvents: "none",
                  zIndex: 4,
                }}
              />
            )}

            {poweredOn ? (
              <div
                key={selected.id}
                className="mk-panel"
                style={{
                  position: "relative",
                  animation: "panelIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
                  height: "100%",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "10px",
                      letterSpacing: "0.22em",
                      color: "#e8283c",
                      fontWeight: 700,
                    }}
                  >
                    {selected.tagline.toUpperCase()}
                  </p>
                  <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
                    SYS.READY
                  </span>
                </div>

                <h2
                  style={{
                    margin: "2px 0 10px",
                    fontFamily: "'Anton', sans-serif",
                    fontSize: "24px",
                    color: "#ffffff",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    lineHeight: 1,
                    textShadow: "0 0 12px rgba(232,40,60,0.3)",
                  }}
                >
                  {selected.name}
                </h2>

                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: "11px",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  {selected.description}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    flexWrap: "wrap",
                    marginBottom: "12px",
                  }}
                >
                  {selected.stack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      style={{
                        fontSize: "9px",
                        padding: "3px 8px",
                        background: "rgba(232,40,60,0.12)",
                        border: "1px solid rgba(232,40,60,0.4)",
                        borderRadius: "3px",
                        color: "#ff8593",
                        letterSpacing: "0.05em",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <NoSignalPlaceholder />
            )}
          </div>
        </div>

        <div
          className="mk-stats-sidebar mk-fade"
          style={{
            width: "300px",
            justifySelf: "center",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            opacity: sectionIn ? 1 : 0,
            animation: sectionIn
              ? "panelSlideRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both"
              : "none",
          }}
        >
          <InfoPanel project={selected} stats={statsByProject[selectedId]} />
        </div>
      </div>
    </div>
  );
}

function NoSignalPlaceholder() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          border: "2px solid rgba(232,40,60,0.3)",
          borderTopColor: "#e8283c",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p
        style={{
          margin: 0,
          fontSize: "10px",
          letterSpacing: "0.25em",
          color: "rgba(255,255,255,0.4)",
          fontFamily: "'Space Mono', monospace",
        }}
      >
        NO CARTRIDGE DETECTED
      </p>
      <p className="mk-blink" style={{ margin: 0, fontSize: "10px", letterSpacing: "0.15em", color: "#e8283c", fontWeight: 700 }}>
        ▸ INSERT TO CONTINUE
      </p>
    </div>
  );
}

function PanelHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "9px",
        letterSpacing: "0.15em",
        color: "#e8283c",
        marginBottom: "16px",
        paddingBottom: "8px",
        borderBottom: "1px solid rgba(232,40,60,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span>{label}</span>
      <span style={{ width: "4px", height: "4px", background: "#e8283c", boxShadow: "0 0 6px #e8283c" }} />
    </div>
  );
}

function IntelRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span style={{ fontSize: "9px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)" }}>{label}</span>
      <span
        style={{
          fontSize: highlight ? "11px" : "10px",
          fontWeight: highlight ? 700 : 500,
          color: highlight ? "#ff4d61" : "#ffffff",
          letterSpacing: "0.05em",
          background: highlight ? "rgba(232,40,60,0.15)" : "transparent",
          padding: highlight ? "2px 6px" : "0",
          borderRadius: "3px",
          border: highlight ? "1px solid rgba(232,40,60,0.3)" : "none",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function InfoPanel({ project, stats }: { project: Project; stats?: StatsState }) {
  const status = stats?.status ?? "loading";
  const data = status === "ready" ? (stats as { status: "ready"; data: GithubStats }).data : null;
  return (
    <div className="mk-stat-box" aria-live="polite">
      <PanelHeader label="CARTRIDGE INFO" />
      {project.award && (
        <div className="mk-info-award">
          <Trophy size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <small>Award</small>
            <strong>{project.award}</strong>
          </div>
        </div>
      )}
      <p className="mk-info-label">Built with</p>
      <div className="mk-info-chips">
        {project.stack.map((tech) => (
          <span key={tech} className="mk-info-chip">{tech}</span>
        ))}
      </div>
      <p className="mk-info-label">Repository</p>
      {status === "private" && <IntelRow label="ACCESS" value="PRIVATE" />}
      {status === "loading" && <IntelRow label="STATUS" value="LOADING…" />}
      {status === "error" && <IntelRow label="STATUS" value="UNAVAILABLE" />}
      {data && (
        <>
          <IntelRow label="LANGUAGE" value={(data.language ?? "Mixed").toUpperCase()} />
          <IntelRow label="LAST COMMIT" value={timeAgo(data.pushedAt)} />
          <IntelRow label="STARTED" value={new Date(data.createdAt).getFullYear().toString()} />
          {data.contributors > 0 && <IntelRow label="CONTRIBUTORS" value={String(data.contributors)} />}
        </>
      )}
      <div className="mk-info-links">
        {project.links.map((link) => (
          <a key={link.url} className="mk-console-link" href={link.url} target="_blank" rel="noopener noreferrer">
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
