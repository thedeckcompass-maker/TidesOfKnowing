/**
 * One-off generator: docs/two-card-system/PAIRING-WRITING-EXAMPLES.md
 * Run: node scripts/generate-pairing-writing-examples.mjs
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
const OUT = path.join(ROOT, "docs/two-card-system/PAIRING-WRITING-EXAMPLES.md");

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

const templateStart = text.indexOf("For reference - this is the template");
const templateEnd = text.indexOf("\\---", text.indexOf("So for a paired-pairing"));
const templateBlock = text.slice(templateStart, templateEnd).trimEnd();

const entries = [
  [
    "THE FOOL - THE MAGICIAN (Fool block — ALL CAPS title; model block)",
    extractEntry("THE FOOL - THE MAGICIAN", BS),
  ],
  [
    "THE FOOL - THE HIGH PRIESTESS (Fool block — ALL CAPS title)",
    extractEntry("THE FOOL - THE HIGH PRIESTESS", BS),
  ],
  [
    "Strength — The High Priestess (mid-file — title-case; section colons)",
    extractEntry("Strength — The High Priestess", BS),
  ],
  [
    "# The Sun — The Star (late markdown — structurally clean tail entry)",
    extractEntry("# The Sun — The Star", PLAIN),
  ],
];

let md = `# Pairing Writing Examples

Reference extractions from the Major Arcana upright two-card master corpus. **Verbatim copies only** — no generated or edited interpretive text.

**Source:** \`content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md\`  
**Purpose:** Rhythm, tone, and structure before manually writing missing pairings (see [MANUAL-COMPLETION-PLAN.md](./MANUAL-COMPLETION-PLAN.md)).

---

## Locked 10-part structure

Completed entries follow the **RELATIONAL READING TEMPLATE — LOCKED** at the top of the master file. Each ordered pairing (Card 1 → Card 2) is one self-contained entry with ten sections in this order:

1. **Dynamic Recap** — one sentence on the immediate relational field  
2. **Bracketed directional context** — sequence/causality (often a parenthetical line in early blocks)  
3. **The Taste of This Together** — somatic / embodied “weather”; ends with what the field asks given card order  
4. **The [First Card] Enters** — first card in *this* combination  
5. **The [Second Card] Arrives** — second card’s arrival  
6. **The Dance Unfolds** — negotiation, tension, possibility  
7. **If you recognize yourself more in The [First Card] Energy** — shadow, gift, vulnerability  
8. **If you recognize yourself more in The [Second Card] Energy** — same for second card  
9. **What happens when you sit with the combined energy and ask: How can this be honoured collectively?** — integration  
10. **The Questions** — open-ended relational invitations

Target length in the template: **~1,600–1,700 words per single pairing**.

---

## Exact section headings (template labels)

| # | Heading pattern |
|---|-----------------|
| 1 | Dynamic Recap |
| 2 | [Bracketed Directional Context] |
| 3 | The Taste of This Together |
| 4 | The [First Card Name] Enters |
| 5 | The [Second Card Name] Arrives |
| 6 | The Dance Unfolds |
| 7 | If you recognize yourself more in The [First Card] Energy |
| 8 | If you recognize yourself more in The [Second Card] Energy |
| 9 | What happens when you sit with the combined energy and ask: How can this be honoured collectively? |
| 10 | The Questions |

**Live variants:** card names replace placeholders; markdown tail uses \`##\` prefixes; some mid-file entries use \`Section title: opening prose\` on one line; bracketed context may appear as \`(Openness encounters mastery)\` without a literal bracketed heading line.

---

## Separator pattern between entries

- **Primary (most of file):** own line \`\\---\` (backslash + three hyphens), usually with blank lines around it.  
- **Markdown tail (~line 30206+):** plain \`---\` on its own line before the next \`# Card — Card\` title.

---

## Structural instructions in the master file (template excerpt)

Copied verbatim from the master file template block (instructions only; no pairing bodies).

\`\`\`text
${templateBlock}
\`\`\`

---

## Manual writing rules (from MANUAL-COMPLETION-PLAN.md)

| Who | May do |
|-----|--------|
| **Leigh** | Write all missing interpretive pair meanings manually in the master file. |
| **Cursor** | Audit, count, scaffold checklists, validate structure, detect duplicates, report issues. |

**Cursor must not** generate interpretive pair meanings unless explicitly asked for a small, reviewable draft.

**Out of scope:** Symbolic Lexicon card records, public website pages, Tarot Word Match, ingest to \`src/data/symbolic-lexicon/pairings/\`, merging two-card copy into single-card records.

**Priority:** Empress → Emperor → Hierophant first-card blocks → E/E/H as second card gaps → late arc → merge 7 duplicates → fix tail \`## The Sun Enters\` defects (first card ≠ The Sun). Re-run \`node scripts/audit-two-card-corpus.mjs\` after editorial batches.

The **Fool block** (21/21 complete) is the reference model for early-format work.

---

## Complete pairing examples (verbatim)

`;

for (const [label, body] of entries) {
  md += `### ${label}\n\n\`\`\`text\n${body}\n\`\`\`\n\n---\n\n`;
}

md += `## Note on extraction

Text in the examples above is copied mechanically from the master file. Do not “improve” or normalise it in this reference doc. If the corpus changes, re-run \`node scripts/generate-pairing-writing-examples.mjs\`.\n`;

fs.writeFileSync(OUT, md, "utf8");
console.log(`Wrote ${OUT} (${md.length} bytes)`);
