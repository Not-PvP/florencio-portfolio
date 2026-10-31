import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Flag, Shuffle, Swords } from "lucide-react";
import { AVATARS, AVATAR_PALETTE } from "../../data/avatars";
import {
  ENABLED,
  REMARK_MAX,
  REMOTE,
  cleanTag,
  cooldownLeftMs,
  fetchChallengers,
  getMineIds,
  postChallenger,
  reportChallenger,
} from "../../lib/challengers";
import type { Challenger, PostFailure } from "../../lib/challengers";
import { playConfirm, playHit, playMiss, playSelect } from "./audio";

const PAGE_SIZE = 12;
const KO_MS = 1500;

const MESSAGES: Record<PostFailure, string> = {
  empty: "Write a remark first. Even one word counts.",
  tag: "Your tag needs 3 letters or numbers, and a clean one.",
  link: "No links or email addresses in remarks. The ref stopped that one.",
  blocked: "The ref blocked that one. Keep it clean and try again.",
  cooldown: "You just posted. Give it a few minutes before the next round.",
  busy: "The arcade is packed right now. Try again in a minute.",
  network: "Couldn't reach the roster. Check your connection and try again.",
};

/* ---------- pixel avatars: each 12x12 map becomes one SVG path per colour ---------- */

function buildPaths(rows: readonly string[]): [string, string][] {
  const byColour = new Map<string, string>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x += 1;
        continue;
      }
      let end = x;
      while (end < row.length && row[end] === ch) end += 1;
      byColour.set(ch, `${byColour.get(ch) ?? ""}M${x} ${y}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });
  return [...byColour.entries()];
}

const AVATAR_PATHS = AVATARS.map((a) => buildPaths(a.rows));

/** Fetched rows join whatever is already on the wall (e.g. a remark posted while loading). */
function mergeRows(prev: Challenger[], rows: Challenger[]): Challenger[] {
  const ids = new Set(rows.map((r) => r.id));
  return [...prev.filter((p) => !ids.has(p.id)), ...rows].sort((a, b) => b.createdAt - a.createdAt);
}

function PixelAvatar({ index, size }: { index: number; size: number }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      {AVATAR_PATHS[index].map(([ch, d]) => (
        <path key={ch} d={d} fill={AVATAR_PALETTE[ch]} />
      ))}
    </svg>
  );
}

/* ---------- small helpers ---------- */

function timeAgo(createdAt: number, now: number): string {
  const s = Math.max(0, Math.round((now - createdAt) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function clock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/* ---------- one fighter card (wall, host and live preview share it) ---------- */

type CardKind = "host" | "preview" | "wall";

interface CardProps {
  kind: CardKind;
  avatar: number;
  tag: string;
  remark: string;
  meta: string;
  tagEmpty?: boolean;
  remarkEmpty?: boolean;
  mine?: boolean;
  fresh?: boolean;
  onReport?: () => void;
}

function FighterCard({ kind, avatar, tag, remark, meta, tagEmpty, remarkEmpty, mine, fresh, onReport }: CardProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <article className={`mk-ch-card mk-ch-card--${kind}${fresh ? " mk-ch-slam" : ""}`}>
      <div className="mk-ch-card-head">
        <div className="mk-ch-portrait">
          <PixelAvatar index={avatar} size={56} />
        </div>
        <div className="mk-ch-card-id">
          <span className="mk-ch-tag" data-empty={tagEmpty || undefined}>
            {tag}
          </span>
          <span className="mk-ch-meta">
            {meta}
            {mine && <b className="mk-ch-you">YOU</b>}
          </span>
        </div>
        {onReport && !confirming && (
          <button
            type="button"
            className="mk-ch-flag"
            onClick={() => setConfirming(true)}
            aria-label={`Report the remark from ${tag}`}
            title="Report"
          >
            <Flag size={15} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="mk-ch-remark" data-empty={remarkEmpty || undefined}>
        {remark}
      </p>
      {onReport && confirming && (
        <div className="mk-ch-confirm" role="group" aria-label="Confirm report">
          <span>Report this remark?</span>
          <button type="button" className="mk-ch-mini mk-ch-mini--yes" onClick={onReport}>
            Report
          </button>
          <button type="button" className="mk-ch-mini" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      )}
    </article>
  );
}

/* ---------- the section ---------- */

export default function Challengers() {
  // Without a backend a production build hides the roster rather than show a private one.
  if (!ENABLED) return null;
  return <ChallengerRoster />;
}

function ChallengerRoster() {
  const uid = useId();
  const rootRef = useRef<HTMLElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [armed, setArmed] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [items, setItems] = useState<Challenger[]>([]);
  const [shown, setShown] = useState(PAGE_SIZE);
  const [mine, setMine] = useState<Set<string>>(() => getMineIds());
  const [now, setNow] = useState(() => Date.now());

  const [avatar, setAvatar] = useState(0);
  const [tag, setTag] = useState("");
  const [remark, setRemark] = useState("");
  const [honey, setHoney] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(() => cooldownLeftMs());
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [wallNote, setWallNote] = useState("");
  const [shake, setShake] = useState(false);
  const [ko, setKo] = useState(false);
  const [freshId, setFreshId] = useState<string | null>(null);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Only talk to the server once the footer is close to the screen.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!armed) return;
    const controller = new AbortController();
    fetchChallengers(controller.signal)
      .then((rows) => {
        setItems((prev) => mergeRows(prev, rows));
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [armed]);

  const retry = useCallback(() => {
    setStatus("loading");
    fetchChallengers()
      .then((rows) => {
        setItems((prev) => mergeRows(prev, rows));
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  // Relative times refresh once a minute.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const cooling = cooldown > 0;
  useEffect(() => {
    if (!cooling) return;
    const id = setInterval(() => setCooldown(cooldownLeftMs()), 1000);
    return () => clearInterval(id);
  }, [cooling]);

  function pickAvatar(index: number) {
    setAvatar(index);
    playSelect();
  }

  function shuffleAvatar() {
    const next = (avatar + 1 + Math.floor(Math.random() * (AVATARS.length - 1))) % AVATARS.length;
    pickAvatar(next);
  }

  function onTagChange(e: ChangeEvent<HTMLInputElement>) {
    setTag(cleanTag(e.target.value));
  }

  function fail(reason: PostFailure, retryInMs?: number) {
    playMiss();
    setNote({ kind: "error", text: MESSAGES[reason] });
    setShake(true);
    later(() => setShake(false), 360);
    if (reason === "cooldown") setCooldown(retryInMs ?? cooldownLeftMs());
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || cooling) return;

    // A real visitor never sees the hidden field; bots fill it in. Pretend it worked.
    if (honey) {
      setNote({ kind: "ok", text: "You're on the wall. K.O.!" });
      setRemark("");
      return;
    }

    setBusy(true);
    setNote(null);
    const result = await postChallenger({ tag, avatar, remark });
    setBusy(false);

    if (!result.ok) {
      fail(result.reason, result.retryInMs);
      return;
    }

    const c = result.challenger;
    playHit();
    later(playConfirm, 170);
    setItems((prev) => [c, ...prev.filter((p) => p.id !== c.id)]);
    setMine((prev) => new Set(prev).add(c.id));
    setFreshId(c.id);
    setStatus("ready");
    setRemark("");
    setCooldown(cooldownLeftMs());
    setNote({ kind: "ok", text: "You're on the wall. K.O.!" });
    setKo(true);
    later(() => setKo(false), KO_MS);
  }

  async function onReport(id: string) {
    setItems((prev) => prev.filter((c) => c.id !== id));
    const sent = await reportChallenger(id);
    setWallNote(sent ? "Reported. It's hidden for you now, thanks." : "Hidden for you, but the report didn't send.");
  }

  const visible = items.slice(0, shown);
  const previewTag = tag || "???";
  const previewRemark = remark.trim() || "Your remark shows up here.";
  const nearLimit = remark.length >= REMARK_MAX - 10;

  return (
    <section className="mk-ch" ref={rootRef} aria-labelledby={`${uid}-title`}>
      <style>{`
        .mk-ch { margin-top: 80px; padding-top: 36px; border-top: 3px solid #2e2724; }
        .mk-ch-title {
          margin: 0 0 10px;
          font-family: var(--mk-font-display);
          font-weight: 400;
          font-size: clamp(40px, 6vw, 64px);
          line-height: 0.9;
          color: var(--mk-cream);
        }
        .mk-ch-lede { margin: 0 0 28px; max-width: 52ch; font-size: 18px; line-height: 1.55; color: var(--mk-text); }

        .mk-ch-stage { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 28px; align-items: start; }
        .mk-ch-form, .mk-ch-previewbox {
          padding: 20px;
          background: var(--mk-surface);
          border: 3px solid #2e2724;
          box-sizing: border-box;
        }
        .mk-ch-previewbox { position: relative; }
        .mk-ch-step { display: flex; align-items: baseline; gap: 10px; margin: 0 0 10px; padding: 0; }
        .mk-ch-step b { font-family: var(--mk-font-display); font-weight: 400; font-size: 26px; line-height: 1; color: var(--mk-orange); }
        .mk-ch-step span { font-size: 16px; font-weight: 700; color: var(--mk-cream); }
        .mk-ch-fieldset { margin: 0 0 22px; min-width: 0; }
        .mk-ch-pick-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .mk-ch-pick-row .mk-ch-step { margin: 0; }
        .mk-ch-shuffle {
          display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 4px 12px;
          font: inherit; font-size: 14px; font-weight: 700; color: var(--mk-text-2);
          background: none; border: 2px solid #2e2724; border-radius: 0; cursor: pointer;
        }
        .mk-ch-shuffle:hover { color: var(--mk-orange); border-color: var(--mk-orange); }

        .mk-ch-avatars { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .mk-ch-avatar { position: relative; display: block; cursor: pointer; }
        .mk-ch-avatar input { position: absolute; width: 1px; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
        .mk-ch-avatar-face {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 8px 4px 6px;
          background: var(--mk-bg);
          border: 3px solid #2e2724;
          transition: transform 0.08s steps(2), box-shadow 0.08s steps(2);
        }
        .mk-ch-avatar-face svg { width: 100%; max-width: 64px; height: auto; }
        .mk-ch-avatar-name { font-size: 13px; color: var(--mk-text-2); }
        .mk-ch-avatar:hover .mk-ch-avatar-face { border-color: var(--mk-text-2); }
        .mk-ch-avatar input:checked + .mk-ch-avatar-face {
          border-color: var(--mk-orange);
          background: var(--mk-surface-2);
          box-shadow: 3px 3px 0 var(--mk-red);
          transform: translate(-1px, -1px);
        }
        .mk-ch-avatar input:checked + .mk-ch-avatar-face .mk-ch-avatar-name { color: var(--mk-orange); }
        .mk-ch-avatar input:focus-visible + .mk-ch-avatar-face { outline: 2px solid var(--mk-orange); outline-offset: 2px; }

        .mk-ch-label { display: block; }
        .mk-ch-input {
          width: 100%; box-sizing: border-box; min-height: 48px; padding: 10px 12px;
          font-family: var(--mk-font-body); font-size: 18px; color: var(--mk-cream);
          background: var(--mk-bg); border: 3px solid var(--mk-text-3); border-radius: 0;
        }
        .mk-ch-input::placeholder { color: var(--mk-text-3); }
        .mk-ch-input:focus { outline: none; border-color: var(--mk-orange); }
        .mk-ch-input--tag { width: 9ch; font-family: var(--mk-font-display); font-size: 30px; letter-spacing: 0.12em; text-align: center; padding: 4px 6px; }
        textarea.mk-ch-input { resize: vertical; min-height: 96px; line-height: 1.45; }
        .mk-ch-count { margin: 6px 0 0; text-align: right; font-size: 14px; color: var(--mk-text-3); }
        .mk-ch-count[data-near] { color: var(--mk-orange); }
        .mk-ch-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

        .mk-ch-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
        .mk-ch-form .mk-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: 4px 4px 0 var(--mk-red); }
        .mk-ch-note { margin: 14px 0 0; min-height: 1.5em; font-size: 16px; line-height: 1.5; }
        .mk-ch-note[data-kind="error"] { color: var(--mk-red-soft); }
        .mk-ch-note[data-kind="ok"] { color: var(--mk-orange); }
        .mk-ch-hint { margin: 14px 0 0; font-size: 14px; line-height: 1.5; color: var(--mk-text-3); }

        .mk-ch-previewlabel { margin: 0 0 12px; font-family: var(--mk-font-display); font-size: 26px; line-height: 1; color: var(--mk-cream); }
        .mk-ch-ko {
          position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center;
          background: var(--mk-red); pointer-events: none;
          animation: mk-ch-ko ${KO_MS}ms steps(6) forwards;
        }
        .mk-ch-ko span { font-family: var(--mk-font-display); font-size: clamp(96px, 16vw, 150px); line-height: 1; color: var(--mk-cream); }

        .mk-ch-roster-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 16px; margin: 48px 0 16px; }
        .mk-ch-roster-title { margin: 0; font-family: var(--mk-font-display); font-weight: 400; font-size: 30px; line-height: 1; color: var(--mk-cream); }
        .mk-ch-roster-count { font-size: 15px; color: var(--mk-text-3); }
        .mk-ch-wall { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
        .mk-ch-wall > li { display: flex; min-width: 0; }

        .mk-ch-card {
          position: relative; display: flex; flex-direction: column; gap: 12px; width: 100%; padding: 14px;
          box-sizing: border-box; background: var(--mk-surface); border: 3px solid #2e2724;
          box-shadow: 4px 4px 0 #2e2724; transition: border-color 0.12s steps(2);
        }
        .mk-ch-card:hover { border-color: var(--mk-text-3); }
        .mk-ch-card--host { border-color: var(--mk-orange); box-shadow: 4px 4px 0 var(--mk-red); }
        .mk-ch-card--preview { box-shadow: none; }
        .mk-ch-card-head { display: flex; align-items: center; gap: 12px; }
        .mk-ch-portrait { flex: none; padding: 4px; background: var(--mk-bg); border: 3px solid #2e2724; }
        .mk-ch-card-id { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
        .mk-ch-tag { font-family: var(--mk-font-display); font-size: 34px; line-height: 0.9; letter-spacing: 0.08em; color: var(--mk-orange); }
        .mk-ch-tag[data-empty] { color: var(--mk-text-3); }
        .mk-ch-meta { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--mk-text-3); }
        .mk-ch-you { padding: 0 5px; font-size: 12px; color: var(--mk-bg); background: var(--mk-orange); }
        .mk-ch-remark { margin: 0; font-size: 17px; line-height: 1.5; color: var(--mk-text); overflow-wrap: anywhere; white-space: pre-wrap; }
        .mk-ch-remark[data-empty] { color: var(--mk-text-3); }
        .mk-ch-flag {
          align-self: flex-start; display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px;
          margin: -8px -8px 0 0; padding: 0; color: var(--mk-text-3); background: none; border: 0; border-radius: 0; cursor: pointer;
        }
        .mk-ch-flag:hover { color: var(--mk-red-soft); }
        .mk-ch-confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; font-size: 14px; color: var(--mk-text-2); }
        .mk-ch-mini {
          min-height: 36px; padding: 4px 12px; font: inherit; font-size: 14px; font-weight: 700; color: var(--mk-cream);
          background: none; border: 2px solid var(--mk-text-3); border-radius: 0; cursor: pointer;
        }
        .mk-ch-mini:hover { border-color: var(--mk-orange); color: var(--mk-orange); }
        .mk-ch-mini--yes { color: var(--mk-bg); background: var(--mk-red-soft); border-color: var(--mk-red-soft); }
        .mk-ch-mini--yes:hover { color: var(--mk-bg); background: var(--mk-orange); border-color: var(--mk-orange); }

        .mk-ch-slot {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 100%; min-height: 150px;
          padding: 14px; box-sizing: border-box; text-align: center; color: var(--mk-text-3); border: 3px dashed #2e2724;
        }
        .mk-ch-slot strong { font-family: var(--mk-font-display); font-weight: 400; font-size: 28px; color: var(--mk-text-2); }
        .mk-ch-state { margin: 0; font-size: 16px; color: var(--mk-text-2); }
        .mk-ch-wallnote { margin: 12px 0 0; min-height: 1.5em; font-size: 15px; color: var(--mk-text-2); }
        .mk-ch-more { margin-top: 20px; }

        .mk-ch-shake { animation: mk-ch-shake 0.36s steps(6); }
        .mk-ch-slam { animation: mk-ch-slam 0.5s steps(5) both; }
        @keyframes mk-ch-ko {
          0% { transform: scale(2.4); opacity: 0; }
          18% { transform: scale(1); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes mk-ch-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-7px); }
          50% { transform: translateX(7px); }
          75% { transform: translateX(-4px); }
        }
        @keyframes mk-ch-slam {
          0% { transform: translateY(-28px) scale(1.06); opacity: 0; }
          60% { transform: translateY(5px) scale(1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-ch-ko { animation: none; }
          .mk-ch-shake, .mk-ch-slam { animation: none; }
          .mk-ch-avatar-face, .mk-ch-card { transition: none; }
        }
        @media (max-width: 860px) {
          .mk-ch { margin-top: 56px; }
          .mk-ch-stage { grid-template-columns: minmax(0, 1fr); }
          .mk-ch-previewbox { order: -1; }
        }
        @media (max-width: 480px) {
          .mk-ch-form, .mk-ch-previewbox { padding: 16px; }
          .mk-ch-avatars { gap: 8px; }
          .mk-ch-actions .mk-btn { flex: 1 1 100%; }
        }
      `}</style>

      <h3 className="mk-ch-title" id={`${uid}-title`}>
        Sign the cabinet
      </h3>
      <p className="mk-ch-lede">
        Made it to the end? Pick a fighter, add a tag and a line, and pin yourself to the roster. Anyone who scrolls this far
        will see it.
      </p>

      <div className="mk-ch-stage">
        <form className={`mk-ch-form${shake ? " mk-ch-shake" : ""}`} onSubmit={onSubmit} noValidate>
          <div className="mk-ch-fieldset">
            <div className="mk-ch-pick-row">
              <p className="mk-ch-step" id={`${uid}-pick`}>
                <b>1</b>
                <span>Pick your fighter</span>
              </p>
              <button type="button" className="mk-ch-shuffle" onClick={shuffleAvatar}>
                <Shuffle size={15} strokeWidth={2.5} aria-hidden="true" />
                Random
              </button>
            </div>
            <div className="mk-ch-avatars" role="radiogroup" aria-labelledby={`${uid}-pick`}>
              {AVATARS.map((a, i) => (
                <label key={a.id} className="mk-ch-avatar">
                  <input
                    type="radio"
                    name={`${uid}-avatar`}
                    value={i}
                    checked={avatar === i}
                    onChange={() => pickAvatar(i)}
                  />
                  <span className="mk-ch-avatar-face">
                    <PixelAvatar index={i} size={64} />
                    <span className="mk-ch-avatar-name">{a.name}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mk-ch-fieldset">
            <label className="mk-ch-label" htmlFor={`${uid}-tag`}>
              <span className="mk-ch-step">
                <b>2</b>
                <span>Your tag (3 letters or numbers)</span>
              </span>
            </label>
            <input
              id={`${uid}-tag`}
              className="mk-ch-input mk-ch-input--tag"
              type="text"
              value={tag}
              onChange={onTagChange}
              placeholder="AAA"
              maxLength={3}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
          </div>

          <div className="mk-ch-fieldset">
            <label className="mk-ch-label" htmlFor={`${uid}-remark`}>
              <span className="mk-ch-step">
                <b>3</b>
                <span>Your remark</span>
              </span>
            </label>
            <textarea
              id={`${uid}-remark`}
              className="mk-ch-input"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="What did you think of the run?"
              maxLength={REMARK_MAX}
              rows={3}
            />
            <p className="mk-ch-count" data-near={nearLimit || undefined} aria-hidden="true">
              {remark.length}/{REMARK_MAX}
            </p>
          </div>

          <input
            className="mk-ch-hp"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={honey}
            onChange={(e) => setHoney(e.target.value)}
          />

          <div className="mk-ch-actions">
            <button type="submit" className="mk-btn" disabled={busy || cooling}>
              <Swords size={18} strokeWidth={2.5} aria-hidden="true" />
              {busy ? "Sending..." : cooling ? `Next round in ${clock(cooldown)}` : "Ready? Fight!"}
            </button>
          </div>
          <p className="mk-ch-note" role="status" aria-live="polite" data-kind={note?.kind}>
            {note?.text}
          </p>
          <p className="mk-ch-hint">Remarks are public. No links, 140 characters max, and anything rude gets removed.</p>
        </form>

        <div className="mk-ch-previewbox">
          <p className="mk-ch-previewlabel">Your card</p>
          <FighterCard
            kind="preview"
            avatar={avatar}
            tag={previewTag}
            remark={previewRemark}
            meta="P2 · PREVIEW"
            tagEmpty={!tag}
            remarkEmpty={!remark.trim()}
          />
          {ko && (
            <div className="mk-ch-ko" aria-hidden="true">
              <span>K.O.</span>
            </div>
          )}
        </div>
      </div>

      <div className="mk-ch-roster-head">
        <h4 className="mk-ch-roster-title">The roster</h4>
        <span className="mk-ch-roster-count">
          {status === "ready" ? `${items.length} ${items.length === 1 ? "challenger" : "challengers"}` : ""}
          {!REMOTE && " · local test mode, only this browser sees these"}
        </span>
      </div>

      {status === "error" ? (
        <p className="mk-ch-state">
          Couldn't load the roster.{" "}
          <button type="button" className="mk-ch-mini" onClick={retry}>
            Try again
          </button>
        </p>
      ) : (
        <ul className="mk-ch-wall" aria-label="Challenger roster" aria-busy={status === "loading"}>
          <li>
            <FighterCard
              kind="host"
              avatar={0}
              tag="KRM"
              remark="Beat the portfolio? Leave your mark."
              meta="P1 · HOST"
            />
          </li>
          {visible.map((c) => (
            <li key={c.id}>
              <FighterCard
                kind="wall"
                avatar={c.avatar}
                tag={c.tag}
                remark={c.remark}
                meta={timeAgo(c.createdAt, now)}
                mine={mine.has(c.id)}
                fresh={c.id === freshId}
                onReport={mine.has(c.id) ? undefined : () => void onReport(c.id)}
              />
            </li>
          ))}
          {status === "loading" && (
            <li>
              <div className="mk-ch-slot">
                <strong>Loading</strong>
                <span>Warming up the cabinet...</span>
              </div>
            </li>
          )}
          {status === "ready" && items.length === 0 && (
            <li>
              <div className="mk-ch-slot">
                <strong>Slot open</strong>
                <span>Be the first challenger.</span>
              </div>
            </li>
          )}
        </ul>
      )}

      {items.length > shown && (
        <button type="button" className="mk-btn mk-btn-ghost mk-ch-more" onClick={() => setShown((n) => n + PAGE_SIZE)}>
          Show more ({items.length - shown})
        </button>
      )}
      <p className="mk-ch-wallnote" role="status" aria-live="polite">
        {wallNote}
      </p>
    </section>
  );
}
