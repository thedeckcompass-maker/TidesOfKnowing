# Two-Card Corpus Audit

**Source:** `content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md`  
**Audit date:** 2026-05-21  
**Auditor:** Cursor (automated heading scan + manual spot-checks)  
**Scope:** Major Arcana, upright only, ordered pairs, self-pairings excluded by design  

---

## Executive summary

| Metric | Value |
|--------|-------|
| Expected ordered pairings (22 × 21) | **462** |
| Pairings with detectable title headings | **252** |
| Unique ordered pairings identified | **245** |
| Definitively missing (no heading, not duplicated) | **217** |
| Duplicate pairings (same A→B twice) | **7** |
| Self-pairings (A→A) | **0** |
| File lines | **31,930** |

The master file is **not production-complete**. It contains a full, well-structured **Fool-as-first-card block** (21/21), partial coverage for several other first cards, and **zero** pairings with **The Empress**, **The Emperor**, or **The Hierophant** as the first card. An in-file editorial note (line 1787) confirms the Magician-through-remainder batch was still in progress when exported.

**Self-pairings:** None found. The corpus aligns with the rule that two physical cards cannot repeat in one draw; expected count is **462**, not 484.

**Parseable as-is:** No. The file needs editorial normalisation, completion of missing pairings, deduplication, and a deliberate extraction pipeline before any production ingest.

---

## 1. Template and notes (non-pairing content)

### Lines 1–148: template, instructions, and reference material

| Section | Approx. lines | Content |
|---------|---------------|---------|
| Tool introduction (draft) | 1–5 | Relational-field intro paragraph (for tool UI, not per pairing) |
| Template label | 9 | `RELATIONAL READING TEMPLATE - LOCKED` |
| Locked template structure | 19–139 | Section list, word-count targets, example Expanded Reflection note |
| Key principles | 95–109 | Editorial principles (relational field, somatic language, order matters, etc.) |
| Word-count breakdown | 117–141 | Per-section targets; paired A→B + B→A length note |
| Wheel / Hanged Man example | 85–92 | Expanded Reflection sample (not a pairing entry) |

### First pairing content begins

- **Line 149:** `THE FOOL - THE MAGICIAN` (first detectable pairing heading)
- **Line 1787:** Editorial checkpoint: *"Continuing now with The Magician as first card through all remaining Major Arcana pairings…"*

Everything above line 149 should be **excluded from ingestion** and stored separately (tool intro can move to tool page or hub frontmatter).

---

## 2. Pairing heading patterns

The corpus uses **multiple incompatible formats**. Any extractor must normalise these before slug assignment.

### 2.1 Title line formats observed

| Format | Count (approx.) | Example |
|--------|-----------------|---------|
| ALL CAPS + em dash | 72+ | `THE FOOL — THE EMPEROR` |
| ALL CAPS + hyphen | 3 | `THE FOOL - THE MAGICIAN` |
| Title case + em dash | ~180 | `The Hermit — Justice` |
| Title case + hyphen | 1 | `The Tower - The Hermit` |
| Markdown H1 `#` + em dash | 16 | `# The World — Judgement` |
| **No title** (body starts at Dynamic Recap) | Unknown (many) | After `\---`, only `Dynamic Recap:` |

**Separator inconsistency:** Pairing titles use both hyphen-minus (` - `) and em dash (` — `). **3,097 em dashes** appear in the file overall (titles, directional context, and body copy).

### 2.2 Body structure variants

| Variant | Markers | Notes |
|---------|---------|-------|
| **A — Locked template (plain)** | `Dynamic Recap`, `The Taste of This Together`, `The {Card} Enters`, `The {Card} Arrives`, `The Dance Unfolds`, resonance sections, `The Questions` | Strongest structure; Fool block |
| **B — Numbered inline** | `1\. Dynamic Recap:`, `2\. [Bracketed Directional Context]:`, … `10\. The Questions` | Common mid-file; escaped backslashes in source |
| **C — Prose blocks without title** | Opens with `Dynamic Recap:` immediately after separator | Harder to auto-split; no `card1`/`card2` in machine-readable header |
| **D — Markdown H2 sections** | `## Dynamic Recap`, `## The Questions` | Late file (e.g. World ↔ Judgement) |
| **E — Alternate section titles** | `If You Recognize Yourself More in The Strength Energy` (capitalisation drift) | Needs normalisation map |

