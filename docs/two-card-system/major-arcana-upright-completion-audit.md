# Major Arcana Upright Two-Card Meanings: Completion Audit

**Date:** 2026-05-31  
**Scope:** Major Arcana, upright only, ordered pairs (Card 1 → Card 2), self-pairings excluded  
**Expected pairings:** 462 (22 × 21)  
**Audit type:** Read-only inventory. No pair meanings rewritten. No Symbolic Lexicon or public site changes.

---

## Executive summary

| Question | Answer |
|----------|--------|
| Where does the resource live? | One editorial master file under `content-intake/two-card-corpus/` (not yet in `src/data/symbolic-lexicon/pairings/`, which is placeholder-only). |
| How complete is it? | **~61% of ordered slots** have identifiable, template-shaped entries (~283/462). **Not ~90% by slot count**, though prose volume is large (~481k words) and quality in finished blocks is strong. |
| Ready to finish manually? | **Yes.** Template is locked, Fool block is a complete model, gaps are systematic (three missing first-card pillars + scattered second-card gaps + tail formatting bugs). |
| Safe for Symbolic Lexicon now? | **No ingestion.** Keep separate; later enrichment only from **completed** pair copy, never merged into single-card records. |

**Single source of truth today:**

`content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md`

(~31,930 lines, ~481k words, ~2.8 MB)

**Automation helpers (regenerated during this audit):**

- `scripts/audit-two-card-corpus.mjs`
- `docs/two-card-system/missing-pairings.json`
- `docs/two-card-system/MISSING-PAIRINGS-CHECKLIST.md`

Prior related doc: `docs/two-card-system/TWO-CARD-CORPUS-AUDIT.md` (2026-05-21). This report supersedes counts using separator-based chunking and relaxed title-case detection.

---

## 1. Where the two-card resource lives

### Canonical editorial corpus

| Path | Status | Role |
|------|--------|------|
| `content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md` | **Active master** | All pair meanings authored here |
| `content-intake/two-card-corpus/` (other files) | None | Only the master file exists |

### Planned production location (empty)

| Path | Status | Role |
|------|--------|------|
| `src/data/symbolic-lexicon/pairings/tarot/major-arcana-upright/` | `.gitkeep` only | Future split JSON/MD per architecture plan |
| `src/data/symbolic-lexicon/pairings/tarot/indexes/` | `.gitkeep` only | Future pairing indexes |

See `docs/two-card-system/TWO-CARD-ARCHITECTURE-PLAN.md` for intended ingest path (`content-intake` → generated Astro collection). **Not implemented on the public site yet.**

### Supporting docs and tooling

| Path | Role |
|------|------|
| `docs/two-card-system/TWO-CARD-ARCHITECTURE-PLAN.md` | Naming, URLs, hybrid content model |
| `docs/two-card-system/TWO-CARD-MIGRATION-PLAN.md` | Migration planning |
| `docs/two-card-system/TWO-CARD-SEO-AEO-PLAN.md` | SEO/AEO |
| `docs/two-card-system/TWO-CARD-CORPUS-AUDIT.md` | Earlier corpus audit |
| `docs/two-card-system/MISSING-PAIRINGS-CHECKLIST.md` | Machine-generated gap checklist |
| `docs/two-card-system/missing-pairings.json` | Machine-generated gap data |
| `scripts/audit-two-card-corpus.mjs` | Heading-level pairing scanner |

### Public site (not this corpus)

Existing tools reference other data (e.g. combination interpreter bundles), **not** the master markdown file:

- `src/pages/tools/two-card-tarot-reading.astro`
- `src/pages/tools/tarot-combination-interpreter.astro`

**No changes were made to public routes, pages, or Symbolic Lexicon files.**

### Explicitly excluded from this audit (do not use for completion)

| Path | Reason |
|------|--------|
| `content-intake/two-card-corpus/` outside the master file | N/A (only one file) |
| `content-intake/tarot/tarot-cards-master.md` → `### Combination Logic` | Single-card + combination snippets, not ordered pair readings |
| `src/content/repeating-card-meanings/**` | Repeating-card system, not two-card pair readings |
| `src/data/symbolic-lexicon/tarot/cards/**` | Single-card lexicon (paused) |
| `docs/symbolic-lexicon/**` | Lexicon docs only |

---

## 2. Coverage: which pairings are complete vs missing

### Counting methodology

