/**
 * One-off generator: content-intake/tarot/tarot-cards-master.md → src/data/tarotCardsNew.js
 * Run: node scripts/build-tarotCardsNew.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const mdPath = path.join(root, "content-intake", "tarot", "tarot-cards-master.md");
const outPath = path.join(root, "src", "data", "tarotCardsNew.js");

const TEXT_KEYS_AFTER_LISTS = [
  "essenceSentence",
  "coreMeaning",
  "arrivalBehaviour",
  "responseBehaviour",
  "relationalEffect",
  "interactionStyle",
];

const REL_PROFILE_KEYS = [
  "archetypeWeight",
  "element",
  "numericalFunction",
  "movementUpright",
  "movementReversed",
];

function parseMetadata(lines, start, untilIdx) {
  const meta = {};
  for (let i = start; i < untilIdx; i++) {
    const line = lines[i];
    if (line.trim() === "" || line.trim() === "---") continue;
    const m = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return meta;
}

function parseBulletList(lines, startIdx) {
  const items = [];
  let i = startIdx;
  while (i < lines.length) {
    const line = lines[i];
    if (line.match(/^-\s+/)) {
      items.push(line.replace(/^-\s+/, ""));
      i++;
      continue;
    }
    break;
  }
  return { items, nextIdx: i };
}

function parseFace(lines, headerIdx, stopHeader) {
  const out = {};
  let i = headerIdx + 1;
  while (i < lines.length && lines[i].trim() !== stopHeader) {
    if (lines[i].trim() === "" || lines[i].trim() === "---") {
      i++;
      continue;
    }
    const ln = lines[i];
    if (ln.match(/^keywords:\s*$/)) {
      const { items, nextIdx } = parseBulletList(lines, i + 1);
      out.keywords = items;
      i = nextIdx;
      continue;
    }
    if (ln.match(/^extendedKeywords:\s*$/)) {
      const { items, nextIdx } = parseBulletList(lines, i + 1);
      out.extendedKeywords = items;
      i = nextIdx;
      continue;
    }
    const km = ln.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (km && TEXT_KEYS_AFTER_LISTS.includes(km[1])) {
      const key = km[1];
      const following = TEXT_KEYS_AFTER_LISTS.slice(TEXT_KEYS_AFTER_LISTS.indexOf(key) + 1);
      const buf = [];
      if (km[2] !== "") buf.push(km[2]);
      let j = i + 1;
      while (j < lines.length) {
        const L = lines[j];
        const t = L.trim();
        if (t === stopHeader) break;
        if (t === "---") break;
        if (t === "### Reversed" || t === "### Relational Profile" || t === "### Combination Logic") break;
        let hitNext = false;
        for (const fk of following) {
          if (new RegExp(`^${fk}:`).test(L)) {
            hitNext = true;
            break;
          }
        }
        if (hitNext) break;
        buf.push(L);
        j++;
      }
      out[key] = buf.join("\n").trimEnd();
      i = j;
      continue;
    }
    i++;
  }
  return { block: out, nextIdx: i };
}

function parseRelationalProfile(lines, startIdx) {
  let i = startIdx;
  if (lines[i]?.trim() !== "### Relational Profile") throw new Error("Expected ### Relational Profile");
  i++;
  const out = {};
  while (i < lines.length && lines[i].trim() !== "### Combination Logic") {
    const ln = lines[i];
    if (ln.trim() === "" || ln.trim() === "---") {
      i++;
      continue;
    }
    const m = ln.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[1];
    const rest = m[2];
    if (!REL_PROFILE_KEYS.includes(key)) {
      i++;
      continue;
    }
    if (rest !== "") {
      out[key] = rest.trim();
      i++;
      continue;
    }
    const following = REL_PROFILE_KEYS.slice(REL_PROFILE_KEYS.indexOf(key) + 1);
    const buf = [];
    let j = i + 1;
    while (j < lines.length) {
      const L = lines[j];
      const t = L.trim();
      if (t === "### Combination Logic") break;
      if (t === "---") break;
      let hitNext = false;
      for (const fk of following) {
        if (new RegExp(`^${fk}:`).test(L)) {
          hitNext = true;
          break;
        }
      }
      if (hitNext) break;
      buf.push(L);
      j++;
    }
    out[key] = buf.join("\n").trimEnd();
    i = j;
  }
  return { profile: out, idx: i };
}

function parsePairingTendenciesBlock(raw) {
  const text = raw.trim();
  if (!text) {
    return {
      majorArcana: "",
      courtCards: "",
      sameSuit: "",
      conflictingSuit: "",
    };
  }
  if (/^-\s*With\s+Major\s+Arcana:/im.test(text)) {
    const out = { majorArcana: "", courtCards: "", sameSuit: "", conflictingSuit: "" };
    for (const line of text.split(/\n/)) {
      let m = line.match(/^-\s*With\s+Major\s+Arcana:\s*(.*)$/i);
      if (m) {
        out.majorArcana = m[1].trim();
        continue;
      }
      m = line.match(/^-\s*With\s+Court\s+Cards:\s*(.*)$/i);
      if (m) {
        out.courtCards = m[1].trim();
        continue;
      }
      m = line.match(/^-\s*With\s+same\s+suit:\s*(.*)$/i);
      if (m) {
        out.sameSuit = m[1].trim();
        continue;
      }
      m = line.match(/^-\s*With\s+conflicting\s+suit:\s*(.*)$/i);
      if (m) {
        out.conflictingSuit = m[1].trim();
        continue;
      }
    }
    return out;
  }
  const labelDefs = [
    { re: /^Major Arcana:\s*(.*)$/i, key: "majorArcana" },
    { re: /^Court Cards:\s*(.*)$/i, key: "courtCards" },
    { re: /^same suit:\s*(.*)$/i, key: "sameSuit" },
    { re: /^conflicting suit:\s*(.*)$/i, key: "conflictingSuit" },
  ];
  const out = { majorArcana: "", courtCards: "", sameSuit: "", conflictingSuit: "" };
  const lines = text.split(/\n/);
  let current = null;
  let buf = [];
  function flush() {
    if (current) out[current] = buf.join("\n").trimEnd();
    buf = [];
  }
  for (const line of lines) {
    let matched = false;
    for (const { re, key } of labelDefs) {
      const m = line.match(re);
      if (m) {
        flush();
        current = key;
        buf = m[1] ? [m[1].replace(/\s+$/, "")] : [];
        matched = true;
        break;
      }
    }
    if (matched) continue;
    if (current && line.trim() !== "") buf.push(line);
  }
  flush();
  return out;
}

function parseCombinationLogic(lines, startIdx) {
  let i = startIdx;
  if (lines[i]?.trim() !== "### Combination Logic") throw new Error("Expected ### Combination Logic");
  i++;
  const combo = {
    whenFirst: "",
    whenSecond: "",
    pairingTendencies: {
      majorArcana: "",
      courtCards: "",
      sameSuit: "",
      conflictingSuit: "",
    },
    specificPairings: [],
  };
  while (i < lines.length) {
    const ln = lines[i];
    if (ln.trim() === "---") break;
    if (ln.trim() === "") {
      i++;
      continue;
    }
    if (ln.match(/^whenFirst:\s*/)) {
      const buf = [];
      const m = ln.match(/^whenFirst:\s*(.*)$/);
      if (m && m[1] !== "") buf.push(m[1]);
      i++;
      while (i < lines.length) {
        const L = lines[i];
        if (L.trim() === "---") break;
        if (/^whenSecond:/.test(L)) break;
        if (/^pairingTendencies:/.test(L)) break;
        buf.push(L);
        i++;
      }
      combo.whenFirst = buf.join("\n").trimEnd();
      continue;
    }
    if (ln.match(/^whenSecond:\s*/)) {
      const buf = [];
      const m = ln.match(/^whenSecond:\s*(.*)$/);
      if (m && m[1] !== "") buf.push(m[1]);
      i++;
      while (i < lines.length) {
        const L = lines[i];
        if (L.trim() === "---") break;
        if (/^pairingTendencies:/.test(L)) break;
        if (/^specificPairings:/.test(L)) break;
        buf.push(L);
        i++;
      }
      combo.whenSecond = buf.join("\n").trimEnd();
      continue;
    }
    if (ln.match(/^pairingTendencies:\s*$/)) {
      i++;
      const buf = [];
      while (i < lines.length) {
        const L = lines[i];
        if (L.trim() === "---") break;
        if (/^specificPairings:\s*$/.test(L)) break;
        buf.push(L);
        i++;
      }
      combo.pairingTendencies = parsePairingTendenciesBlock(buf.join("\n"));
      continue;
    }
    if (ln.match(/^specificPairings:\s*$/)) {
      i++;
      const pairs = [];
      while (i < lines.length) {
        const L = lines[i];
        if (L.trim() === "---") break;
        if (L.trim() !== "") pairs.push(L.trim());
        i++;
      }
      combo.specificPairings = pairs;
      continue;
    }
    i++;
  }
  return { combo, nextIdx: i };
}

