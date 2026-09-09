import { useEffect, useRef, useState } from "react";
import { CartridgeSVG } from "./Cartridge";
import { ConsoleShellSVG } from "./Gameboy";

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
  const spread = hovered ? 46 : 34;
  const lift = hovered ? -12 : 0;
  const rotate = offset * (hovered ? 7 : 9);
  const translateX = offset * spread;
  const translateY = Math.abs(offset) * (hovered ? 6 : 10) + (isSelected ? lift : lift);
  const scale = isSelected ? (hovered ? 1.04 : 1.08) : hovered ? 0.96 : 0.85;
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
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Press+Start+2P&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

        @keyframes titleSlam {
          0% { opacity: 0; transform: translateY(-20px) scale(1.1); filter: blur(10px); }
          60% { opacity: 1; transform: translateY(2px) scale(0.98); filter: blur(0px); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes rowSlotIn {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes rowFlash {
          0%, 60% { box-shadow: 0 0 0 rgba(232,40,60,0); }
          68% { box-shadow: 0 0 100px rgba(232,40,60,0.4); }
          100% { box-shadow: 0 0 0 rgba(232,40,60,0); }
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
        @keyframes slotFlash {
          0%, 65% { opacity: 0; transform: translateX(-50%) scaleX(0.5); }
          75% { opacity: 1; transform: translateX(-50%) scaleX(1.3); }
          100% { opacity: 0; transform: translateX(-50%) scaleX(1); }
        }
        @keyframes blinkText {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        .mk-blink {
          animation: blinkText 0.9s infinite ease-in-out;
        }
        .mk-stat-fill {
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mk-stat-box {
          background: rgba(18, 19, 23, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(232,40,60,0.3);
          border-radius: 10px;
          padding: 18px 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .mk-stat-box:hover {
          border-color: rgba(232,40,60,0.6);
          box-shadow: 0 12px 35px rgba(232,40,60,0.15), inset 0 1px 0 rgba(255,255,255,0.1);
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
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          animation: gridPulse 4s ease-in-out infinite;
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

      {/* Cyber Grid Background */}
      <div className="mk-bg-grid" style={{ position: "absolute", inset: 0, zIndex: -2, pointerEvents: "none" }} />

      {/* Ambient Radial Glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background:
            "radial-gradient(ellipse 65% 45% at 50% 60%, rgba(232,40,60,0.18), transparent 70%), radial-gradient(ellipse 40% 30% at 50% 20%, rgba(232,40,60,0.08), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Section Header */}
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
          gap: "32px",
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
            gap: "24px",
            zIndex: 6,
            opacity: sectionIn ? 1 : 0,
            animation: sectionIn
              ? "rowSlotIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both"
              : "none",
          }}
        >
          <div
            onMouseEnter={() => setCartsHovered(true)}
            onMouseLeave={() => setCartsHovered(false)}
            style={{
              position: "relative",
              width: "290px",
              height: "170px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "-20px",
                background:
                  "radial-gradient(circle at 50% 50%, rgba(232,40,60,0.22), transparent 70%)",
                opacity: cartsHovered ? 1 : 0,
                transition: "opacity 0.4s ease",
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(18, 19, 23, 0.8)",
              padding: "6px 16px",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: "#e8283c",
                fontWeight: 700,
                letterSpacing: "0.15em",
              }}
            >
              {String(selectedIndex + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.15em",
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
            width: "370px",
            flexShrink: 0,
            opacity: sectionIn ? 1 : 0,
            animation: sectionIn
              ? "rowSlotIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both, rowFlash 0.6s ease-out 0.22s both"
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
                  top: "-6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "120px",
                  height: "30px",
                  background: "radial-gradient(ellipse, rgba(232,40,60,1), transparent 70%)",
                  animation: "slotFlash 0.9s ease-out forwards",
                  pointerEvents: "none",
                  zIndex: 14,
                  filter: "blur(2px)",
                }}
              />
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
              background: "#08090c",
              borderRadius: "4px",
              overflow: "hidden",
              padding: "16px 18px",
              boxSizing: "border-box",
              boxShadow: "inset 0 0 18px rgba(0,0,0,0.9)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {/* Scanlines Effect */}
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
                  {selected.stack.map((tech) => (
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

        {/* RIGHT COLUMN: Stats Sidebar */}
        <div
          className="mk-stats-sidebar mk-fade"
          style={{
            width: "240px",
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

function RedactedNotice({ text, dim }: { text: string; dim?: boolean }) {
  return (
    <div
      style={{
        fontSize: "9px",
        letterSpacing: "0.08em",
        color: dim ? "rgba(255,255,255,0.3)" : "#ff6b7a",
        fontFamily: "'Space Mono', monospace",
        padding: "22px 12px",
        textAlign: "center",
        lineHeight: 1.6,
        background: dim ? "transparent" : "rgba(232,40,60,0.05)",
        borderRadius: "6px",
        border: dim ? "1px dashed rgba(255,255,255,0.12)" : "1px dashed rgba(232,40,60,0.3)",
      }}
    >
      {text}
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(value > 0 ? 8 : 0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "9px",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.6)",
          marginBottom: "6px",
          fontWeight: 700,
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#ffffff" }}>{value}</span>
      </div>
      <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", position: "relative", overflow: "hidden" }}>
        <div
          className="mk-stat-fill"
          style={{
            position: "absolute",
            inset: 0,
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 10px ${color}`,
            borderRadius: "3px",
          }}
        />
      </div>
    </div>
  );
}

function VitalsPanel({ stats }: { stats?: StatsState }) {
  const status = stats?.status ?? "loading";
  if (status === "private") return <RedactedNotice text="CLASSIFIED BUILD — VITALS SEALED" />;
  if (status === "loading") return <RedactedNotice text="SCANNING METRICS..." dim />;
  if (status === "error") return <RedactedNotice text="SIGNAL LOST" dim />;
  const data = (stats as { status: "ready"; data: GithubStats }).data;
  return (
    <div key={JSON.stringify(data)}>
      <StatBar label="STARS" value={data.stars} max={20} color="#e8283c" />
      <StatBar label="FORKS" value={data.forks} max={20} color="#ff4d61" />
      <StatBar label="OPEN ISSUES" value={data.openIssues} max={20} color="#e5a93c" />
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