Two passes were run:

1. **Strict heading scan** (`audit-two-card-corpus.mjs`): title lines matching `THE |The |STRENGTH|…` only. **Undercounts** `Strength — …`, `Judgement — …`, and other title-case first cards.
2. **Separator chunk scan** (this audit): split on literal `\---` between entries (~291 separators → ~292 chunks), parse first line as `Card A [—–-] Card B`, require template markers (`Dynamic Recap`, `The Taste of This Together`, `The Questions`, `Enters`/`Arrives`).

**Authoritative completion metric for manual finish work:** separator chunk scan (**283 unique ordered pairings**).

| Metric | Count | % of 462 |
|--------|------:|---------:|
| Expected ordered pairings | 462 | 100% |
| Unique pairings with full template-shaped chunks | **283** | **61.3%** |
| Missing ordered pairings | **179** | **38.7%** |
| Strict script unique detections | 261 | 56.5% |
| Duplicate full entries (same A→B twice) | **7** | — |
| Self-pairings | 0 | — |

### Coverage by first card (separator chunk scan)

| First card | Found | Missing | Notes |
|------------|------:|--------:|-------|
| The Fool | 21 | 0 | **Complete block** (model for manual completion) |
| The Magician | 18 | 3 | Missing → Empress, Emperor, Hierophant |
| The High Priestess | 18 | 3 | Missing → Empress, Emperor, Hierophant |
| **The Empress** | **0** | **21** | **No first-card block** |
| **The Emperor** | **0** | **21** | **No first-card block** |
| **The Hierophant** | **0** | **21** | **No first-card block** |
| The Lovers | 18 | 3 | Missing → Empress, Emperor, Hierophant |
| The Chariot | 18 | 3 | Missing → Empress, Emperor, Hierophant |
| Strength | 18 | 3 | Missing → Empress, Emperor, Hierophant |
| The Hermit | 16 | 5 | Includes duplicate-line confusion in tail |
| Wheel of Fortune | 17 | 4 | |
| Justice | 16 | 5 | |
| The Hanged Man | 18 | 3 | Missing → Empress, Emperor, Hierophant |
| Death | 18 | 3 | Missing → Empress, Emperor, Hierophant |
| Temperance | 11 | 10 | Late-file gaps |
| The Devil | 12 | 9 | Late-file gaps |
| The Tower | 11 | 10 | Late-file gaps |
| The Star | 11 | 10 | Late-file gaps + markdown tail |
| The Moon | 10 | 11 | Late-file gaps + markdown tail |
| The Sun | 11 | 10 | Late-file gaps + markdown tail |
| Judgement | 11 | 10 | Late-file gaps + markdown tail |
| The World | 10 | 11 | Late-file gaps + markdown tail |

### Missing-work pattern (why “~90%” feels higher than slot count)

- **63 slots** are three entire first-card runs (Empress, Emperor, Hierophant × 21).
- **~60 slots** are “any first card → Empress/Emperor/Hierophant” where only **The Fool →** those three exist today (grep shows Empress/Emperor/Hierophant almost only inside the Fool block).
- **~56 slots** are late-arc gaps (Temperance through World), plus **7 duplicates** to merge, plus **tail copy-paste errors** (below).

Substantive TOK prose exists for most written entries; the gap is **ordered coverage**, not lack of voice.

### Editorial checkpoint in file

Line **1787** notes intentional batching: *“Continuing now with The Magician as first card through all remaining Major Arcana pairings…”* Fool block ends just before line 1795 (`THE MAGICIAN — THE FOOL`).

---

## 3. Structure consistency

### Locked template (lines 19–139)

All finished entries aim for the relational reading template:

1. Dynamic Recap  
2. Bracketed directional context (often parenthetical line, not always a heading)  
3. The Taste of This Together  
4. The [First Card] Enters  
5. The [Second Card] Arrives  
6. The Dance Unfolds  
7. If you recognize yourself more in The [First] Energy  
8. If you recognize yourself more in The [Second] Energy  
9. What happens when you sit with the combined energy…  
10. The Questions  

Target length in template notes: **~1,600–1,700 words** per ordered pairing.

### Body format variants (same template, different markup)

