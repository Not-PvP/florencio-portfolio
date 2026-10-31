/**
 * Remark moderation, kept in step with `mk_is_blocked()` in supabase/setup.sql.
 * The database repeats every check below, so calling the API directly can't skip them.
 *
 * Matching works per word: leetspeak is undone (5h1t -> shit), punctuation inside a word is
 * dropped (f.u.c.k -> fuck), and stems tolerate stretched letters (fuuuck). Short or common words
 * are only blocked as a whole word, so "class" and "cocktail" are fine.
 */

const LEET: Readonly<Record<string, string>> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  $: "s",
};

/** Blocked anywhere inside a word. */
const STEMS = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "whore",
  "slut",
  "nigg",
  "faggot",
  "retard",
  "asshole",
  "dickhead",
  "cocksuck",
  "motherfuck",
  "nazi",
];

/** Blocked only as a whole word (an optional trailing "s" is allowed). */
const WORDS = [
  "dick",
  "cock",
  "pussy",
  "ass",
  "fag",
  "rape",
  "rapist",
  "porn",
  "kys",
  "coon",
  "spic",
  "kike",
  "chink",
  "tranny",
];

/** Harmless words that would trip a stem; removed before matching. */
const SAFE = ["shiitakes", "shiitake", "scunthorpe"];

/** Tags are only three characters, so they get their own short list. */
const BAD_TAGS = ["ass", "fag", "kkk", "cum", "dik", "fuk", "sht", "nig", "sex"];

const STEM_PATTERNS = STEMS.map((stem) => new RegExp(stem.split("").map((c) => `${c}+`).join("")));

function undoLeet(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0134578@$]/g, (c) => LEET[c] ?? c);
}

export function isBlocked(text: string): boolean {
  for (const token of undoLeet(text).split(/\s+/)) {
    let word = token.replace(/[^a-z]/g, "");
    if (!word) continue;
    for (const safe of SAFE) word = word.replace(safe, "");
    if (!word) continue;
    if (WORDS.includes(word) || WORDS.includes(word.replace(/s$/, ""))) return true;
    if (STEM_PATTERNS.some((pattern) => pattern.test(word))) return true;
  }
  return false;
}

export function isBadTag(tag: string): boolean {
  return BAD_TAGS.includes(undoLeet(tag)) || isBlocked(tag);
}

/** Links, domains and email addresses are the usual spam payload, so remarks can't carry them. */
export const LINK_PATTERN =
  /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|ph|gg|co|me|xyz|ly|app|dev|link|ru|cn|tk|top|site|online|shop)\b|\S+@\S+\.\S+)/i;

/** Regex sources for the SQL mirror (see supabase/setup.sql). Not used at runtime. */
export const SQL_MIRROR = {
  stems: STEMS.map((stem) => stem.split("").map((c) => `${c}+`).join("")).join("|"),
  words: WORDS,
  badTags: BAD_TAGS,
};
