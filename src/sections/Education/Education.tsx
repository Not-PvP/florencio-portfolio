import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Lock, CircleDashed, Send, ChevronLeft, ChevronRight, GraduationCap, Trophy, Users } from "lucide-react";
import RoundTag from "../shared/RoundTag";
import { ARCS, ORIGIN, type Arc, type Highlight, type HighlightKind, type QuestStatus, type Stage } from "../../data/education";

const STATUS_COPY: Record<QuestStatus, string> = {
  cleared: "Cleared",
  "in-progress": "In progress",
  submitted: "Submitted",
};

interface FlatStage {
  stage: Stage;
  arc: Arc;
  index: number;
}

const FLAT: FlatStage[] = ARCS.flatMap((arc) => arc.stages.map((stage) => ({ stage, arc }))).map((s, index) => ({
  ...s,
  index,
}));

const GROUPS: { kind: HighlightKind; label: string; Icon: typeof Trophy }[] = [
  { kind: "academic", label: "Academic", Icon: GraduationCap },
  { kind: "competition", label: "Awards and contests", Icon: Trophy },
  { kind: "leadership", label: "Leadership", Icon: Users },
];

function kindOf(h: Highlight): HighlightKind {
  if (h.kind) return h.kind;
  if (/president|auditor|delegate|officer|leader|captain|secretary|treasurer/i.test(h.title)) return "leadership";
  if (/honors|dean|scholar|qualified/i.test(h.title)) return "academic";
  return "competition";
}

const hasLog = (s: Stage) => Boolean(s.tracks?.length || s.highlights?.length);

function StatusMark({ status }: { status: QuestStatus }) {
  const Icon = status === "cleared" ? Check : status === "submitted" ? Send : CircleDashed;
  return (
    <span className={`mk-ed-mark mk-ed-mark-${status}`}>
      <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
    </span>
  );
}