### 2.3 Metadata

**No consistent YAML/frontmatter** per pairing. SEO fields, slugs, canonical URLs, and status flags are absent. Card identity must be inferred from title lines (or manual mapping for untitled blocks).

---

## 3. Coverage by first card

Each first card should appear in exactly **21** ordered pairings (all other majors). Detected unique pairings by first card:

| First card | Found | Expected | Status |
|------------|-------|----------|--------|
| The Fool | 21 | 21 | Complete |
| The Magician | 18 | 21 | Missing 3 |
| The High Priestess | 18 | 21 | Missing 3 |
| **The Empress** | **0** | **21** | **Missing entire block** |
| **The Emperor** | **0** | **21** | **Missing entire block** |
| **The Hierophant** | **0** | **21** | **Missing entire block** |
| The Lovers | 18 | 21 | Missing 3 |
| The Chariot | 18 | 21 | Missing 3 |
| Strength | 2 | 21 | Missing 19 |
| The Hermit | 18 | 21 | Missing 3 |
| Wheel of Fortune | 2 | 21 | Missing 19 |
| Justice | 1 | 21 | Missing 20 |
| The Hanged Man | 18 | 21 | Missing 3 |
| Death | 2 | 21 | Missing 19 |
| Temperance | 2 | 21 | Missing 19 |
| The Devil | 18 | 21 | Missing 3 |
| The Tower | 18 | 21 | Missing 3 |
| The Star | 18 | 21 | Missing 3 |
| The Moon | 17 | 21 | Missing 4 |
| The Sun | 18 | 21 | Missing 3 |
| Judgement | 2 | 21 | Missing 19 |
| The World | 16 | 21 | Missing 5 |

**217 pairings** have no detectable title heading in the current file. Some may exist as untitled prose blocks; a second-pass splitter (separator + `Dynamic Recap` + card names in body) is required before assuming they are unwritten.

---

## 4. Duplicates (corpus errors)

Seven ordered pairs appear **twice** with full title headings (merge before ingest):

| Ordered pair | First occurrence (line) | Second occurrence (line) |
|--------------|-------------------------|---------------------------|
| The Hermit → Justice | 17433 | 17675 |
| The Hanged Man → The Hermit | 18041 | 18281 |
| The Hermit → Temperance | 18643 | 18881 |
| The Devil → The Hermit | 19243 | 19483 |
| The Tower → The Hermit | 19729 | 19977 |
| The Hermit → The Star | 19853 | 20103 |
| The Star → Wheel of Fortune | 23265 | 23515 |

---

## 5. Self-pairings

**None detected.** No headings or normalised keys where `firstCard === secondCard`. Self-pairings should remain **out of scope** and be flagged as errors if they appear during future authoring.

---

## 6. Card naming consistency

### Canonical names (expected)

The Fool, The Magician, The High Priestess, The Empress, The Emperor, The Hierophant, The Lovers, The Chariot, Strength, The Hermit, Wheel of Fortune, Justice, The Hanged Man, Death, Temperance, The Devil, The Tower, The Star, The Moon, The Sun, Judgement, The World.

### Issues

- **Wheel of Fortune:** Sometimes `WHEEL OF FORTUNE` in titles; normalise to `Wheel of Fortune` (no leading “The”).
- **Strength, Justice, Death, Temperance, Judgement:** Correctly appear without “The” in some ALL CAPS headings.
- **Judgment vs Judgement:** No `Judgment` spelling found in titles; keep **Judgement** site-wide.
- **False positive “minor arcana” grep:** Phrases like “King of…” in prose triggered 258 line hits; **no minor arcana pairing titles** found.

---

## 7. Reversal language (not tarot orientation)

- **Tarot reversed/upright:** No `reversed` orientation fields in corpus (correct for scope).
- **Directional “reversal” language:** **31+** instances of `In this reversal` / `this reversal where` in `[Directional Context]` brackets. These describe **inverse card order** (B arrives after A in the narrative sense), **not** reversed card faces.

