/**
 * Reads src/data/interactionArchetypes.csv and writes src/data/interactionArchetypes.js
 * Run: node scripts/gen-interaction-archetypes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "src", "data", "interactionArchetypes.csv");
const outPath = path.join(root, "src", "data", "interactionArchetypes.js");

const text = fs.readFileSync(csvPath, "utf8");
const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

const rows = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (i === 0 && /^card1\s*,/i.test(line)) continue;

  const idx1 = line.indexOf(",");
  const idx2 = line.indexOf(",", idx1 + 1);
  if (idx1 < 0 || idx2 < 0) {
    console.warn("Skip malformed line:", line);
    continue;
  }
  const card1 = line.slice(0, idx1).trim();
  const card2 = line.slice(idx1 + 1, idx2).trim();
  const interaction = line.slice(idx2 + 1).trim();
  rows.push({ card1, card2, interaction });
}

if (rows.length !== 144) {
  throw new Error(`Expected 144 data rows in interactionArchetypes.csv, got ${rows.length}`);
}

const entries = rows
  .map((r) => `  ${JSON.stringify(`${r.card1}|${r.card2}`)}: ${JSON.stringify(r.interaction)}`)
  .join(",\n");

const out = `/**
 * Generated from src/data/interactionArchetypes.csv — do not edit by hand.
 * Regenerate: node scripts/gen-interaction-archetypes.mjs
 */
export const interactionArchetypeMap = {
${entries},
};
`;

fs.writeFileSync(outPath, out, "utf8");
console.log(`Wrote ${outPath} (${rows.length} entries)`);
