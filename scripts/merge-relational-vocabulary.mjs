import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "data", "tarot_relational_meanings.csv");
const jsPath = path.join(root, "src", "data", "tarotCardsNew.js");

const raw = fs.readFileSync(csvPath, "utf8");
const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
if (lines.length !== 79) {
  console.error("FAIL: expected 79 non-empty lines (header + 78), got", lines.length);
  process.exit(1);
}
const dataLines = lines.slice(1);
if (dataLines.length !== 78) {
  console.error("FAIL: data rows", dataLines.length);
  process.exit(1);
}

/** @type {Map<string, { upright: string[], reversed: string[] }>} */
const map = new Map();
const csvNames = [];

for (const line of dataLines) {
  const cols = line.split(",");
  if (cols.length !== 27) {
    console.error("FAIL: column count", cols.length, "for", cols[0]);
    process.exit(1);
  }
  const name = cols[0];
  if (map.has(name)) {
    console.error("FAIL duplicate Card_Name", name);
    process.exit(1);
  }
  const upright = cols.slice(3, 15);
  const reversed = cols.slice(15, 27);
  for (const c of [...upright, ...reversed]) {
    if (String(c).trim() === "") {
      console.error("FAIL blank cell in", name);
      process.exit(1);
    }
  }
  map.set(name, { upright, reversed });
  csvNames.push(name);
}

let s = fs.readFileSync(jsPath, "utf8");
const nameRe = /"name": "([^"]+)",/g;
const jsNames = [];
let m;
while ((m = nameRe.exec(s)) !== null) {
  jsNames.push(m[1]);
}

if (jsNames.length !== 78) {
  console.error("FAIL: expected 78 names in JS, got", jsNames.length);
  process.exit(1);
}

const jsSet = new Set(jsNames);
if (jsSet.size !== 78) {
  console.error("FAIL: duplicate names in JS", jsSet.size);
  process.exit(1);
}

for (const n of csvNames) {
  if (!jsSet.has(n)) {
    console.error("FAIL: CSV name not in JS:", n);
    process.exit(1);
  }
}
for (const n of jsNames) {
  if (!map.has(n)) {
    console.error("FAIL: JS name not in CSV:", n);
    process.exit(1);
  }
}

for (let i = 0; i < jsNames.length; i++) {
  if (jsNames[i] !== csvNames[i]) {
    console.error("FAIL: order mismatch at index", i, "JS:", jsNames[i], "CSV:", csvNames[i]);
    process.exit(1);
  }
}

function formatVocabBlock(v) {
  const fmt = (arr) =>
    arr.map((word) => `        ${JSON.stringify(word)}`).join(",\n");
  return `\n    "relationalVocabulary": {\n      "upright": [\n${fmt(v.upright)}\n      ],\n      "reversed": [\n${fmt(v.reversed)}\n      ]\n    }`;
}

const cardStartRe = /\n  \{\n    "id": "/g;
const starts = [];
let mm;
while ((mm = cardStartRe.exec(s)) !== null) {
  starts.push(mm.index);
}

if (starts.length !== 78) {
  console.error("FAIL: expected 78 card starts, got", starts.length);
  process.exit(1);
}

const segments = [];
for (let i = 0; i < 78; i++) {
  const from = starts[i];
  const to = i < 77 ? starts[i + 1] : s.length;
  segments.push({ from, to, name: jsNames[i] });
}

let out = "";
let last = 0;
for (let i = 0; i < 78; i++) {
  const seg = segments[i];
  const chunk = s.slice(seg.from, seg.to);
  const vocab = map.get(seg.name);
  if (!vocab) {
    console.error("FAIL: no vocab for", seg.name);
    process.exit(1);
  }
  const isLast = i === 77;
  const insert = formatVocabBlock(vocab);
  const newChunk = isLast
    ? chunk.replace(/\n    }\n  }\n];\s*$/, `\n    },${insert}\n  }\n];`)
    : chunk.replace(/\n    }\n  },$/, `\n    },${insert}\n  },`);
  if (newChunk === chunk) {
    console.error("FAIL: replace did nothing for", seg.name, "last=", isLast);
    process.exit(1);
  }
  out += s.slice(last, seg.from);
  out += newChunk;
  last = seg.to;
}
out += s.slice(last);
fs.writeFileSync(jsPath, out, "utf8");
console.log("Wrote", jsPath);
console.log("Cards updated: 78");