**Recommendation:** Replace with neutral editorial terms before publish, e.g. *“When the second card follows the first in the draw…”* or *“Inverse order (B after A)”*. Do not expose the word “reversal” on public pages if the product no longer supports reversed cards (avoids user and SEO confusion).

---

## 8. Em dash findings

| Location | Issue |
|----------|--------|
| Pairing titles | ~248 titles use ` — ` between card names |
| Directional context | Heavy em dash use in bracketed lines |
| Body copy | Thousands of em dashes in prose |

**Site hygiene:** If Tides of Knowing style prefers en dash or comma for parenthetical breaks, run a **controlled normalisation** pass on generated production files (not necessarily on the editorial master if Leigh prefers em dashes while drafting).

**Slug/URL rule:** Slugs must use **ASCII hyphens only** (`the-fool-and-the-tower`), never em dashes.

---

## 9. Old fragment-combination model

- No references to `interactionArchetype`, `fragment combination`, or `tarot_relational_meanings` in the corpus.
- **73** lines match `fragment` in prose (e.g. “fragmented”) — not system references.
- Corpus philosophy matches the new model: relational field, order matters, authored sections.

---

## 10. Malformed headings

**Zero** headings failed card-name normalisation (all detected title lines map to the 22 majors).

**Content malformations (non-heading):**

- Escaped markdown: `\---`, `\1\.`, `\[` throughout mid-file exports
- One false-positive line captured by loose grep: line 1359 (prose containing “Tower and the Fool”, not a title)
- Late duplicate Tower/Hermit uses hyphen in title while duplicate uses em dash

---

## 11. Extraction risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Multiple title/body formats | High | Format classifier per block; human QA sample per format |
| Untitled pairings | High | Secondary detection: `\---` + `Dynamic Recap` + `Enters`/`Arrives` card names |
| Incomplete corpus (217 missing) | **Blocking** | Do not ship pages until count = 462 validated |
| Duplicate entries | Medium | Dedupe script keyed on `firstCard\|secondCard` |
| “Reversal” wording | Medium | Editorial find-replace in ingest normaliser |
| Em dash in slugs | High | Strict slug builder from canonical card table only |
| Word-count drift / shortened sections | Medium | Min-length validator on body |
| Expanded Reflection sections | Low | Optional frontmatter flag `hasExpandedReflection` |
| Editorial note at line 1787 | Low | Strip non-pairing lines in preflight |

---

## 12. Recommended corrections before ingestion

1. **Complete missing pairings** — priority: Empress, Emperor, Hierophant blocks; then Strength, Wheel, Justice, Death, Temperance, Judgement (19 each).
2. **Remove or merge 7 duplicates** — keep stronger/longer version; archive the other.
3. **Normalise every pairing title** to one pattern, e.g. `The Fool — The Tower` (Title Case, em dash or hyphen — pick one).
4. **Ensure every pairing has an explicit title line** (no orphan `Dynamic Recap` blocks).
5. **Strip lines 1–148** from generated output; relocate tool intro elsewhere.
6. **Unescape** `\---`, `\1\.`, `\[` → standard markdown.
7. **Rename directional “reversal”** language in bracketed context.
8. **Decide em dash policy** for public HTML (corpus vs published).
9. **Add optional YAML** per pairing in generated files: `firstCard`, `secondCard`, `slug`, `status: draft|ready`.
10. Re-run automated validator: **462 unique keys**, 0 duplicates, 0 self-pairs.

---

## 13. Audit tooling

- Script: `scripts/audit-two-card-corpus.mjs` (re-runnable).
- Re-run after editorial updates: `node scripts/audit-two-card-corpus.mjs`

---

## 14. Open questions for Leigh

1. Confirm hyphen vs em dash in **published** titles (H1 can differ from master).
2. Confirm replacement copy for “In this reversal” directional brackets.
3. Whether shortened late-file pairings (markdown H2 variant) need expansion to ~1,600-word target before publish.
4. Whether `Expanded Reflection` appears only on Wheel ↔ Hanged Man or elsewhere.