| Variant | Where | Markers |
|---------|-------|---------|
| **A — Plain (Fool block)** | Lines ~149–1785 | `THE FOOL - …`, plain section titles, `\---` separators |
| **B — Title case + em dash** | Mid file | `Strength — The Lovers`, `Judgement — The Hermit` |
| **C — Numbered escaped** | Mid file (per prior audit) | `1\. Dynamic Recap:` style |
| **D — Markdown H1/H2 tail** | ~30206–end | `# The Star — The Moon`, `## Dynamic Recap` |

**283 chunk-scanned entries** include Dynamic Recap, Taste, Questions, and Enters/Arrives. **0** of those chunks lack all three core markers.

### Word-count distribution (chunk-scanned entries)

| Band | Count | Notes |
|------|------:|-------|
| Under 500 words | 0 | No empty stubs in chunked set |
| 500–999 words | 125 | Below template target |
| 1,000–1,599 words | 96 | Near target |
| 1,600+ words | 62 | Meets template target |

Median ~**1,128 words** per detected entry. Many strong entries sit slightly under the 1,600-word design target but are publication-grade prose.

### Separators

Entries are delimited by a literal **`\---`** line (backslash + three hyphens), **291 times**. Plain `---` appears elsewhere (37 lines). Extractors must use the `\---` convention.

---

## 4. Placeholder text

| Check | Result |
|-------|--------|
| `TODO`, `TBD`, `lorem`, `FIXME`, `[insert`, `coming soon` | **None** in master file |
| Template instructions (lines 1–148) | Not placeholders; exclude from ingest |
| Empty pairing stubs | **None** found in chunked set |

Missing pairings are **absent**, not stubbed.

---

## 5. Duplicates, weak entries, formatting issues

### Duplicate ordered pairs (merge before publish)

Seven pairings appear **twice** with full titles (keep longer/better version):

| Ordered pair | Lines (approx.) |
|--------------|-----------------|
| The Hermit → Justice | 17433, 17675 |
| The Hanged Man → The Hermit | 18041, 18281 |
| The Hermit → Temperance | 18643, 18881 |
| The Devil → The Hermit | 19243, 19483 |
| The Tower → The Hermit | 19729, 19977 (second uses hyphen `-` not em dash) |
| The Hermit → The Star | 19853, 20103 |
| The Star → Wheel of Fortune | 23265, 23515 |

### Weak or erroneous entries (tail markdown section)

From line **~30206**, ~20 pairings use markdown `#` / `##` headings (Star/Moon/Sun/World/Judgement cluster).

**Copy-paste defect:** **7 of 20** tail `H1` blocks use `## The Sun Enters` when the first card is **not** The Sun (e.g. `# Judgement — The Star` at line 30638 still has `## The Sun Enters` at 30660). These need manual correction of “Enters” / “Arrives” headings to match actual card order.

**Not a placeholder issue** — full prose is present but **wrong card name in section headings** in the tail batch.

### Malformed / uncertain heading (strict scanner)

Line **22099**: `Wheel of Fortune — The Hanged Man: **Expanded Reflection**` — editorial note, not a pairing entry. Exclude from pairing inventory.

### Naming and separator inconsistency

| Issue | Impact |
|-------|--------|
| `THE FOOL - THE MAGICIAN` vs `THE FOOL — THE EMPEROR` | Hyphen vs em dash in titles |
| ALL CAPS vs Title case first cards | Breaks strict audit script for Strength, Judgement, etc. |
| `Judgment` vs `Judgement` | Judgement used in corpus (site-consistent) |
| Thousands of em dashes in body copy | Style/hygiene for export; slugs must stay ASCII (`the-fool-and-the-tower`) |

### “Reversal” language

Bracketed sections use *“In this reversal”* for **inverse draw order** (B after A), not tarot card reversal. Rename on publish if the product is upright-only (see `TWO-CARD-CORPUS-AUDIT.md` §7).

### Strict audit script limitation

`audit-two-card-corpus.mjs` reports Strength **2/21** and Justice **1/21** because title-case `Strength —` lines do not match the `STRENGTH|` prefix regex. **Do not use script first-card counts alone**; use separator chunk table above or fix the script.

---

## 6. Is it close enough to finish manually?

**Yes.**

| Factor | Assessment |
|--------|------------|
| Interpretive quality in completed blocks | Strong TOK relational voice; Fool block is print-ready structurally |
| Template clarity | Locked 10-part structure with word-count guidance |
| Remaining work | Mostly **additive** (179 ordered slots), not rewrites of the whole file |
| Risk | Tail markdown batch needs **QA pass** (wrong “Sun Enters” headings); dedupe 7 pairs |
| Effort shape | Three 21-pair runs (Empress, Emperor, Hierophant) + ~60 “→ E/E/H” pairs + late-arc completion |

