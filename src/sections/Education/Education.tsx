import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, CircleDashed, GraduationCap, Lock, Send, Trophy, Users } from "lucide-react";
import RoundTag from "../shared/RoundTag";
import { ARCS, ORIGIN, type Arc, type Highlight, type HighlightKind, type QuestStatus, type Stage } from "../../data/education";

const STATUS_COPY: Record<QuestStatus, string> = {
  cleared: "Cleared",
  "in-progress": "In progress",
  submitted: "Submitted",
};

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
const isOpenable = (s: Stage) => s.status !== "locked";

/** Chronological stage numbers (Stage 1 = Riyadh), shown newest first. */
const NUMBERED = ARCS.map((arc, i) => ({ arc, number: i + 1 }));
const NEWEST_FIRST = [...NUMBERED].reverse();

function defaultStageId(arc: Arc): string {
  const open = arc.stages.filter(isOpenable);
  const current = open.find((s) => s.status === "current");
  return (current ?? open[open.length - 1] ?? arc.stages[0]).id;
}

function arcStatus(arc: Arc): "current" | "cleared" {
  return arc.stages.some((s) => s.status === "current") ? "current" : "cleared";
}

function countHighlights(arc: Arc): number {
  return arc.stages.reduce((n, s) => n + (s.highlights?.length ?? 0), 0);
}

function StatusMark({ status }: { status: QuestStatus }) {
  const Icon = status === "cleared" ? Check : status === "submitted" ? Send : CircleDashed;
  return (
    <span className={`mk-ed-mark mk-ed-mark-${status}`}>
      <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
    </span>
  );
}

