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
    cartColor: "#d95d00",
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

// ── GitHub stats ────────────────────────────────────────────────────
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

function tierFromStars(stars: number): string {
  if (stars >= 10) return "S-TIER";
  if (stars >= 5) return "A-TIER";
  if (stars >= 1) return "B-TIER";
  return "C-TIER";
}

function formatSize(kb: number | undefined): string {
  if (kb == null || Number.isNaN(kb)) return "UNKNOWN";
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
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

function fanTransform(offset: number, isSelected: boolean, hovered: boolean): string {
  if (isSelected && !hovered) {
    return "translate(0px, 0px) rotate(0deg) scale(1.08)";
  }
  const spread = hovered ? 42 : 32;
  const lift = hovered ? -8 : 0;
  const rotate = offset * (hovered ? 6 : 8);
  const translateX = offset * spread;
  const translateY = Math.abs(offset) * (hovered ? 4 : 8) + (isSelected ? lift : lift);
  const scale = isSelected ? (hovered ? 1.02 : 1.08) : hovered ? 0.94 : 0.85;
  return `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale})`;
}

// ── Main Component ───────────────────────────────────────────────────
export default function Projects() {
  const [selectedId, setSelectedId] = useState<string>(PROJECTS[0].id);
  const [flash, setFlash] = useState<boolean>(false);
  const [cartsHovered, setCartsHovered] = useState<boolean>(false);
  const [sectionIn, setSectionIn] = useState<boolean>(false);
  const [statsByProject, setStatsByProject] = useState<Record<string, StatsState>>({});
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Insertion & Screen Power State
  const [poweredOn, setPoweredOn] = useState<boolean>(false);
  const [inserting, setInserting] = useState<boolean>(false);
  const [insertingProject, setInsertingProject] = useState<Project | null>(null);
  const hasAutoInserted = useRef<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    setStatsByProject(
      Object.fromEntries(
        PROJECTS.map((p) => {
          const hasGithub = p.links.some((l) => l.label.toLowerCase() === "github");
          return [p.id, { status: hasGithub ? "loading" : "private" } as StatsState];
        })
      )
    );

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
              // fallback
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
  const selectedIndex = PROJECTS.findIndex((p) => p.id === selectedId);

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
        padding: "40px 24px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        @keyframes titleSlam {
          0% { opacity: 0; transform: scale(1.4); filter: blur(6px); }
          55% { opacity: 1; transform: scale(0.96); filter: blur(0px); }
          70% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
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
        @keyframes panelSlideRight {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes cartInsertSlide {
          0%   { transform: translateY(-240px) rotate(-1.5deg); opacity: 0; }
          10%  { opacity: 1; }
          62%  { transform: translateY(8px) rotate(0deg); }
          74%  { transform: translateY(-3px); }
          86%  { transform: translateY(4px); opacity: 1; }
          100% { transform: translateY(4px); opacity: 0; }
        }
        .mk-cart-insert-anim {
          animation: cartInsertSlide 0.9s cubic-bezier(0.32, 0.72, 0.23, 1) forwards;
        }
        @keyframes slotFlash {
          0%, 70% { opacity: 0; }
          78% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes blinkText {
          50% { opacity: 0; }
        }
        .mk-blink {
          animation: blinkText 1.1s steps(1) infinite;
        }
        .mk-stat-fill {
          transition: width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .mk-stat-box {
          background: linear-gradient(160deg, #1c1d21 0%, #131316 100%);
          border: 1px solid rgba(232,40,60,0.28);
          border-radius: 8px;
          padding: 16px 18px 18px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 20px rgba(0,0,0,0.35);
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
          .mk-cart-insert-anim { animation: none !important; opacity: 0 !important; }
          .mk-blink { animation: none !important; }
        }

        @media (max-width: 1100px) {
          .mk-arena-row {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .mk-stats-sidebar {
            width: 100% !important;
            max-width: 360px !important;
            flex-direction: row !important;
            gap: 16px !important;
          }
          .mk-stat-box {
            flex: 1;
          }
        }
        @media (max-width: 600px) {
          .mk-stats-sidebar {
            flex-direction: column !important;
          }
          .mk-projects-root {
            padding: 40px 16px !important;
          }
        }
      `}</style>

      {/* Red ambient background glow */}
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

      {/* Section Header */}
      <div
        className="mk-fade"
        style={{
          textAlign: "center",
          marginBottom: "32px",
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

      {/* 3-Column Arena Layout */}
      <div
        className="mk-arena-row"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          justifyItems: "center",
          width: "100%",
          maxWidth: "1280px",
          gap: "24px",
        }}
      >
        {/* LEFT COLUMN: Cartridge Fan / Stack */}
        <div
          className="mk-cart-cluster mk-fade"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifySelf: "center",
            gap: "20px",
            zIndex: 6,
            opacity: sectionIn ? 1 : 0,
            animation: sectionIn
              ? "rowSlotIn 0.6s cubic-bezier(0.2, 0.85, 0.25, 1) 0.22s both"
              : "none",
          }}
        >
          <div
            onMouseEnter={() => setCartsHovered(true)}
            onMouseLeave={() => setCartsHovered(false)}
            style={{
              position: "relative",
              width: "280px",
              height: "160px",
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
                  "radial-gradient(circle at 50% 50%, rgba(232,40,60,0.25), transparent 70%)",
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
                    id={project.id}
                    name={project.name}
                    tagline={project.tagline}
                  />
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

        {/* CENTER COLUMN: Console Shell */}
        <div
          className="mk-console-wrap mk-fade"
          style={{
            position: "relative",
            width: "360px",
            flexShrink: 0,
            opacity: sectionIn ? 1 : 0,
            animation: sectionIn
              ? "rowSlotIn 0.6s cubic-bezier(0.2, 0.85, 0.25, 1) 0.22s both, rowFlash 0.6s ease-out 0.22s both"
              : "none",
          }}
        >
          <ConsoleShellSVG leftLink={selected.links[0]} rightLink={selected.links[1]} />

          {/* Top-down Insertion Overlay & Slot Flash Glow */}
          {inserting && insertingProject && (
            <>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "-4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "100px",
                  height: "24px",
                  background: "radial-gradient(ellipse, rgba(232,40,60,0.9), transparent 70%)",
                  animation: "slotFlash 0.9s ease-out forwards",
                  pointerEvents: "none",
                  zIndex: 14,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "-100px",
                  transform: "translateX(-50%)",
                  width: "132px",
                  height: "110px",
                  overflow: "hidden",
                  zIndex: 15,
                  pointerEvents: "none",
                }}
              >
                <div className="mk-cart-insert-anim" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                  <CartridgeSVG
                    color={insertingProject.cartColor}
                    highlighted
                    id={insertingProject.id}
                    name={insertingProject.name}
                    tagline={insertingProject.tagline}
                  />
                </div>
              </div>
            </>
          )}

          {/* Screen Content Overlay */}
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

            {poweredOn ? (
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
            ) : (
              <NoSignalPlaceholder />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Stats Sidebar */}
        <div
          className="mk-stats-sidebar mk-fade"
          style={{
            width: "220px",
            justifySelf: "center",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            opacity: sectionIn ? 1 : 0,
            animation: sectionIn
              ? "panelSlideRight 0.6s cubic-bezier(0.2, 0.85, 0.25, 1) 0.32s both"
              : "none",
          }}
        >
          <div className="mk-stat-box">
            <PanelHeader label="P1 VITALS" />
            <VitalsPanel stats={statsByProject[selectedId]} />
          </div>
          <div className="mk-stat-box">
            <PanelHeader label="COMBAT LOG" />
            <IntelPanel stats={statsByProject[selectedId]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components & Helpers ─────────────────────────────────────────
function NoSignalPlaceholder() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "11px",
          letterSpacing: "0.25em",
          color: "rgba(255,255,255,0.3)",
          fontFamily: "'Space Mono', monospace",
        }}
      >
        NO CARTRIDGE DETECTED
      </p>
      <p className="mk-blink" style={{ margin: 0, fontSize: "10px", letterSpacing: "0.15em", color: "#e8283c" }}>
        ▸ INSERT TO CONTINUE
      </p>
    </div>
  );
}

interface CartridgeSVGProps {
  color: string;
  highlighted: boolean;
  id: string;
  name: string;
  tagline: string;
}

function CartridgeSVG({ color, highlighted, id, name, tagline }: CartridgeSVGProps) {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <svg
      width="200"
      height="130"
      viewBox="0 0 200 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: highlighted
          ? "drop-shadow(0 12px 20px rgba(0,0,0,0.6)) drop-shadow(0 0 12px rgba(232,40,60,0.4))"
          : "drop-shadow(0 6px 10px rgba(0,0,0,0.5))",
        transition: "filter 0.2s ease",
      }}
    >
      <defs>
        <linearGradient id={`cartGrad-${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#101114" />
        </linearGradient>
      </defs>

      <path
        d="M 10 0 L 190 0 C 195 0 200 5 200 10 L 200 115 C 200 122 195 128 188 128 L 12 128 C 5 128 0 122 0 115 L 0 10 C 0 5 5 0 10 0 Z"
        fill={`url(#cartGrad-${safeId})`}
        stroke={highlighted ? "#e8283c" : "#3a3b3f"}
        strokeWidth={highlighted ? "2" : "1"}
      />

      <rect x="20" y="8" width="160" height="3" rx="1.5" fill="rgba(255,255,255,0.15)" />
      <rect x="20" y="15" width="160" height="3" rx="1.5" fill="rgba(0,0,0,0.3)" />

      <rect x="16" y="28" width="168" height="84" rx="4" fill="#0d0e10" stroke="#25262a" strokeWidth="1" />

      <rect x="22" y="34" width="156" height="72" rx="2" fill="#17181c" />
      <rect x="22" y="34" width="156" height="18" fill="#e8283c" />

      <text x="30" y="46" fontSize="8" fill="#ffffff" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">
        {tagline.toUpperCase().slice(0, 22)}
      </text>

      <text x="30" y="72" fontSize="15" fill="#f2f2f2" fontWeight="bold" fontFamily="'Anton', sans-serif" letterSpacing="0.02em">
        {name.toUpperCase()}
      </text>

      <text x="30" y="94" fontSize="7" fill="#8a8c92" fontFamily="monospace">
        GAME CARTRIDGE
      </text>

      <path d="M 160 85 L 168 90 L 160 95 Z" fill="#e8283c" opacity="0.8" />
    </svg>
  );
}

function PanelHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "9px",
        letterSpacing: "0.12em",
        color: "#e8283c",
        marginBottom: "16px",
        paddingBottom: "8px",
        borderBottom: "2px solid rgba(232,40,60,0.4)",
      }}
    >
      {label}
    </div>
  );
}

function RedactedNotice({ text, dim }: { text: string; dim?: boolean }) {
  return (
    <div
      style={{
        fontSize: "9px",
        letterSpacing: "0.06em",
        color: dim ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.35)",
        fontFamily: "'Space Mono', monospace",
        padding: "20px 12px",
        textAlign: "center",
        lineHeight: 1.6,
        border: dim ? "none" : "1px dashed rgba(255,255,255,0.15)",
      }}
    >
      {text}
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(value > 0 ? 6 : 0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "9px",
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "5px",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#f2f2f2" }}>{value}</span>
      </div>
      <div style={{ height: "8px", background: "rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
        <div
          className="mk-stat-fill"
          style={{
            position: "absolute",
            inset: 0,
            width: `${pct}%`,
            background: color,
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 7px)",
          }}
        />
      </div>
    </div>
  );
}

function VitalsPanel({ stats }: { stats?: StatsState }) {
  const status = stats?.status ?? "loading";
  if (status === "private") return <RedactedNotice text="CLASSIFIED BUILD — VITALS SEALED" />;
  if (status === "loading") return <RedactedNotice text="SCANNING..." dim />;
  if (status === "error") return <RedactedNotice text="SIGNAL LOST" dim />;
  const data = (stats as { status: "ready"; data: GithubStats }).data;
  return (
    <div key={JSON.stringify(data)}>
      <StatBar label="STARS" value={data.stars} max={20} color="#e8283c" />
      <StatBar label="FORKS" value={data.forks} max={20} color="#c41e30" />
      <StatBar label="OPEN ISSUES" value={data.openIssues} max={20} color="#8a6d1f" />
    </div>
  );
}

function IntelRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "9px 0",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span style={{ fontSize: "9px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span
        style={{
          fontSize: highlight ? "11px" : "10px",
          fontWeight: highlight ? 700 : 400,
          color: highlight ? "#e8283c" : "#f2f2f2",
          letterSpacing: "0.04em",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function IntelPanel({ stats }: { stats?: StatsState }) {
  const status = stats?.status ?? "loading";
  if (status === "private") return <RedactedNotice text="INTEL REDACTED" />;
  if (status === "loading") return <RedactedNotice text="DECRYPTING..." dim />;
  if (status === "error") return <RedactedNotice text="SIGNAL LOST" dim />;
  const data = (stats as { status: "ready"; data: GithubStats }).data;
  return (
    <div key={JSON.stringify(data)}>
      <IntelRow label="TIER" value={tierFromStars(data.stars)} highlight />
      <IntelRow label="LANGUAGE" value={(data.language ?? "MIXED").toUpperCase()} />
      <IntelRow label="LAST COMMIT" value={timeAgo(data.pushedAt)} />
      <IntelRow label="REPO SIZE" value={formatSize(data.sizeKb)} />
      <IntelRow label="LICENSE" value={data.license ?? "NONE"} />
      <IntelRow label="CONTRIBUTORS" value={data.contributors != null ? String(data.contributors) : "UNKNOWN"} />
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
    </svg>
  );
}