**Slot-based completion is ~61%, not ~90%.** If “90%” reflects prose effort or subjective review of major blocks, align team metrics on **462 ordered slots** or update the audit script so progress tracking matches title-case headings.

---

## 7. Exact files needing attention next

### Priority 1 — Editorial master (human)

| File | Action |
|------|--------|
| `content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md` | **Only file that must be edited** to complete the resource |

**Suggested manual order:**

1. **The Empress** as first card — 21 pairings (largest gap; 0/21 today).  
2. **The Emperor** as first card — 21 pairings.  
3. **The Hierophant** as first card — 21 pairings.  
4. **Fill → Empress / Emperor / Hierophant** as second card for all other first cards except Fool (60 slots; Fool already has all three).  
5. **Complete late arc** first-card gaps: World (11 missing), Moon (11), Sun, Star, Judgement, Temperance, Devil, Tower, Hermit, Justice, Wheel.  
6. **Merge 7 duplicates** (table in §5).  
7. **Fix tail markdown blocks** (~30206–31840): correct `## The [Correct Card] Enters` / `Arrives` headings.  
8. **Normalise title lines** (optional but helps automation): consistent ` — ` separator and predictable first-card casing per block.

### Priority 2 — Tracking (optional refresh)

| File | Action |
|------|--------|
| `scripts/audit-two-card-corpus.mjs` | Extend regex to detect title-case `Strength —`, `Judgement —`, etc. |
| `docs/two-card-system/MISSING-PAIRINGS-CHECKLIST.md` | Re-run script after script fix |
| `docs/two-card-system/missing-pairings.json` | Same |

### Priority 3 — Do not touch yet

| File / area | Reason |
|-------------|--------|
| `src/data/symbolic-lexicon/pairings/**` | Ingest only after master is complete and reviewed |
| `src/data/symbolic-lexicon/tarot/cards/**` | Lexicon population paused |
| Public Astro pages / tools | No ingest until editorial sign-off |
| `content-intake/two-card-corpus/` (new auto-generated meanings) | User requested no automatic generation |

---

## 8. Relationship to Symbolic Lexicon (boundary reminder)

| Rule | Status |
|------|--------|
| Two-card resource stays separate | Yes |
| No pair meanings inside single-card lexicon JSON | Not started (correct) |
| Lexicon may later use **themes, tags, distinctions** from **completed** pairs | Future only |
| Do not populate lexicon from incomplete two-card material | **179 slots incomplete** |

---

## 9. Recommended next steps (workflow)

1. Use **The Fool → The Magician** block (lines 149–223) as the paste template for new entries.  
2. Work in **first-card batches of 21** with `\---` separators and ALL CAPS or consistent title-case titles.  
3. After each batch, run `node scripts/audit-two-card-corpus.mjs` (after script fix) or separator chunk script to refresh `MISSING-PAIRINGS-CHECKLIST.md`.  
4. QA tail section (lines 30206+) for wrong `Enters` card names.  
5. When **462/462** slots pass review, plan ingest per `TWO-CARD-ARCHITECTURE-PLAN.md` (still separate from Symbolic Lexicon cards).

---

## Appendix: Files reviewed

| File | Purpose |
|------|---------|
| `content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md` | Full corpus (sampled + scripted scans) |
| `scripts/audit-two-card-corpus.mjs` | Heading inventory logic |
| `docs/two-card-system/missing-pairings.json` | Generated gap JSON |
| `docs/two-card-system/MISSING-PAIRINGS-CHECKLIST.md` | Generated checklist |
| `docs/two-card-system/TWO-CARD-CORPUS-AUDIT.md` | Prior audit cross-check |
| `docs/two-card-system/TWO-CARD-ARCHITECTURE-PLAN.md` | Planned paths and naming |
| `src/data/symbolic-lexicon/pairings/tarot/major-arcana-upright/.gitkeep` | Confirmed empty production slot |
| `src/pages/tools/two-card-tarot-reading.astro` | Confirmed not wired to master MD |

---

## Build status

Only `docs/two-card-system/major-arcana-upright-completion-audit.md` was added. **`npm run build` passed** (exit code 0).
