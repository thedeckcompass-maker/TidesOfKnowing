/**
 * Bulk-import manually written pairings from pending-pairing-inserts/
 * into major-arcana-upright-ordered-pairs-master.md.
 *
 * - Does not generate or rewrite interpretive text.
 * - Structural normalisation only (title line, strip ### / question numbers).
 *
 * Run: node scripts/import-pending-pairing-inserts.mjs
 * Then: node scripts/audit-two-card-corpus.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CORPUS_PATH = path.join(
  ROOT,
  "content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md",
);
const PENDING_DIR = path.join(
  ROOT,
  "content-intake/two-card-corpus/pending-pairing-inserts",
);

const MAJORS = [
  "The Fool",
  "The Magician",
  "The High Priestess",
  "The Empress",
  "The Emperor",
  "The Hierophant",
  "The Lovers",
  "The Chariot",
  "Strength",
  "The Hermit",
  "Wheel of Fortune",
  "Justice",
  "The Hanged Man",
  "Death",
  "Temperance",
  "The Devil",
  "The Tower",
  "The Star",
  "The Moon",
  "The Sun",
  "Judgement",
  "The World",
];

const HEADING_ALIASES = new Map([
  ["THE FOOL", "The Fool"],
  ["FOOL", "The Fool"],
  ["THE MAGICIAN", "The Magician"],
  ["MAGICIAN", "The Magician"],
  ["THE HIGH PRIESTESS", "The High Priestess"],
  ["HIGH PRIESTESS", "The High Priestess"],
  ["THE EMPRESS", "The Empress"],
  ["EMPRESS", "The Empress"],
  ["THE EMPEROR", "The Emperor"],
  ["EMPEROR", "The Emperor"],
  ["THE HIEROPHANT", "The Hierophant"],
  ["HIEROPHANT", "The Hierophant"],
  ["THE LOVERS", "The Lovers"],
  ["LOVERS", "The Lovers"],
  ["THE CHARIOT", "The Chariot"],
  ["CHARIOT", "The Chariot"],
  ["STRENGTH", "Strength"],
  ["THE HERMIT", "The Hermit"],
  ["HERMIT", "The Hermit"],
  ["WHEEL OF FORTUNE", "Wheel of Fortune"],
  ["THE WHEEL OF FORTUNE", "Wheel of Fortune"],
  ["WHEEL", "Wheel of Fortune"],
  ["JUSTICE", "Justice"],
  ["THE HANGED MAN", "The Hanged Man"],
  ["HANGED MAN", "The Hanged Man"],
  ["DEATH", "Death"],
  ["TEMPERANCE", "Temperance"],
  ["THE DEVIL", "The Devil"],
  ["DEVIL", "The Devil"],
  ["THE TOWER", "The Tower"],
  ["TOWER", "The Tower"],
  ["THE STAR", "The Star"],
  ["STAR", "The Star"],
  ["THE MOON", "The Moon"],
  ["MOON", "The Moon"],
  ["THE SUN", "The Sun"],
  ["SUN", "The Sun"],
  ["JUDGEMENT", "Judgement"],
  ["JUDGMENT", "Judgement"],
  ["THE WORLD", "The World"],
  ["WORLD", "The World"],
]);

const PAIRING_SEP = /\s*(?:\+|→|—|–|-)\s*/;
const CHUNK_SEPARATOR = /\r?\n\\---\r?\n/;
const TAIL_PLAIN_SEPARATOR = /\r?\n---\r?\n(?=#\s)/;
const MARKDOWN_TAIL_PAIRING = /\n#\s+[^\n]+[—–-][^\n]+/;

function normaliseHeadingPart(raw) {
  const s = raw.trim().replace(/\s+/g, " ");
  const upper = s.toUpperCase();
  if (HEADING_ALIASES.has(upper)) return HEADING_ALIASES.get(upper);
  if (HEADING_ALIASES.has(s)) return HEADING_ALIASES.get(s);

  const titled = s
    .split(" ")
    .map((w, i) => {
      const lw = w.toLowerCase();
      if (["of", "the", "and"].includes(lw) && i > 0) return lw;
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    })
    .join(" ");

  for (const m of MAJORS) {
    if (m.toLowerCase() === titled.toLowerCase()) return m;
    if (m.toLowerCase() === s.toLowerCase()) return m;
  }
  return null;
}

function pairingKey(card1, card2) {
  return `${card1}|${card2}`;
}

function canonicalOrderedPairs() {
  const pairs = [];
  for (const a of MAJORS) {
    for (const b of MAJORS) {
      if (a !== b) pairs.push([a, b]);
    }
  }
  return pairs;
}

const EXPECTED_KEYS = new Set(
  canonicalOrderedPairs().map(([a, b]) => pairingKey(a, b)),
);

function parsePairingHeadingLine(line) {
  const inner = line.trim().replace(/^#+\s+/, "");
  if (!PAIRING_SEP.test(inner)) return null;
  const parts = inner.split(PAIRING_SEP).map((p) => p.trim());
  if (parts.length !== 2) return null;
  const card1 = normaliseHeadingPart(parts[0]);
  const card2 = normaliseHeadingPart(parts[1]);
  if (!card1 || !card2 || card1 === card2) return null;
  return { card1, card2 };
}

function isCompleteEntryChunk(chunk) {
  return (
    /Dynamic Recap/i.test(chunk) &&
    (/Taste of This Together/i.test(chunk) ||
      /The Taste of This Together/i.test(chunk)) &&
    /The Questions/i.test(chunk) &&
    /Enters|Arrives/i.test(chunk)
  );
}

function expandEntryChunks(corpusText) {
  const chunks = [];
  for (const part of corpusText.split(CHUNK_SEPARATOR)) {
    if (MARKDOWN_TAIL_PAIRING.test(part)) {
      chunks.push(...part.split(TAIL_PLAIN_SEPARATOR));
    } else {
      chunks.push(part);
    }
  }
  return chunks;
}

function parseChunkHeader(chunkText) {
  for (const rawLine of chunkText.split(/\r?\n/)) {
    const inner = rawLine.trim().replace(/^#+\s+/, "");
    if (!PAIRING_SEP.test(inner)) continue;
    const parts = inner.split(PAIRING_SEP).map((p) => p.trim());
    if (parts.length !== 2) continue;
    const card1 = normaliseHeadingPart(parts[0]);
    const card2 = normaliseHeadingPart(parts[1]);
    if (card1 && card2 && card1 !== card2) return { card1, card2, rawLine: rawLine.trim() };
  }
  return null;
}

function buildCompleteKeySet(corpusText) {
  const complete = new Set();
  for (const chunk of expandEntryChunks(corpusText)) {
    if (!isCompleteEntryChunk(chunk)) continue;
    const header = parseChunkHeader(chunk);
    if (header) complete.add(pairingKey(header.card1, header.card2));
  }
  return complete;
}

/** Structural only: pending markdown → master block format. */
function bodyToCorpusBlock(bodyLines) {
  let inQuestions = false;
  const out = [];

  for (const line of bodyLines) {
    const trimmed = line.trimEnd();

    if (/^###\s+The Questions\s*$/i.test(trimmed)) {
      inQuestions = true;
      out.push("The Questions");
      continue;
    }

    if (/^###\s+/.test(trimmed)) {
      inQuestions = false;
      out.push(trimmed.replace(/^###\s+/, ""));
      continue;
    }

    if (/^##\s+/.test(trimmed)) {
      continue;
    }

    if (inQuestions && /^\d+\.\s+/.test(trimmed)) {
      out.push(trimmed.replace(/^\d+\.\s+/, ""));
      continue;
    }

    out.push(line);
  }

  return out.join("\n").trim();
}

function formatCorpusTitle(card1, card2) {
  return `${card1} – ${card2}`;
}

function titleLineMatches(corpusLines, lineIdx, card1, card2) {
  const inner = corpusLines[lineIdx].trim().replace(/^#+\s+/, "");
  if (!PAIRING_SEP.test(inner)) return false;
  const parts = inner.split(PAIRING_SEP).map((p) => p.trim());
  if (parts.length !== 2) return false;
  const a = normaliseHeadingPart(parts[0]);
  const b = normaliseHeadingPart(parts[1]);
  return a === card1 && b === card2;
}

function findChunkCloseIndex(corpusLines, titleLineIdx) {
  let sawQuestions = false;
  for (let i = titleLineIdx + 1; i < corpusLines.length; i++) {
    const t = corpusLines[i].trim();
    if (/^The Questions\s*$/i.test(t) || /^###\s+The Questions/i.test(t)) {
      sawQuestions = true;
    }
    if (sawQuestions && t === "\\---") {
      let end = i + 1;
      while (end < corpusLines.length && corpusLines[end].trim() === "") end++;
      return end;
    }
  }
  return -1;
}

function findInsertIndex(corpusText, card1, card2) {
  const pairs = canonicalOrderedPairs();
  const targetKey = pairingKey(card1, card2);
  const targetIdx = pairs.findIndex(
    ([a, b]) => pairingKey(a, b) === targetKey,
  );
  if (targetIdx < 0) return -1;

  const lines = corpusText.split(/\r?\n/);
  let anchor = null;

  for (let i = targetIdx - 1; i >= 0; i--) {
    const [a, b] = pairs[i];
    for (let li = 0; li < lines.length; li++) {
      if (!titleLineMatches(lines, li, a, b)) continue;
      const close = findChunkCloseIndex(lines, li);
      if (close >= 0) {
        anchor = close;
        break;
      }
    }
    if (anchor !== null) break;
  }

  if (anchor === null) {
    for (let li = 0; li < lines.length; li++) {
      if (!titleLineMatches(lines, li, card1, card2)) continue;
      const close = findChunkCloseIndex(lines, li);
      if (close >= 0) return close;
    }
    return lines.length;
  }

  return anchor;
}

function buildEntryBlock(card1, card2, bodyText) {
  const title = formatCorpusTitle(card1, card2);
  const body = bodyToCorpusBlock(bodyText.split(/\r?\n/));
  return `\n\n${title}\n\n${body}\n\n\n\n\\---\n`;
}

function parsePendingFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  let headingLineIdx = -1;

  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const t = lines[i].trim();
    if (/^##\s+/.test(t) && PAIRING_SEP.test(t.replace(/^#+\s+/, ""))) {
      headingLineIdx = i;
      break;
    }
  }

  if (headingLineIdx < 0) {
    return { error: "missing_or_invalid_h2_heading" };
  }

  const heading = parsePairingHeadingLine(lines[headingLineIdx]);
  if (!heading) {
    return { error: "invalid_pairing_heading" };
  }

  const bodyLines = lines.slice(headingLineIdx + 1);
  return { ...heading, bodyLines, bodyText: bodyLines.join("\n") };
}

function listPendingFiles() {
  if (!fs.existsSync(PENDING_DIR)) return [];
  return fs
    .readdirSync(PENDING_DIR)
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
    .map((f) => path.join(PENDING_DIR, f))
    .sort();
}

// --- main ---
if (!fs.existsSync(PENDING_DIR)) {
  fs.mkdirSync(PENDING_DIR, { recursive: true });
}

const pendingFiles = listPendingFiles();
const report = {
  pendingFilesFound: pendingFiles.length,
  inserted: 0,
  skipped: [],
  insertedPairings: [],
};

let corpusText = fs.readFileSync(CORPUS_PATH, "utf8");
let completeKeys = buildCompleteKeySet(corpusText);

const toInsert = [];

for (const filePath of pendingFiles) {
  const filename = path.basename(filePath);
  const parsed = parsePendingFile(filePath);

  if (parsed.error) {
    report.skipped.push({ filename, reason: parsed.error });
    continue;
  }

  const { card1, card2, bodyLines } = parsed;
  const key = pairingKey(card1, card2);

  if (!EXPECTED_KEYS.has(key)) {
    report.skipped.push({
      filename,
      reason: "not_in_expected_462_ordered_set",
      pairing: `${card1} → ${card2}`,
    });
    continue;
  }

  if (completeKeys.has(key)) {
    report.skipped.push({
      filename,
      reason: "already_complete_in_master",
      pairing: `${card1} → ${card2}`,
    });
    continue;
  }

  toInsert.push({ filename, card1, card2, bodyLines, key });
}

const pairOrder = canonicalOrderedPairs();
const orderIndex = new Map(
  pairOrder.map(([a, b], i) => [pairingKey(a, b), i]),
);
toInsert.sort(
  (a, b) => orderIndex.get(a.key) - orderIndex.get(b.key),
);

for (const item of toInsert) {
  const insertAt = findInsertIndex(corpusText, item.card1, item.card2);
  if (insertAt < 0) {
    report.skipped.push({
      filename: item.filename,
      reason: "could_not_find_insert_anchor",
      pairing: `${item.card1} → ${item.card2}`,
    });
    continue;
  }

  const lines = corpusText.split(/\r?\n/);
  const before = lines.slice(0, insertAt).join("\n");
  const after = lines.slice(insertAt).join("\n");
  const block = buildEntryBlock(item.card1, item.card2, item.bodyLines.join("\n"));
  corpusText = before + block + after;

  completeKeys.add(item.key);
  report.inserted += 1;
  report.insertedPairings.push(`${item.card1} → ${item.card2}`);
}

if (report.inserted > 0) {
  fs.writeFileSync(CORPUS_PATH, corpusText, "utf8");
}

console.log(JSON.stringify(report, null, 2));