function StageLog({ stage }: { stage: Stage }) {
  if (!hasLog(stage)) {
    return (
      <div className="mk-ed-wip">
        <p className="mk-ed-wip-title">In progress</p>
        <p className="mk-ed-wip-text">{stage.label} is still running. Nothing to show until it is cleared.</p>
      </div>
    );
  }
  return (
    <div className="mk-ed-card-body">
      {stage.tracks && (
        <div className="mk-ed-tracks">
          {stage.tracks.map((track) => (
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

      {stage.highlights && (
        <div className="mk-ed-groups">
          {GROUPS.map(({ kind, label, Icon }) => {
            const items = stage.highlights!.filter((h) => kindOf(h) === kind);
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
                        {rank && <span className={`mk-ed-medal mk-ed-medal-${medal}`} aria-hidden="true">{rank}</span>}
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
  );
}

export default function Education() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [sectionIn, setSectionIn] = useState(false);
  const currentArc = NEWEST_FIRST.find(({ arc }) => arcStatus(arc) === "current") ?? NEWEST_FIRST[0];
  const [openArcId, setOpenArcId] = useState<string | null>(currentArc.arc.id);
  const [stageByArc, setStageByArc] = useState<Record<string, string>>(() =>
    Object.fromEntries(ARCS.map((arc) => [arc.id, defaultStageId(arc)]))
  );

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
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`mk-ed-root${sectionIn ? " in" : ""}`}>
      <style>{`
        .mk-ed-root {
          width: 100%;
          font-family: var(--mk-font-mono);
          padding: 96px 24px;
          box-sizing: border-box;
          display: flex;
          justify-content: center;
        }
        .mk-ed-inner { width: 100%; max-width: 1100px; }
        .mk-ed-title {
          margin: 0 0 14px;
          font-family: var(--mk-font-display);
          font-weight: 400;
          font-size: clamp(40px, 5.4vw, 72px);
          line-height: 1;
          color: var(--mk-cream);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .mk-ed-lede { margin: 0 0 40px; font-size: 18px; line-height: 1.6; color: var(--mk-text); max-width: 56ch; }

        .mk-ed-stages { margin: 0; padding: 0; list-style: none; display: grid; gap: 14px; }
        .mk-ed-arc { border: 3px solid #2e2724; background: #141110; }
        .mk-ed-arc[data-open="true"] { border-color: var(--mk-orange); }
        .mk-ed-arc[data-status="current"] { border-color: #6b2630; }
        .mk-ed-arc[data-status="current"][data-open="true"] { border-color: var(--mk-red); box-shadow: 8px 8px 0 #3d1218; }

        .mk-ed-arc-btn { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px 20px; width: 100%; padding: 20px 24px; font: inherit; color: inherit; text-align: left; background: none; border: none; border-radius: 0; cursor: pointer; }
        .mk-ed-arc-btn:hover .mk-ed-arc-school { color: var(--mk-orange); }
        .mk-ed-stagetag { grid-column: 1 / -1; font-size: 15px; font-weight: 700; color: var(--mk-orange); }
        .mk-ed-arc[data-status="current"] .mk-ed-stagetag { color: var(--mk-red-soft); }
        .mk-ed-arc-school { margin: 0; font-family: var(--mk-font-display); font-weight: 400; font-size: 34px; line-height: 1.05; color: var(--mk-cream); transition: color 0.15s ease; }
        .mk-ed-arc-meta { margin: 6px 0 0; font-size: 15px; line-height: 1.5; color: var(--mk-text-2); }
        .mk-ed-arc-side { display: flex; align-items: center; gap: 14px; }
        .mk-ed-arc-state { font-size: 15px; font-weight: 700; color: var(--mk-orange); white-space: nowrap; }
        .mk-ed-arc[data-status="current"] .mk-ed-arc-state { color: var(--mk-red-soft); }
        .mk-ed-chev { color: var(--mk-text-2); transition: transform 0.25s ease; }
        .mk-ed-arc[data-open="true"] .mk-ed-chev { transform: rotate(180deg); }

        .mk-ed-arc-panel { padding: 0 24px 28px; }
        .mk-ed-tabs { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 28px; padding-top: 20px; border-top: 3px solid #2e2724; }
        .mk-ed-tab { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 14px; font: inherit; font-size: 15px; font-weight: 700; color: var(--mk-cream); background: var(--mk-bg); border: 3px solid #2e2724; border-radius: 0; cursor: pointer; }
        .mk-ed-tab small { font-size: 13px; font-weight: 400; color: var(--mk-orange); }
        .mk-ed-tab[data-state="current"] small { color: var(--mk-red-soft); }
        .mk-ed-tab:hover:not(:disabled) { border-color: var(--mk-orange); }
        .mk-ed-tab[aria-pressed="true"] { border-color: var(--mk-orange); background: var(--mk-orange); color: var(--mk-bg); }
        .mk-ed-tab[aria-pressed="true"] small { color: var(--mk-bg); }
        .mk-ed-tab:disabled { cursor: default; color: var(--mk-text-3); }
        .mk-ed-tab:disabled small { color: var(--mk-text-3); }

        .mk-ed-wip { padding: 28px 24px; border: 3px dashed #6b2630; }
        .mk-ed-wip-title { margin: 0 0 6px; font-family: var(--mk-font-display); font-size: 34px; line-height: 1; color: var(--mk-red-soft); }
        .mk-ed-wip-text { margin: 0; font-size: 16px; line-height: 1.5; color: var(--mk-text-2); }
        .mk-ed-groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; align-items: stretch; }
        .mk-ed-group { padding: 18px 20px 6px; border: 3px solid #2e2724; background: var(--mk-bg); }
        .mk-ed-tracks + .mk-ed-groups { margin-top: 40px; }
        .mk-ed-group-label { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; font-size: 15px; font-weight: 700; color: var(--mk-orange); }
        .mk-ed-tracks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 56px; row-gap: 40px; }
        .mk-ed-track-label { margin: 0 0 6px; padding-bottom: 10px; font-size: 16px; font-weight: 700; color: var(--mk-orange); border-bottom: 3px solid #2e2724; }
        .mk-ed-quests, .mk-ed-highlights { margin: 0; padding: 0; list-style: none; }
        .mk-ed-quest { display: grid; grid-template-columns: 28px minmax(0, 1fr); column-gap: 12px; padding: 16px 0; border-bottom: 2px solid #231e1b; }
        .mk-ed-quest:last-child { border-bottom: none; }
        .mk-ed-mark { width: 24px; height: 24px; margin-top: 1px; display: flex; align-items: center; justify-content: center; border-radius: 0; }
        .mk-ed-mark-cleared { background: rgba(255,138,91,0.15); color: var(--mk-orange); }
        .mk-ed-mark-in-progress { background: rgba(232,40,60,0.15); color: var(--mk-red-soft); }
        .mk-ed-mark-submitted { background: rgba(245,240,230,0.1); color: var(--mk-cream); }
        .mk-ed-qhead { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
        .mk-ed-qname { margin: 0; font-size: 18px; color: var(--mk-cream); font-weight: 700; }
        .mk-ed-qstatus { font-size: 14px; color: var(--mk-text-3); }
        .mk-ed-qsum { margin: 6px 0 10px; font-size: 15px; line-height: 1.6; color: var(--mk-text-2); max-width: 60ch; }
        .mk-ed-qfoot { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .mk-ed-chip { font-size: 13px; color: var(--mk-text-2); border: 2px solid #2e2724; padding: 2px 7px; }
        .mk-ed-link { margin-left: auto; font-size: 14px; font-weight: 700; color: var(--mk-orange); text-decoration: underline; text-underline-offset: 3px; }
        .mk-ed-link:hover { color: #fff; border-bottom-color: #fff; }
        .mk-ed-highlights { display: grid; grid-template-columns: 1fr; }
        .mk-ed-highlights li { position: relative; display: flex; flex-direction: column; gap: 3px; padding: 14px 0 14px 26px; border-bottom: 2px solid #231e1b; }
        .mk-ed-highlights li:last-child { border-bottom: none; }
        .mk-ed-highlights li::before { content: ""; position: absolute; left: 4px; top: 20px; width: 8px; height: 8px; background: var(--mk-orange); transform: rotate(45deg); }
        .mk-ed-highlights li.mk-ed-ranked { padding-left: 46px; min-height: 36px; justify-content: center; }
        .mk-ed-highlights li.mk-ed-ranked::before { display: none; }
        .mk-ed-hl-title { font-size: 16px; font-weight: 700; line-height: 1.4; color: var(--mk-cream); }
        .mk-ed-hl-detail { font-size: 14px; line-height: 1.5; color: var(--mk-text-3); }
        .mk-ed-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        .mk-ed-medal {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 34px; height: 34px; border-radius: 0;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--mk-font-display); font-size: 13px; letter-spacing: 0.02em; color: #1a1208;
          
        }
        .mk-ed-medal-gold { background: #e3b53c; }
        .mk-ed-medal-silver { background: #b6bcc6; }
        .mk-ed-medal-bronze { background: #c47a45; }
        .mk-ed-medal-plain { background: rgba(255,138,91,0.16); color: var(--mk-orange);  }

        @keyframes mk-ed-open { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .mk-ed-arc-panel { animation: mk-ed-open 0.25s ease; }

        @media (max-width: 820px) {
          .mk-ed-root { padding: 72px 16px; }
          .mk-ed-arc-btn { grid-template-columns: minmax(0, 1fr) auto; padding: 18px 16px; }
          .mk-ed-stagetag { grid-column: 1 / -1; justify-self: start; }
          .mk-ed-arc-state { display: none; }
          .mk-ed-arc-panel { padding: 0 16px 22px; }
          .mk-ed-tracks { grid-template-columns: 1fr; row-gap: 32px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-ed-arc-panel { animation: none; }
          .mk-ed-chev { transition: none; }
        }
      `}</style>

      <div className="mk-ed-inner">
        <RoundTag label="Round four" />
        <h2 className="mk-ed-title">Stage select</h2>
        <p className="mk-ed-lede">{ORIGIN}</p>

        <ol className="mk-ed-stages" aria-label="Schools, newest first">
          {NEWEST_FIRST.map(({ arc, number }) => {
            const open = openArcId === arc.id;
            const status = arcStatus(arc);
            const selectedId = stageByArc[arc.id];
            const selected = arc.stages.find((s) => s.id === selectedId) ?? arc.stages[0];
            const awards = countHighlights(arc);
            const meta = [arc.detail, arc.place, arc.years].filter(Boolean).join(", ");
            const panelId = `mk-ed-panel-${arc.id}`;
            return (
              <li key={arc.id} className="mk-ed-arc" data-open={open} data-status={status}>
                <button
                  type="button"
                  className="mk-ed-arc-btn"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenArcId(open ? null : arc.id)}
                >
                  <span className="mk-ed-stagetag">Stage {number}</span>
                  <span>
                    <p className="mk-ed-arc-school">{arc.school}</p>
                    <p className="mk-ed-arc-meta">{meta}</p>
                  </span>
                  <span className="mk-ed-arc-side">
                    <span className="mk-ed-arc-state">
                      {status === "current" ? "Now playing" : awards > 0 ? `Cleared, ${awards} awards` : "Cleared"}
                    </span>
                    <ChevronDown className="mk-ed-chev" size={20} aria-hidden="true" />
                  </span>
                </button>

                {open && (
                  <div className="mk-ed-arc-panel" id={panelId}>
                    <div className="mk-ed-tabs" role="group" aria-label={`${arc.label} years`}>
                      {arc.stages.map((stage) => {
                        const clickable = isOpenable(stage);
                        const state =
                          stage.status === "current" ? "Now playing" : stage.status === "locked" ? "Locked" : stage.honor ?? "Cleared";
                        return (
                          <button
                            key={stage.id}
                            type="button"
                            className="mk-ed-tab"
                            data-state={stage.status}
                            aria-pressed={clickable && stage.id === selected.id}
                            disabled={!clickable}
                            onClick={() => setStageByArc((prev) => ({ ...prev, [arc.id]: stage.id }))}
                          >
                            {stage.status === "locked" && <Lock size={13} aria-hidden="true" />}
                            {stage.label}
                            <small>{state}</small>
                          </button>
                        );
                      })}
                    </div>
                    <StageLog stage={selected} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
