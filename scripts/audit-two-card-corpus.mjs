/**
 * Audit major-arcana-upright-ordered-pairs-master.md
 * Writes: docs/two-card-system/missing-pairings.json
 *         docs/two-card-system/MISSING-PAIRINGS-CHECKLIST.md
 *         docs/two-card-system/COMPLETE-PAIRINGS-LIST.md
 * Run: node scripts/audit-two-card-corpus.mjs
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
const OUT_DIR = path.join(ROOT, "docs/two-card-system");
const JSON_PATH = path.join(OUT_DIR, "missing-pairings.json");
const CHECKLIST_PATH = path.join(OUT_DIR, "MISSING-PAIRINGS-CHECKLIST.md");
const COMPLETE_LIST_PATH = path.join(OUT_DIR, "COMPLETE-PAIRINGS-LIST.md");

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

const MAJOR_SET = new Set(MAJORS);

/** @type {Map<string, string>} */
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

const PAIRING_SEP = /\s*(?:→|—|–|-)\s*/;
const CHUNK_SEPARATOR = /\r?\n\\---\r?\n/;
const TAIL_PLAIN_SEPARATOR = /\r?\n---\r?\n(?=#\s)/;
const MARKDOWN_TAIL_PAIRING = /\n#\s+[^\n]+[—–-][^\n]+/;

const SKIP_SUBSTRINGS = [
  "TEMPLATE",
  "template for",
  "paired-pairing",
  "Fortune — The Hanged Man: Expanded",
  "A→B immediately",
];

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

function classifyHeadingStyle(rawLine, innerLine) {
  const trimmed = rawLine.trim();
  if (trimmed.startsWith("##")) return "markdown_h2";
  if (trimmed.startsWith("#")) return "markdown_h1";
  if (innerLine === innerLine.toUpperCase() && /THE |STRENGTH|JUSTICE|DEATH|TEMPERANCE|JUDGEMENT|WHEEL/.test(innerLine))
    return "all_caps";
  return "title_case";
}

function separatorKind(innerLine) {
  if (innerLine.includes("→")) return "arrow";
  if (innerLine.includes("—")) return "em_dash";
  if (innerLine.includes("–")) return "en_dash";
  if (/\s-\s/.test(innerLine)) return "hyphen";
  return "unknown";
}

function looksLikePairingCandidate(line) {
  const inner = line.trim().replace(/^#+\s+/, "");
  if (inner.length > 90 || inner.length < 5) return false;
  if (SKIP_SUBSTRINGS.some((s) => inner.includes(s))) return false;
  if (/[?.!]/.test(inner) && !inner.includes("→")) return false;
  if (!PAIRING_SEP.test(inner)) return false;
  const parts = inner.split(PAIRING_SEP).map((p) => p.trim());
  if (parts.length !== 2 || parts[0].length > 40 || parts[1].length > 40) return false;
  const card1 = normaliseHeadingPart(parts[0]);
  const card2 = normaliseHeadingPart(parts[1]);
  return Boolean(card1 && card2 && card1 !== card2);
}

function isCompleteEntryChunk(chunk) {
  return (
    /Dynamic Recap/i.test(chunk) &&
    (/Taste of This Together/i.test(chunk) || /The Taste of This Together/i.test(chunk)) &&
    /The Questions/i.test(chunk) &&
    /Enters|Arrives/i.test(chunk)
  );
}

/** Split master file into entry-sized chunks (`\---` plus markdown-tail `---` before `#` headings). */
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

function parseChunkPairingHeader(chunkText) {
  const chunkLines = chunkText.split(/\r?\n/);
  for (let i = 0; i < chunkLines.length; i++) {
    const rawLine = chunkLines[i];
    const result = parsePairingLine(rawLine, i + 1);
    if (result.type === "ok") return { ...result, chunkLine: i + 1 };
  }
  return null;
}

function lineNumberAtIndex(corpusText, index) {
  if (index <= 0) return 1;
  return corpusText.slice(0, index).split(/\r?\n/).length;
}

function parsePairingLine(rawLine, lineNum) {
  const inner = rawLine.trim().replace(/^#+\s+/, "");
  if (!looksLikePairingCandidate(rawLine)) return { type: "skip" };

  const parts = inner.split(PAIRING_SEP).map((p) => p.trim());
  if (parts.length !== 2) {
    return {
      type: "uncertain",
      line: lineNum,
      raw: rawLine.trim(),
      reason: parts.length > 2 ? "multiple_separators" : "no_valid_split",
    };
  }

  const [left, right] = parts;
  if (left.length > 40 || right.length > 40) {
    return { type: "uncertain", line: lineNum, raw: rawLine.trim(), reason: "segment_too_long" };
  }

  const card1 = normaliseHeadingPart(left);
  const card2 = normaliseHeadingPart(right);

  if (!card1 || !card2) {
    return {
      type: "uncertain",
      line: lineNum,
      raw: rawLine.trim(),
      reason: "unrecognised_card_name",
      left,
      right,
      card1: card1 || null,
      card2: card2 || null,
    };
  }

  if (card1 === card2) {
    return {
      type: "self",
      line: lineNum,
      raw: rawLine.trim(),
      card1,
      card2,
    };
  }

  return {
    type: "ok",
    line: lineNum,
    raw: rawLine.trim(),
    inner,
    card1,
    card2,
    leftRaw: left,
    rightRaw: right,
    style: classifyHeadingStyle(rawLine, inner),
    sep: separatorKind(inner),
    markdown: /^#+\s+/.test(rawLine.trim()),
  };
}

function pairingKey(card1, card2) {
  return `${card1}|${card2}`;
}

function formatPairLabel(card1, card2) {
  return `${card1} → ${card2}`;
}

// --- Load corpus ---
const text = fs.readFileSync(CORPUS_PATH, "utf8");
const lines = text.split(/\r?\n/);

const detections = [];
const uncertain = [];
const selfPairings = [];
const namingVariants = new Map(); // canonical -> Set of raw variants

for (let i = 0; i < lines.length; i++) {
  const result = parsePairingLine(lines[i], i + 1);
  if (result.type === "ok") {
    detections.push(result);
    for (const [raw, canon] of [
      [result.leftRaw, result.card1],
      [result.rightRaw, result.card2],
    ]) {
      if (raw !== canon) {
        if (!namingVariants.has(canon)) namingVariants.set(canon, new Set());
        namingVariants.get(canon).add(raw);
      }
    }
  } else if (result.type === "uncertain") {
    uncertain.push(result);
  } else if (result.type === "self") {
    selfPairings.push(result);
  }
}

// Expected set
const expectedKeys = new Set();
for (const a of MAJORS) {
  for (const b of MAJORS) {
    if (a !== b) expectedKeys.add(pairingKey(a, b));
  }
}

/** @type {Map<string, { line: number, raw: string, style: string, sep: string }[]>} */
const headingByKey = new Map();
for (const d of detections) {
  const key = pairingKey(d.card1, d.card2);
  if (!headingByKey.has(key)) headingByKey.set(key, []);
  headingByKey.get(key).push({
    line: d.line,
    raw: d.raw,
    style: d.style,
    sep: d.sep,
  });
}

// --- Chunk-based completion (authoritative for missing count) ---
const entryChunks = expandEntryChunks(text);
let chunkOffset = 0;
/** @type {Map<string, { line: number, raw: string, style: string, sep: string, detectionMethod: string }[]>} */
const completeByKey = new Map();

for (const chunk of entryChunks) {
  const chunkStart = text.indexOf(chunk, chunkOffset);
  chunkOffset = chunkStart >= 0 ? chunkStart + chunk.length : chunkOffset + chunk.length;
  const startLine = lineNumberAtIndex(text, chunkStart >= 0 ? chunkStart : 0);

  if (!isCompleteEntryChunk(chunk)) continue;
  const header = parseChunkPairingHeader(chunk);
  if (!header) continue;

  const key = pairingKey(header.card1, header.card2);
  const occ = {
    line: startLine + header.chunkLine - 1,
    raw: header.raw,
    style: header.style,
    sep: header.sep,
    detectionMethod: "chunk_template",
  };
  if (!completeByKey.has(key)) completeByKey.set(key, []);
  completeByKey.get(key).push(occ);
}

const duplicates = [];
for (const [key, occurrences] of completeByKey) {
  if (occurrences.length > 1) {
    const [a, b] = key.split("|");
    duplicates.push({
      firstCard: a,
      secondCard: b,
      label: formatPairLabel(a, b),
      occurrences,
    });
  }
}

const uniqueKeys = new Set(completeByKey.keys());
const missingKeys = [...expectedKeys].filter((k) => !uniqueKeys.has(k));

const headingOnlyKeys = [...headingByKey.keys()].filter((k) => !uniqueKeys.has(k));
const completeWithoutHeadingKeys = [...uniqueKeys].filter((k) => !headingByKey.has(k));

const missingByFirstCard = {};
for (const first of MAJORS) {
  missingByFirstCard[first] = [];
  for (const second of MAJORS) {
    if (first === second) continue;
    const key = pairingKey(first, second);
    if (!uniqueKeys.has(key)) {
      missingByFirstCard[first].push({
        firstCard: first,
        secondCard: second,
        label: formatPairLabel(first, second),
      });
    }
  }
}

const coverageByFirstCard = Object.fromEntries(
  MAJORS.map((m) => [m, 21 - missingByFirstCard[m].length]),
);

const completelyMissingFirstCards = MAJORS.filter((m) => coverageByFirstCard[m] === 0);

function completionPriority(first) {
  const found = coverageByFirstCard[first];
  const missing = 21 - found;
  if (found === 0) return { tier: 1, missing, found, label: "complete_block_missing" };
  if (missing >= 15) return { tier: 2, missing, found, label: "mostly_incomplete" };
  if (missing >= 5) return { tier: 3, missing, found, label: "moderately_incomplete" };
  if (missing >= 1) return { tier: 4, missing, found, label: "few_gaps" };
  return { tier: 5, missing: 0, found, label: "complete" };
}

const PILLAR_FIRST_CARDS = ["The Empress", "The Emperor", "The Hierophant"];
const pillarSecondCardGaps = [];
for (const first of MAJORS) {
  if (first === "The Fool") continue;
  for (const second of PILLAR_FIRST_CARDS) {
    const key = pairingKey(first, second);
    if (!uniqueKeys.has(key)) {
      pillarSecondCardGaps.push(formatPairLabel(first, second));
    }
  }
}

const lateArcFirstCards = [
  "The World",
  "The Moon",
  "The Sun",
  "The Star",
  "Judgement",
  "Temperance",
  "The Devil",
  "The Tower",
  "The Hermit",
  "Justice",
  "Wheel of Fortune",
];
const lateArcGaps = [];
for (const first of lateArcFirstCards) {
  for (const p of missingByFirstCard[first]) {
    lateArcGaps.push(p.label);
  }
}

/** @type {{ tier: number, label: string, firstCard: string | null, missing: number, found?: number, missingPairings: string[] }[]} */
const recommendedCompletionOrder = [];

for (const first of PILLAR_FIRST_CARDS) {
  const missing = missingByFirstCard[first];
  if (missing.length === 0) continue;
  recommendedCompletionOrder.push({
    tier: recommendedCompletionOrder.length + 1,
    label: "complete_first_card_block",
    firstCard: first,
    missing: missing.length,
    found: coverageByFirstCard[first],
    missingPairings: missing.map((p) => p.label),
  });
}

if (pillarSecondCardGaps.length > 0) {
  recommendedCompletionOrder.push({
    tier: recommendedCompletionOrder.length + 1,
    label: "fill_empress_emperor_hierophant_as_second_card",
    firstCard: null,
    missing: pillarSecondCardGaps.length,
    missingPairings: pillarSecondCardGaps,
  });
}

const lateArcUnique = [...new Set(lateArcGaps)];
if (lateArcUnique.length > 0) {
  recommendedCompletionOrder.push({
    tier: recommendedCompletionOrder.length + 1,
    label: "complete_late_arc_gaps",
    firstCard: null,
    missing: lateArcUnique.length,
    missingPairings: lateArcUnique,
  });
}

const otherGaps = missingKeys
  .map((k) => {
    const [a, b] = k.split("|");
    return formatPairLabel(a, b);
  })
  .filter((label) => !pillarSecondCardGaps.includes(label) && !lateArcUnique.includes(label));
if (otherGaps.length > 0) {
  recommendedCompletionOrder.push({
    tier: recommendedCompletionOrder.length + 1,
    label: "remaining_gaps",
    firstCard: null,
    missing: otherGaps.length,
    missingPairings: otherGaps,
  });
}

if (duplicates.length > 0) {
  recommendedCompletionOrder.push({
    tier: recommendedCompletionOrder.length + 1,
    label: "duplicate_cleanup",
    firstCard: null,
    missing: duplicates.length,
    found: uniqueKeys.size,
    missingPairings: duplicates.map((d) => d.label),
  });
}

// Tail "## The Sun Enters" when first card ≠ The Sun (markdown batch ~line 30206+)
const tailHeadingDefects = [];
const tailStartIdx = lines.findIndex((l) => l.trim() === "# The Star — The Moon");
if (tailStartIdx >= 0) {
  for (let i = tailStartIdx; i < lines.length; i++) {
    const titleResult = parsePairingLine(lines[i], i + 1);
    if (titleResult.type !== "ok" || !lines[i].trim().startsWith("#")) continue;

    for (let j = i + 1; j < lines.length; j++) {
      const trimmed = lines[j].trim();
      if (trimmed === "---") break;
      if (trimmed.startsWith("# ") && parsePairingLine(lines[j], j + 1).type === "ok") break;

      const entersMatch = trimmed.match(/^##\s+The\s+(.+?)\s+Enters\s*$/);
      if (!entersMatch) continue;

      const entersCard =
        normaliseHeadingPart(`The ${entersMatch[1]}`) || normaliseHeadingPart(entersMatch[1]);
      if (entersCard === "The Sun" && titleResult.card1 !== "The Sun") {
        tailHeadingDefects.push({
          firstCard: titleResult.card1,
          secondCard: titleResult.card2,
          label: formatPairLabel(titleResult.card1, titleResult.card2),
          pairingTitleLine: i + 1,
          defectLine: j + 1,
          defectHeading: trimmed,
        });
      }
      break;
    }
  }
}

if (tailHeadingDefects.length > 0) {
  recommendedCompletionOrder.push({
    tier: recommendedCompletionOrder.length + 1,
    label: "fix_tail_sun_enters_heading_defects",
    firstCard: null,
    missing: tailHeadingDefects.length,
    missingPairings: tailHeadingDefects.map((d) => d.label),
  });
}

const headingStyleCounts = {};
for (const d of detections) {
  const k = `${d.style}/${d.sep}`;
  headingStyleCounts[k] = (headingStyleCounts[k] || 0) + 1;
}

const inconsistentNaming = [];
for (const [canon, raws] of namingVariants) {
  if (raws.size > 0) {
    inconsistentNaming.push({
      canonical: canon,
      variants: [...raws].sort(),
    });
  }
}
// Flag known cross-variant families in corpus (even if normalised to same)
const knownVariantFamilies = [
  {
    canonical: "Wheel of Fortune",
    watchFor: ["Wheel", "WHEEL OF FORTUNE", "THE WHEEL OF FORTUNE", "Wheel of Fortune"],
  },
  {
    canonical: "Judgement",
    watchFor: ["Judgment", "JUDGMENT", "JUDGEMENT"],
  },
  {
    canonical: "The Hanged Man",
    watchFor: ["Hanged Man", "HANGED MAN", "THE HANGED MAN", "The Hanged Man"],
  },
];
for (const fam of knownVariantFamilies) {
  const foundVariants = new Set();
  for (const d of detections) {
    if (d.card1 === fam.canonical && fam.watchFor.some((w) => d.leftRaw.toUpperCase() === w.toUpperCase() || d.leftRaw === w))
      foundVariants.add(d.leftRaw);
    if (d.card2 === fam.canonical && fam.watchFor.some((w) => d.rightRaw.toUpperCase() === w.toUpperCase() || d.rightRaw === w))
      foundVariants.add(d.rightRaw);
  }
  if (foundVariants.size > 1) {
    const existing = inconsistentNaming.find((x) => x.canonical === fam.canonical);
    if (existing) {
      for (const v of foundVariants) existing.variants.push(v);
      existing.variants = [...new Set(existing.variants)].sort();
    } else if (foundVariants.size > 0) {
      inconsistentNaming.push({
        canonical: fam.canonical,
        variants: [...foundVariants].sort(),
        note: "multiple_raw_forms_in_headings",
      });
    }
  }
}

const completeChunkCount = [...completeByKey.values()].reduce((n, occ) => n + occ.length, 0);

const report = {
  generatedAt: new Date().toISOString(),
  sourceFile: "content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md",
  expectedCount: 462,
  countingMethod:
    "chunk_template (split on \\---, plus plain --- before markdown # pairing headings in tail)",
  completeCount: uniqueKeys.size,
  completeChunkCount,
  missingCount: missingKeys.length,
  detectedHeadingCount: detections.length,
  detectedHeadingUniqueCount: headingByKey.size,
  duplicatePairingCount: duplicates.length,
  invalidSelfPairingCount: selfPairings.length,
  uncertainHeadingCount: uncertain.length,
  headingOnlyIncompleteCount: headingOnlyKeys.length,
  completeWithoutHeadingLineCount: completeWithoutHeadingKeys.length,
  tailHeadingDefectCount: tailHeadingDefects.length,
  coverageByFirstCard,
  completelyMissingFirstCards,
  tailHeadingDefects,
  duplicates: duplicates.map((d) => ({
    firstCard: d.firstCard,
    secondCard: d.secondCard,
    label: d.label,
    occurrences: d.occurrences,
  })),
  malformedHeadings: uncertain,
  invalidSelfPairings: selfPairings.map((s) => ({
    line: s.line,
    raw: s.raw,
    label: formatPairLabel(s.card1, s.card2),
  })),
  missingByFirstCard: Object.fromEntries(
    MAJORS.map((m) => [
      m,
      missingByFirstCard[m].map((p) => ({
        firstCard: p.firstCard,
        secondCard: p.secondCard,
        label: p.label,
      })),
    ]),
  ),
  headingStyleCounts,
  inconsistentNaming,
  recommendedCompletionOrder,
};

// --- Write JSON ---
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(JSON_PATH, JSON.stringify(report, null, 2), "utf8");

// --- Write checklist markdown ---
let md = `# Missing Pairings Checklist

**Source:** \`content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md\`  
**Generated:** ${report.generatedAt}  
**Audit script:** \`node scripts/audit-two-card-corpus.mjs\`

Scope: Major Arcana · upright only · ordered pairs · self-pairs excluded · expected **462** pairings (22 × 21).

---

## 1. Summary

| Metric | Count |
|--------|------:|
| Expected pairings | ${report.expectedCount} |
| Complete pairings (chunk + template) | **${report.completeCount}** |
| Missing pairings | **${report.missingCount}** |
| Complete chunks (incl. duplicates) | ${report.completeChunkCount} |
| Duplicate pairings (extra entries) | **${report.duplicatePairingCount}** |
| Tail \`## The Sun Enters\` defects | **${report.tailHeadingDefectCount}** |
| Invalid self-pairings | **${report.invalidSelfPairingCount}** |
| Malformed / uncertain headings | **${report.uncertainHeadingCount}** |
| Pairing headings scanned (line pass) | ${report.detectedHeadingCount} (${report.detectedHeadingUniqueCount} unique) |

_Counting method: ${report.countingMethod}. See \`docs/two-card-system/MANUAL-COMPLETION-PLAN.md\` and \`major-arcana-upright-completion-audit.md\`._

**Completely missing first-card blocks (0/21):** ${
  completelyMissingFirstCards.length
    ? completelyMissingFirstCards.map((c) => `**${c}**`).join(", ")
    : "_none_"
}

---

## 2. Missing pairings by first card

`;

for (const first of MAJORS) {
  const missing = missingByFirstCard[first];
  const found = coverageByFirstCard[first];
  md += `## ${first}\n\n`;
  md += `_Found ${found}/21 · Missing ${missing.length}/21_\n\n`;
  if (missing.length === 0) {
    md += `_No missing pairings for this first card._\n\n`;
    continue;
  }
  for (const p of missing) {
    md += `- [ ] ${p.label}\n`;
  }
  md += "\n";
}

md += `---

## 3. Duplicates

`;

if (duplicates.length === 0) {
  md += `_No duplicate ordered pairings detected._\n\n`;
} else {
  for (const d of duplicates) {
    md += `### ${d.label}\n\n`;
    for (const occ of d.occurrences) {
      md += `- Line **${occ.line}**: \`${occ.raw}\` (${occ.style}, ${occ.sep})\n`;
    }
    md += "\n";
  }
}

md += `---

## 4. Malformed / uncertain headings

`;

if (uncertain.length === 0) {
  md += `_No uncertain pairing headings detected._\n\n`;
} else {
  for (const u of uncertain) {
    md += `- Line **${u.line}** (${u.reason}): \`${u.raw}\``;
    if (u.left || u.right) md += ` — left: \`${u.left}\`, right: \`${u.right}\``;
    md += "\n";
  }
  md += "\n";
}

md += `---

## 5. Inconsistent naming in headings

`;

if (inconsistentNaming.length === 0) {
  md += `_No raw heading variants differed from canonical names after normalisation._\n\n`;
} else {
  for (const item of inconsistentNaming) {
    md += `### ${item.canonical}\n\n`;
    for (const v of item.variants) {
      md += `- \`${v}\`\n`;
    }
    if (item.note) md += `\n_${item.note}_\n`;
    md += "\n";
  }
}

md += `### Names to watch (canonical standard)

| Canonical | Avoid or normalise from |
|-----------|-------------------------|
| Wheel of Fortune | Wheel, WHEEL, The Wheel of Fortune (if ambiguous) |
| Judgement | Judgment |
| The Hanged Man | Hanged Man (acceptable if consistent) |
| Strength | The Strength |
| Death | The Death |
| Justice | The Justice |
| Temperance | The Temperance |

---

## 6. Recommended manual completion order

Aligned with \`docs/two-card-system/MANUAL-COMPLETION-PLAN.md\`. Leigh writes all missing interpretive meanings manually; Cursor audits only.

1. Complete **The Empress** as first card (21 pairings).
2. Complete **The Emperor** as first card (21 pairings).
3. Complete **The Hierophant** as first card (21 pairings).
4. Fill gaps where Empress, Emperor, or Hierophant appear as **second** card (Fool block already complete).
5. Complete **late arc** first-card gaps.
6. **Merge duplicates** (§3).
7. **Fix tail** \`## The Sun Enters\` defects when first card ≠ The Sun — \`major-arcana-upright-completion-audit.md\` §5.

Re-run \`node scripts/audit-two-card-corpus.mjs\` until complete = 462, missing = 0, duplicates = 0.

### Ordered work list

`;

const tierLabels = {
  complete_first_card_block: "First-card block",
  fill_empress_emperor_hierophant_as_second_card: "E / E / H as second card",
  complete_late_arc_gaps: "Late arc gaps",
  remaining_gaps: "Remaining gaps",
  duplicate_cleanup: "Duplicate cleanup",
  fix_tail_sun_enters_heading_defects: "Tail Sun Enters heading fixes",
};

for (const item of recommendedCompletionOrder) {
  const title = tierLabels[item.label] || item.label;
  if (item.firstCard) {
    md += `\n**Step ${item.tier} — ${title}: ${item.firstCard}** (${item.found}/21 found, ${item.missing} missing)\n\n`;
  } else {
    md += `\n**Step ${item.tier} — ${title}** (${item.missing} items)\n\n`;
  }
  for (const label of item.missingPairings) {
    md += `- [ ] ${label}\n`;
  }
}

if (tailHeadingDefects.length > 0) {
  md += `\n### Tail heading defect detail\n\n`;
  for (const d of tailHeadingDefects) {
    md += `- **${d.label}** — pairing title ~line ${d.pairingTitleLine}, defect ~line ${d.defectLine}: \`${d.defectHeading}\`\n`;
  }
  md += "\n";
}

md += `
---

## 7. Heading format inventory

Detected separator/style combinations:

`;

for (const [k, v] of Object.entries(headingStyleCounts).sort()) {
  md += `- \`${k}\`: ${v}\n`;
}

md += `
---

## 8. Re-run audit

\`\`\`bash
node scripts/audit-two-card-corpus.mjs
\`\`\`

Machine-readable output: \`docs/two-card-system/missing-pairings.json\`
`;

fs.writeFileSync(CHECKLIST_PATH, md, "utf8");

// --- Complete pairings list (human-readable index) ---
let completeMd = `# Complete Pairings List

**Generated:** ${report.generatedAt}  
**Source:** \`${report.sourceFile}\`  
**Audit:** \`node scripts/audit-two-card-corpus.mjs\`  
**Counting:** ${report.countingMethod}

| Metric | Count |
|--------|------:|
| **Complete pairings** | **${report.completeCount}** |
| Expected ordered slots | ${report.expectedCount} |
| Missing pairings | ${report.missingCount} |

Complete entries only (chunk + template markers). Duplicates in the corpus count once here.

---

`;

for (const first of MAJORS) {
  const found = coverageByFirstCard[first];
  const completeForFirst = [];
  for (const second of MAJORS) {
    if (first === second) continue;
    const key = pairingKey(first, second);
    if (uniqueKeys.has(key)) {
      completeForFirst.push(formatPairLabel(first, second));
    }
  }
  completeMd += `## ${first} (${found}/21)\n\n`;
  if (completeForFirst.length === 0) {
    completeMd += `_No complete pairings for this first card._\n\n`;
    continue;
  }
  for (const label of completeForFirst) {
    completeMd += `- [x] ${label}\n`;
  }
  completeMd += "\n";
}

completeMd += `---

Regenerate: \`node scripts/audit-two-card-corpus.mjs\`
`;

fs.writeFileSync(COMPLETE_LIST_PATH, completeMd, "utf8");

// Console summary
console.log(
  JSON.stringify(
    {
      expectedCount: report.expectedCount,
      completeCount: report.completeCount,
      missingCount: report.missingCount,
      duplicatePairingCount: report.duplicatePairingCount,
      tailHeadingDefectCount: report.tailHeadingDefectCount,
      invalidSelfPairingCount: report.invalidSelfPairingCount,
      uncertainHeadingCount: report.uncertainHeadingCount,
      detectedHeadingUniqueCount: report.detectedHeadingUniqueCount,
      completelyMissingFirstCards: report.completelyMissingFirstCards,
      checklist: CHECKLIST_PATH,
      completeList: COMPLETE_LIST_PATH,
      json: JSON_PATH,
    },
    null,
    2,
  ),
);
