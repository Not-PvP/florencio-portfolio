/**
 * Data layer for the Challenger Roster in the footer.
 *
 * With VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set, remarks live in Supabase and everyone
 * sees them (rules live in supabase/setup.sql). Without them, `npm run dev` falls back to a
 * browser-only roster so the UI can be worked on offline; a production build hides the section
 * instead, so visitors are never shown a roster that only they can see.
 */
import { AVATARS } from "../data/avatars";
import { LINK_PATTERN, isBadTag, isBlocked } from "../data/blocklist";

export interface Challenger {
  id: string;
  tag: string;
  avatar: number;
  remark: string;
  createdAt: number;
}

export type PostFailure = "empty" | "tag" | "link" | "blocked" | "cooldown" | "busy" | "network";

export type PostResult =
  | { ok: true; challenger: Challenger }
  | { ok: false; reason: PostFailure; retryInMs?: number };

export const REMARK_MAX = 140;
export const COOLDOWN_MS = 3 * 60 * 1000;
const FETCH_LIMIT = 60;

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const REMOTE = Boolean(SUPABASE_URL && SUPABASE_KEY);
/** The roster only renders when it can be shared (REMOTE) or while developing locally. */
export const ENABLED = REMOTE || import.meta.env.DEV;

const KEY_CLIENT = "mk-challenger-client";
const KEY_LAST_POST = "mk-challenger-last-post";
const KEY_MINE = "mk-challenger-mine";
const KEY_REPORTED = "mk-challenger-reported";
const KEY_LOCAL = "mk-challenger-local";

/* ---------- storage (can be blocked or full, so every access is guarded) ---------- */

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: the choice then only lasts for this visit */
  }
}

function readIdSet(key: string): Set<string> {
  const list = readJSON<unknown>(key, []);
  return new Set(Array.isArray(list) ? list.filter((v): v is string => typeof v === "string") : []);
}

function addToIdSet(key: string, id: string): void {
  const set = readIdSet(key);
  set.add(id);
  writeJSON(key, [...set].slice(-200));
}

function makeUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) =>
    c === "x" ? hex() : ((Number.parseInt(hex(), 16) & 3) | 8).toString(16),
  );
}

let memoryClientId: string | null = null;

/** Random id kept in this browser. The database uses it for the per-visitor cooldown. */
export function getClientId(): string {
  if (memoryClientId) return memoryClientId;
  const stored = readJSON<unknown>(KEY_CLIENT, null);
  if (typeof stored === "string" && /^[0-9a-f-]{36}$/i.test(stored)) {
    memoryClientId = stored;
    return stored;
  }
  memoryClientId = makeUuid();
  writeJSON(KEY_CLIENT, memoryClientId);
  return memoryClientId;
}

export function getMineIds(): Set<string> {
  return readIdSet(KEY_MINE);
}

export function cooldownLeftMs(): number {
  const last = Number(readJSON<unknown>(KEY_LAST_POST, 0));
  if (!Number.isFinite(last) || last <= 0) return 0;
  return Math.max(0, COOLDOWN_MS - (Date.now() - last));
}

/* ---------- validation (the database repeats all of this) ---------- */

export function cleanRemark(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

export function cleanTag(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
}

function validate(tag: string, avatar: number, remark: string): PostFailure | null {
  if (!remark || remark.length > REMARK_MAX) return "empty";
  if (!/^[A-Z0-9]{3}$/.test(tag) || isBadTag(tag)) return "tag";
  if (!Number.isInteger(avatar) || avatar < 0 || avatar >= AVATARS.length) return "empty";
  if (LINK_PATTERN.test(remark)) return "link";
  if (isBlocked(remark)) return "blocked";
  return null;
}

/* ---------- parsing ---------- */

function parseRows(data: unknown): Challenger[] {
  if (!Array.isArray(data)) return [];
  const out: Challenger[] = [];
  for (const row of data) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.tag !== "string" || typeof r.remark !== "string") continue;
    const avatar = Number(r.avatar);
    const createdAt = typeof r.created_at === "string" ? Date.parse(r.created_at) : Number(r.createdAt);
    out.push({
      id: r.id,
      tag: r.tag.slice(0, 3),
      avatar: Number.isInteger(avatar) && avatar >= 0 && avatar < AVATARS.length ? avatar : 0,
      remark: r.remark.slice(0, REMARK_MAX),
      createdAt: Number.isFinite(createdAt) ? createdAt : 0,
    });
  }
  return out;
}

function authHeaders(): Record<string, string> {
  const key = SUPABASE_KEY ?? "";
  // Legacy anon keys are JWTs (start with "eyJ") and go in both headers. The newer
  // "sb_publishable_..." keys are not JWTs, so they only go in the apikey header.
  return key.startsWith("eyJ") ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
}

/* ---------- API ---------- */

export async function fetchChallengers(signal?: AbortSignal): Promise<Challenger[]> {
  const reported = readIdSet(KEY_REPORTED);
  if (!REMOTE) {
    return parseRows(readJSON<unknown>(KEY_LOCAL, [])).filter((c) => !reported.has(c.id));
  }
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/challengers?select=id,tag,avatar,remark,created_at&order=created_at.desc&limit=${FETCH_LIMIT}`,
    { headers: authHeaders(), signal },
  );
  if (!res.ok) throw new Error(`Roster request failed (${res.status})`);
  return parseRows(await res.json()).filter((c) => !reported.has(c.id));
}

function failureFromMessage(status: number, message: unknown): PostFailure {
  const text = typeof message === "string" ? message : "";
  if (text.includes("mk_blocked")) return "blocked";
  if (text.includes("mk_link")) return "link";
  if (text.includes("mk_cooldown")) return "cooldown";
  if (text.includes("mk_busy") || status === 429) return "busy";
  if (text.includes("mk_empty")) return "empty";
  return "network";
}

export async function postChallenger(input: { tag: string; avatar: number; remark: string }): Promise<PostResult> {
  const tag = cleanTag(input.tag);
  const remark = cleanRemark(input.remark);

  const invalid = validate(tag, input.avatar, remark);
  if (invalid) return { ok: false, reason: invalid };

  const left = cooldownLeftMs();
  if (left > 0) return { ok: false, reason: "cooldown", retryInMs: left };

  if (!REMOTE) {
    const challenger: Challenger = { id: `local-${makeUuid()}`, tag, avatar: input.avatar, remark, createdAt: Date.now() };
    const existing = parseRows(readJSON<unknown>(KEY_LOCAL, []));
    writeJSON(KEY_LOCAL, [challenger, ...existing].slice(0, FETCH_LIMIT));
    writeJSON(KEY_LAST_POST, Date.now());
    addToIdSet(KEY_MINE, challenger.id);
    return { ok: true, challenger };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/challengers?select=id,tag,avatar,remark,created_at`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ tag, avatar: input.avatar, remark, client_id: getClientId() }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: unknown } | null;
      const reason = failureFromMessage(res.status, body?.message);
      return reason === "cooldown"
        ? { ok: false, reason, retryInMs: COOLDOWN_MS }
        : { ok: false, reason };
    }
    const [challenger] = parseRows(await res.json());
    if (!challenger) return { ok: false, reason: "network" };
    writeJSON(KEY_LAST_POST, Date.now());
    addToIdSet(KEY_MINE, challenger.id);
    return { ok: true, challenger };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/** Hides the remark for this visitor right away, then tells the database. Returns false if that call failed. */
export async function reportChallenger(id: string): Promise<boolean> {
  addToIdSet(KEY_REPORTED, id);
  if (!REMOTE) return true;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/report_challenger`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ p_id: id, p_client: getClientId() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
