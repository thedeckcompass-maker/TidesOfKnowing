/**
 * docs/two-card-system/PAIRING-PROSE-EXAMPLES.md — reading-only verbatim extracts
 * Run: node scripts/generate-pairing-prose-examples.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CORPUS = path.join(
  ROOT,
  "content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md",
);
const OUT = path.join(ROOT, "docs/two-card-system/PAIRING-PROSE-EXAMPLES.md");

const text = fs.readFileSync(CORPUS, "utf8");
const BS = /\r?\n\\---\r?\n/;
const PLAIN = /\r?\n---\r?\n/;

function extractEntry(title, sepRe) {
  const start = text.indexOf(title);
  if (start < 0) throw new Error(`Title not found: ${title}`);
  const rest = text.slice(start + title.length);
  const m = rest.match(sepRe);
  const end = start + title.length + (m ? m.index : rest.length);
  return text.slice(start, end).trimEnd();
}

const titles = [
  ["THE FOOL - THE MAGICIAN", BS],
  ["THE FOOL - THE HIGH PRIESTESS", BS],
  ["THE FOOL - THE EMPRESS", BS],
  ["Strength — The High Priestess", BS],
  ["# The Sun — The Star", PLAIN],
];

let md = `# Pairing prose examples

`;

const bodies = titles.map(([title, sep]) => extractEntry(title, sep));
md += bodies.join("\n\n---\n\n");
md += "\n";

fs.writeFileSync(OUT, md.trimEnd() + "\n", "utf8");
console.log(`Wrote ${OUT} (${md.length} bytes, ${titles.length} pairings)`);