export default function Education() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [sectionIn, setSectionIn] = useState(false);
  const currentIndex = Math.max(0, FLAT.findIndex((f) => f.stage.status === "current"));
  const defaultIndex = (() => {
    for (let i = currentIndex; i >= 0; i--) if (hasLog(FLAT[i].stage)) return i;
    return currentIndex;
  })();
  const [selectedId, setSelectedId] = useState<string>(FLAT[defaultIndex]?.stage.id ?? "");
  const selected = useMemo(() => FLAT.find((f) => f.stage.id === selectedId) ?? FLAT[defaultIndex], [selectedId, defaultIndex]);
  const total = FLAT.length;
  const navigable = FLAT.filter((f) => f.stage.status !== "locked" && hasLog(f.stage));
  const navIndex = navigable.findIndex((f) => f.stage.id === selected?.stage.id);
  const prevStage = navIndex > 0 ? navigable[navIndex - 1] : undefined;
  const nextStage = navIndex >= 0 && navIndex < navigable.length - 1 ? navigable[navIndex + 1] : undefined;

  useEffect(() => {
    const box = scrollRef.current;
    if (!box || box.scrollWidth <= box.clientWidth) return;
    const step = box.scrollWidth / total;
    box.scrollLeft = Math.max(0, step * (currentIndex + 0.5) - box.clientWidth / 2);
  }, [currentIndex, total]);

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
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`mk-ed-root${sectionIn ? " in" : ""}`}>
      <style>{`
        .mk-ed-root {
          width: 100%;
          font-family: 'Space Mono', 'JetBrains Mono', monospace;
          padding: 96px 24px;
          box-sizing: border-box;
          display: flex;
          justify-content: center;
        }
        .mk-ed-inner { width: 100%; max-width: 1100px; }
        .mk-ed-title {
          margin: 0 0 10px;
          font-family: 'Anton', sans-serif;
          font-size: clamp(40px, 5.4vw, 72px);
          line-height: 1;
          color: #f5f0e6;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .mk-ed-lede { margin: 0 0 10px; font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.78); max-width: 62ch; }
        .mk-ed-hint { margin: 0 0 56px; font-size: 12px; color: rgba(255,255,255,0.45); }

        /* map */
        .mk-ed-mapscroll { overflow-x: auto; margin: 0 -8px 40px; padding: 0 8px 8px; }
        .mk-ed-map { min-width: calc(var(--n) * 100px); }
        .mk-ed-arcs { display: flex; margin-bottom: 28px; }
        .mk-ed-arc {
          flex: var(--count) 1 0;
          padding: 0 14px 0 12px;
          border-left: 2px solid rgba(255,138,91,0.5);
          box-sizing: border-box;
        }
        .mk-ed-arc + .mk-ed-arc { margin-left: 0; }
        .mk-ed-arc-label { margin: 0 0 4px; font-size: 12px; color: #ff8a5b; }
        .mk-ed-arc-school { margin: 0; font-size: 14px; font-weight: 700; line-height: 1.4; color: #f5f0e6; }
        .mk-ed-arc-meta { margin: 2px 0 0; font-size: 12px; color: rgba(255,255,255,0.5); }

        .mk-ed-rail {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(var(--n), minmax(0, 1fr));
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .mk-ed-railbox { position: relative; }
        .mk-ed-railbox::before, .mk-ed-fill {
          content: "";
          position: absolute;
          top: 28px;
          left: calc(100% / var(--n) / 2);
        }
        .mk-ed-railbox::before {
          width: calc(100% - 100% / var(--n));
          border-top: 2px dashed rgba(255,255,255,0.14);
        }
        .mk-ed-fill {
          top: 27px;
          height: 4px;
          width: 0;
          background: linear-gradient(90deg, #ff8a5b, #e8283c);
          box-shadow: 0 0 12px rgba(232,40,60,0.6);
          transition: width 1.2s cubic-bezier(0.2, 0.85, 0.25, 1) 0.2s;
        }
        .mk-ed-root.in .mk-ed-fill { width: calc(100% / var(--n) * var(--cur)); }
        .mk-ed-stage { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .mk-ed-node {
          position: relative;
          z-index: 1;
          width: 44px;
          height: 44px;
          margin: 6px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border-radius: 8px;
          transform: rotate(45deg);
          background: #121317;
          border: 2px solid rgba(255,255,255,0.14);
          box-sizing: border-box;
          font: inherit;
          color: inherit;
        }
        button.mk-ed-node { cursor: pointer; transition: box-shadow 0.15s ease; }
        button.mk-ed-node:hover { box-shadow: 0 0 0 4px rgba(255,138,91,0.18); }
        button.mk-ed-node:focus-visible { outline: 2px solid #f5f0e6; outline-offset: 4px; }
        .mk-ed-node > * { transform: rotate(-45deg); }
        .mk-ed-stage-cleared .mk-ed-node { border-color: #ff8a5b; background: #1c1210; color: #ff8a5b; }
        .mk-ed-stage-current .mk-ed-node {
          border-color: #e8283c;
          background: #e8283c;
          color: #0a0a0a;
          box-shadow: 0 0 0 6px rgba(232,40,60,0.18), 0 0 28px rgba(232,40,60,0.55);
        }
        .mk-ed-stage[data-selected="true"] .mk-ed-node { outline: 2px solid #f5f0e6; outline-offset: 5px; }
        .mk-ed-p1 {
          position: absolute;
          top: -26px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Press Start 2P', monospace;
          font-size: 8px;
          padding: 4px 5px;
          background: #f5f0e6;
          color: #0a0a0a;
          border-radius: 2px;
        }
        .mk-ed-stage-label { margin-top: 16px; font-size: 14px; font-weight: 700; color: #f5f0e6; }
        .mk-ed-stage-state { margin-top: 2px; font-size: 11px; color: rgba(255,255,255,0.42); }
        .mk-ed-stage-cleared .mk-ed-stage-state { color: #ff8a5b; }
        .mk-ed-stage-current .mk-ed-stage-state { color: #ff6b7a; }
        .mk-ed-stage-locked .mk-ed-stage-label { color: rgba(255,255,255,0.4); }

        .mk-ed-arcstart::before {
          content: "";
          position: absolute;
          left: 0;
          top: -6px;
          height: 72px;
          border-left: 1px dashed rgba(255,138,91,0.35);
        }

        /* log */
        .mk-ed-log {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 40px;
        }
        .mk-ed-loghead {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px 32px;
          margin-bottom: 32px;
        }
        .mk-ed-loghead-main { min-width: 0; }
        .mk-ed-loghead-title { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin-bottom: 8px; }
        .mk-ed-log .mk-ed-log-title { font-size: 44px; margin: 0; }
        .mk-ed-badge {
          padding: 5px 9px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
          color: #0a0a0a;
          background: #ff8a5b;
        }
        .mk-ed-logmeta { margin: 0; font-size: 13px; color: rgba(255,255,255,0.55); }
        .mk-ed-stepper { display: flex; gap: 8px; }
        .mk-ed-step {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          color: #f5f0e6;
          background: #121317;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
        }
        .mk-ed-step:hover:not(:disabled), .mk-ed-step:focus-visible { border-color: #ff8a5b; color: #ff8a5b; outline: none; }
        .mk-ed-step:disabled { opacity: 0.35; cursor: default; }
        .mk-ed-groups {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          align-items: stretch;
        }
        .mk-ed-highlights li.mk-ed-ranked { padding-left: 46px; min-height: 36px; justify-content: center; }
        .mk-ed-highlights li.mk-ed-ranked::before { display: none; }
        .mk-ed-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        .mk-ed-medal {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Anton', sans-serif;
          font-size: 13px;
          letter-spacing: 0.02em;
          color: #1a1208;
          box-shadow: inset 0 -2px 0 rgba(0,0,0,0.22);
        }
        .mk-ed-medal-gold { background: radial-gradient(circle at 35% 30%, #fff1b8, #e3b53c 72%); }
        .mk-ed-medal-silver { background: radial-gradient(circle at 35% 30%, #ffffff, #b6bcc6 72%); }
        .mk-ed-medal-bronze { background: radial-gradient(circle at 35% 30%, #ffdcc2, #c47a45 72%); }
        .mk-ed-medal-plain { background: rgba(255,138,91,0.16); color: #ff8a5b; box-shadow: inset 0 0 0 1px rgba(255,138,91,0.45); }
        .mk-ed-group {
          padding: 18px 20px 6px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: #111114;
        }
        .mk-ed-group-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 4px;
          font-size: 12px;
          font-weight: 700;
          color: #ff8a5b;
        }
        .mk-ed-card-body { min-width: 0; }

        /* mobile stage picker */
        .mk-ed-picker { display: none; }
        .mk-ed-pick-arc + .mk-ed-pick-arc { margin-top: 20px; }
        .mk-ed-pick-school { margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #f5f0e6; }
        .mk-ed-pick-row { display: grid; grid-template-columns: repeat(var(--count), minmax(0, 1fr)); gap: 8px; }
        .mk-ed-pick {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: flex-start;
          padding: 10px 8px;
          min-width: 0;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.12);
          background: #121317;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }
        .mk-ed-pick-label { font-size: 13px; font-weight: 700; color: #f5f0e6; white-space: nowrap; }
        .mk-ed-pick-state { font-size: 10px; color: #ff8a5b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .mk-ed-pick-current { border-color: rgba(232,40,60,0.6); }
        .mk-ed-pick-current .mk-ed-pick-state { color: #ff6b7a; }
        .mk-ed-pick:disabled { cursor: default; opacity: 0.55; }
        .mk-ed-pick-locked .mk-ed-pick-state { color: rgba(255,255,255,0.4); }
        .mk-ed-pick[aria-pressed="true"] { border-color: #ff8a5b; background: rgba(255,138,91,0.14); box-shadow: 0 0 0 1px #ff8a5b; }
        .mk-ed-pick:focus-visible { outline: 2px solid #f5f0e6; outline-offset: 2px; }
        .mk-ed-log-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 16px; margin: 0 0 28px; }
        .mk-ed-log-title {
          margin: 0;
          font-family: 'Anton', sans-serif;
          font-size: 30px;
          line-height: 1;
          color: #f5f0e6;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .mk-ed-log-sub { font-size: 13px; color: rgba(255,255,255,0.5); }
        .mk-ed-tracks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 56px; row-gap: 40px; }
        .mk-ed-track-label { margin: 0 0 6px; padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #ff8a5b; border-bottom: 1px solid rgba(255,138,91,0.3); }
        .mk-ed-quests, .mk-ed-highlights { margin: 0; padding: 0; list-style: none; }
        .mk-ed-quest { display: grid; grid-template-columns: 28px minmax(0, 1fr); column-gap: 12px; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .mk-ed-quest:last-child { border-bottom: none; }
        .mk-ed-mark { width: 24px; height: 24px; margin-top: 1px; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
        .mk-ed-mark-cleared { background: rgba(255,138,91,0.15); color: #ff8a5b; }
        .mk-ed-mark-in-progress { background: rgba(232,40,60,0.15); color: #ff6b7a; }
        .mk-ed-mark-submitted { background: rgba(245,240,230,0.1); color: #f5f0e6; }
        .mk-ed-qhead { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
        .mk-ed-qname { margin: 0; font-size: 16px; color: #f5f0e6; font-weight: 700; }
        .mk-ed-qstatus { font-size: 11px; color: rgba(255,255,255,0.42); }
        .mk-ed-qsum { margin: 6px 0 10px; font-size: 13px; line-height: 1.65; color: rgba(255,255,255,0.68); max-width: 60ch; }
        .mk-ed-qfoot { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .mk-ed-chip { font-size: 11px; color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.12); border-radius: 3px; padding: 3px 7px; }
        .mk-ed-link { margin-left: auto; font-size: 12px; color: #ff8a5b; text-decoration: none; border-bottom: 1px solid rgba(255,138,91,0.4); }
        .mk-ed-link:hover, .mk-ed-link:focus-visible { color: #fff; border-bottom-color: #fff; outline: none; }
        .mk-ed-highlights { display: grid; grid-template-columns: 1fr; }
        .mk-ed-highlights li {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 14px 0 14px 26px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .mk-ed-highlights li:last-child { border-bottom: none; }
        .mk-ed-hl-title { font-size: 14px; font-weight: 700; line-height: 1.45; color: #f5f0e6; }
        .mk-ed-hl-detail { font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.55); }
        .mk-ed-highlights li::before {
          content: "";
          position: absolute;
          left: 4px;
          top: 20px;
          width: 8px;
          height: 8px;
          background: #ff8a5b;
          transform: rotate(45deg);
        }

        @media (max-width: 820px) {
          .mk-ed-root { padding: 72px 18px; }
          .mk-ed-tracks { grid-template-columns: 1fr; row-gap: 32px; }
          .mk-ed-mapscroll { display: none; }
          .mk-ed-picker { display: block; margin-bottom: 36px; }
          .mk-ed-log { padding-top: 28px; }
          .mk-ed-log .mk-ed-log-title { font-size: 34px; }
          .mk-ed-stepper { width: 100%; justify-content: space-between; }
          .mk-ed-highlights { row-gap: 0; }
          .mk-ed-arc-school { font-size: 13px; }
          .mk-ed-map { min-width: calc(var(--n) * 112px); }
          .mk-ed-stage-label { font-size: 12px; }
          .mk-ed-mapscroll {
            -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 16px, #000 calc(100% - 24px), transparent 100%);
            mask-image: linear-gradient(90deg, transparent 0, #000 16px, #000 calc(100% - 24px), transparent 100%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-ed-fill { transition: none; }
        }
      `}</style>

      <div className="mk-ed-inner">
        <RoundTag label="Round four" />
        <h2 className="mk-ed-title">Training grounds</h2>
        <p className="mk-ed-lede">{ORIGIN}</p>
        <p className="mk-ed-hint">From Riyadh to Roxas to Iloilo. Pick a stage to see what I achieved there.</p>

        <div className="mk-ed-mapscroll" ref={scrollRef}>
          <div
            className="mk-ed-map"
            style={{ "--n": total, "--cur": currentIndex } as React.CSSProperties}
          >
            <div className="mk-ed-arcs">
              {ARCS.map((arc) => (
                <div key={arc.id} className="mk-ed-arc" style={{ "--count": arc.stages.length } as React.CSSProperties}>
                  <p className="mk-ed-arc-label">{arc.label}</p>
                  <p className="mk-ed-arc-school">{arc.school}</p>
                  <p className="mk-ed-arc-meta">{arc.years}</p>
                </div>
              ))}
            </div>

            <div className="mk-ed-railbox">
            <span className="mk-ed-fill" aria-hidden="true" />
            <ol className="mk-ed-rail" aria-label="School progress">
              {FLAT.map(({ stage, arc }, i) => {
                const arcStart = i > 0 && FLAT[i - 1].arc.id !== arc.id;
                const clickable = stage.status !== "locked" && hasLog(stage);
                const isSelected = stage.id === selected?.stage.id;
                const inner =
                  stage.status === "locked" ? (
                    <Lock size={16} color="rgba(255,255,255,0.35)" aria-hidden="true" />
                  ) : stage.status === "cleared" ? (
                    <Check size={18} strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <span style={{ fontFamily: "'Anton', sans-serif", fontSize: "18px" }} aria-hidden="true">
                      {stage.label.replace(/\D+/g, "").slice(0, 2) || "•"}
                    </span>
                  );
                return (
                  <li
                    key={stage.id}
                    className={`mk-ed-stage mk-ed-stage-${stage.status}${arcStart ? " mk-ed-arcstart" : ""}`}
                    data-selected={clickable && isSelected}
                    aria-current={stage.status === "current" ? "step" : undefined}
                  >
                    {stage.status === "current" && <span className="mk-ed-p1" aria-hidden="true">P1</span>}
                    {clickable ? (
                      <button
                        type="button"
                        className="mk-ed-node"
                        aria-pressed={isSelected}
                        aria-label={`Open ${arc.label} ${stage.label} log`}
                        onClick={() => setSelectedId(stage.id)}
                      >
                        {inner}
                      </button>
                    ) : (
                      <div className="mk-ed-node">{inner}</div>
                    )}
                    <span className="mk-ed-stage-label">{stage.label}</span>
                    <span className="mk-ed-stage-state">
                      {stage.status === "cleared" ? stage.honor ?? "Cleared" : stage.status === "current" ? "Now playing" : "Locked"}
                    </span>
                  </li>
                );
              })}
            </ol>
            </div>
          </div>
        </div>

        <div className="mk-ed-picker" aria-label="School stages">
          {ARCS.map((arc) => (
            <div key={arc.id} className="mk-ed-pick-arc">
              <p className="mk-ed-arc-label">{arc.label}</p>
              <p className="mk-ed-pick-school">{arc.school}</p>
              <div className="mk-ed-pick-row" style={{ "--count": arc.stages.length } as React.CSSProperties}>
                {arc.stages.map((stage) => {
                  const clickable = stage.status !== "locked" && hasLog(stage);
                  const isSelected = stage.id === selected?.stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      className={`mk-ed-pick mk-ed-pick-${stage.status}`}
                      aria-pressed={isSelected}
                      disabled={!clickable}
                      onClick={() => setSelectedId(stage.id)}
                    >
                      <span className="mk-ed-pick-label">{stage.label}</span>
                      <span className="mk-ed-pick-state">
                        {stage.status === "cleared" ? stage.honor ?? "Cleared" : stage.status === "current" ? "Now playing" : "Locked"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selected && hasLog(selected.stage) && (
          <div className="mk-ed-log" aria-live="polite">
            <header className="mk-ed-loghead">
              <div className="mk-ed-loghead-main">
                <div className="mk-ed-loghead-title">
                  <h3 className="mk-ed-log-title">{selected.stage.label}</h3>
                  {selected.stage.honor && <span className="mk-ed-badge">{selected.stage.honor}</span>}
                </div>
                <p className="mk-ed-logmeta">
                  {[selected.arc.school, selected.arc.detail, selected.arc.place].filter(Boolean).join(", ")}
                </p>
              </div>
              <div className="mk-ed-stepper">
                {prevStage && (
                  <button type="button" className="mk-ed-step" onClick={() => setSelectedId(prevStage.stage.id)} aria-label={`Previous: ${prevStage.stage.label}`}>
                    <ChevronLeft size={16} aria-hidden="true" />
                    <span>{prevStage.stage.label}</span>
                  </button>
                )}
                {nextStage && (
                  <button type="button" className="mk-ed-step" onClick={() => setSelectedId(nextStage.stage.id)} aria-label={`Next: ${nextStage.stage.label}`}>
                    <span>{nextStage.stage.label}</span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </header>
            <div className="mk-ed-card-body">
            {selected.stage.tracks && (
              <div className="mk-ed-tracks">
                {selected.stage.tracks.map((track) => (
                  <section key={track.id} aria-label={track.label}>
                    <h4 className="mk-ed-track-label">{track.label}</h4>
                    <ul className="mk-ed-quests">
                      {track.quests.map((quest) => (
                        <li key={quest.name} className="mk-ed-quest">
                          <StatusMark status={quest.status} />
                          <div>
                            <div className="mk-ed-qhead">
                              <p className="mk-ed-qname">{quest.name}</p>
                              <span className="mk-ed-qstatus">{STATUS_COPY[quest.status]}</span>
                            </div>
                            <p className="mk-ed-qsum">{quest.summary}</p>
                            <div className="mk-ed-qfoot">
                              {quest.stack.map((s) => (
                                <span key={s} className="mk-ed-chip">{s}</span>
                              ))}
                              {quest.link && (
                                <a className="mk-ed-link" href={quest.link.url} target="_blank" rel="noopener noreferrer">
                                  {quest.link.label}
                                </a>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}

            {selected.stage.highlights && (
              <div className="mk-ed-groups">
                {GROUPS.map(({ kind, label, Icon }) => {
                  const items = selected.stage.highlights!.filter(
                    (h) => kindOf(h) === kind
                  );
                  if (items.length === 0) return null;
                  return (
                    <section key={kind} className="mk-ed-group" aria-label={label}>
                      <h4 className="mk-ed-group-label">
                        <Icon size={15} aria-hidden="true" />
                        {label}
                      </h4>
                      <ul className="mk-ed-highlights">
                        {items.map((h) => {
                          const place = h.title.match(/^(1st|2nd|3rd|\d+th) Place,\s*/);
                          const top = h.title.match(/^Top (\d+),\s*/);
                          const rank = place ? place[1] : top ? `#${top[1]}` : null;
                          const medal = place?.[1] === "1st" ? "gold" : place?.[1] === "2nd" ? "silver" : place?.[1] === "3rd" ? "bronze" : "plain";
                          const title = place ? h.title.slice(place[0].length) : top ? h.title.slice(top[0].length) : h.title;
                          return (
                            <li key={h.title} className={rank ? "mk-ed-ranked" : undefined}>
                              {rank && (
                                <span className={`mk-ed-medal mk-ed-medal-${medal}`} aria-hidden="true">{rank}</span>
                              )}
                              <span className="mk-ed-hl-title">
                                {rank && <span className="mk-ed-sr">{place ? `${place[1]} place, ` : `Top ${top![1]}, `}</span>}
                                {title}
                              </span>
                              {h.detail && <span className="mk-ed-hl-detail">{h.detail}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