function mapMeta(meta) {
  const suit = meta.suit === "None" ? null : meta.suit;
  const rank = meta.rank === "None" ? null : meta.rank;
  let number = null;
  if (meta.number !== "None" && meta.number !== undefined && meta.number !== "") {
    number = Number(meta.number);
  }
  return {
    id: meta.cardId,
    arcana: meta.arcana,
    suit,
    rank,
    number,
    image: meta.image,
  };
}

function parseCardBlock(blockText) {
  const lines = blockText.split(/\r?\n/);
  const name = lines[0].replace(/^##\s+/, "").trim();
  const idxU = lines.findIndex((l) => l.trim() === "### Upright");
  if (idxU === -1) throw new Error(`No ### Upright for ${name}`);
  const meta = parseMetadata(lines, 1, idxU);
  const { block: upright } = parseFace(lines, idxU, "### Reversed");
  const idxR = lines.findIndex((l, j) => j >= idxU && l.trim() === "### Reversed");
  const { block: reversed } = parseFace(lines, idxR, "### Relational Profile");
  const idxP = lines.findIndex((l, j) => j >= idxR && l.trim() === "### Relational Profile");
  const { profile } = parseRelationalProfile(lines, idxP);
  const idxC = lines.findIndex((l, j) => j >= idxP && l.trim() === "### Combination Logic");
  const { combo } = parseCombinationLogic(lines, idxC);
  const m = mapMeta(meta);
  return {
    id: m.id,
    name,
    arcana: m.arcana,
    suit: m.suit,
    rank: m.rank,
    number: m.number,
    image: m.image,
    upright,
    reversed,
    relationalProfile: profile,
    combinationLogic: combo,
  };
}

function validateCard(card, index) {
  const issues = [];
  const prefix = `Card #${index} (${card.name || card.id})`;
  if (!card.id) issues.push(`${prefix}: missing id`);
  if (!card.name) issues.push(`${prefix}: missing name`);
  if (card.arcana !== "Major" && card.arcana !== "Minor") issues.push(`${prefix}: bad arcana ${card.arcana}`);
  if (card.image === undefined || card.image === "") issues.push(`${prefix}: missing image`);
  for (const o of ["upright", "reversed"]) {
    const b = card[o];
    if (!b) {
      issues.push(`${prefix}: missing ${o}`);
      continue;
    }
    for (const fk of ["keywords", "extendedKeywords", ...TEXT_KEYS_AFTER_LISTS]) {
      if (b[fk] === undefined) issues.push(`${prefix}.${o}: missing ${fk}`);
    }
    if (!Array.isArray(b.keywords) || b.keywords.length !== 5)
      issues.push(`${prefix}.${o}: keywords length ${b.keywords?.length} (need 5)`);
    if (!Array.isArray(b.extendedKeywords) || b.extendedKeywords.length !== 8)
      issues.push(`${prefix}.${o}: extendedKeywords length ${b.extendedKeywords?.length} (need 8)`);
  }
  const rp = card.relationalProfile;
  if (rp) {
    for (const k of REL_PROFILE_KEYS) {
      if (rp[k] === undefined || String(rp[k]).trim() === "")
        issues.push(`${prefix}.relationalProfile: missing or empty ${k}`);
    }
  } else issues.push(`${prefix}: missing relationalProfile`);
  const cl = card.combinationLogic;
  if (!cl) issues.push(`${prefix}: missing combinationLogic`);
  else {
    if (!String(cl.whenFirst || "").trim()) issues.push(`${prefix}: empty whenFirst`);
    if (!String(cl.whenSecond || "").trim()) issues.push(`${prefix}: empty whenSecond`);
    const pt = cl.pairingTendencies;
    if (!pt) issues.push(`${prefix}: missing pairingTendencies object`);
    else {
      for (const k of ["majorArcana", "courtCards", "sameSuit", "conflictingSuit"]) {
        if (pt[k] === undefined) issues.push(`${prefix}.pairingTendencies: missing ${k}`);
      }
    }
    if (!Array.isArray(cl.specificPairings) || cl.specificPairings.length !== 3)
      issues.push(`${prefix}: specificPairings length ${cl.specificPairings?.length} (need 3)`);
  }
  return issues;
}

const raw = fs.readFileSync(mdPath, "utf8");
const parts = raw.split(/\n(?=## )/).filter((p) => p.startsWith("## "));
const cards = parts.map((part) => parseCardBlock(part));

const ids = new Set();
const allIssues = [];
if (cards.length !== 78) allIssues.push(`Expected 78 cards, got ${cards.length}`);
cards.forEach((c, i) => {
  if (ids.has(c.id)) allIssues.push(`Duplicate id: ${c.id}`);
  ids.add(c.id);
  allIssues.push(...validateCard(c, i));
});

if (allIssues.length) {
  console.error("VALIDATION FAILED:");
  for (const iss of allIssues) console.error(iss);
  process.exit(1);
}

const banner = `/**\n * Tarot card data derived from content-intake/tarot/tarot-cards-master.md\n * Generated by scripts/build-tarotCardsNew.mjs — do not hand-edit without updating the source.\n */\n\n`;
const body = `export const tarotCardsNew = ${JSON.stringify(cards, null, 2)};\n`;
fs.writeFileSync(outPath, banner + body, "utf8");
console.log("Wrote", outPath, "cards:", cards.length);
