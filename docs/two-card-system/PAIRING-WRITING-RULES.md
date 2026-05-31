# Pairing writing rules

Rules for manually completing Major Arcana upright two-card meanings in the editorial master. For voice and rhythm, read [PAIRING-PROSE-EXAMPLES.md](./PAIRING-PROSE-EXAMPLES.md). For structure plus template excerpt, see [PAIRING-WRITING-EXAMPLES.md](./PAIRING-WRITING-EXAMPLES.md). For gaps and priority, see [MANUAL-COMPLETION-PLAN.md](./MANUAL-COMPLETION-PLAN.md).

**Master file (only place to author meanings):** `content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md`

---

## Who writes what

| Who | May do |
|-----|--------|
| **Leigh** | Write all missing interpretive pair meanings manually in the master file. |
| **Cursor** | Audit, count, checklists, structure validation, duplicate and defect reports. |

**Cursor must not** generate interpretive pair meanings unless explicitly asked for a small, reviewable draft.

**Out of scope while completing the corpus:** Symbolic Lexicon card records, public website pages, Tarot Word Match, splitting into `src/data/symbolic-lexicon/pairings/`, merging two-card copy into single-card records.

---

## Scope of each entry

- **Deck:** Major Arcana only, **upright** only.
- **Order:** Ordered pair **Card 1 → Card 2** (not interchangeable). Self-pairs (same card twice) are excluded.
- **One entry = one ordered pair**, self-contained from title through The Questions.
- **Protagonist:** The relational field between the two energies—not either card in isolation.

---

## Locked 10-part structure (in order)

Every complete entry includes all ten sections. Replace `[First Card]` / `[Second Card]` with the actual card names.

| # | Section | Purpose |
|---|---------|---------|
| 1 | **Dynamic Recap** | One sentence: immediate situation in the relational field. |
| 2 | **Bracketed directional context** | Sequence / causality / what order reveals (see format variants below). |
| 3 | **The Taste of This Together** | Somatic, embodied “weather” of the combination; ends with what the field is asking **given Card 1 arrived first**. |
| 4 | **The [First Card] Enters** | First card’s presence in *this* pairing—not generic card copy. |
| 5 | **The [Second Card] Arrives** | Second card’s arrival; collision and shift in the room. |
| 6 | **The Dance Unfolds** | Negotiation, tension, cost of each move, what is actually possible. |
| 7 | **If you recognize yourself more in The [First Card] Energy** | Resonance, shadow, gift, vulnerability for that energy. |
| 8 | **If you recognize yourself more in The [Second Card] Energy** | Same for the second card. |
| 9 | **What happens when you sit with the combined energy and ask: How can this be honoured collectively?** | Integration; couples and individuals; both energies valued—not one winning. |
| 10 | **The Questions** | Open-ended relational invitations (typically ~7); not prescriptive advice. |

**Optional (only when present in source material):** *Expanded Reflection* after The Questions for specific pairings (e.g. Wheel of Fortune — The Hanged Man). Do not add unless that pairing already uses it as a model.

---

## Voice and content principles (from locked template)

- **Relational field as protagonist**, not textbook card definitions.
- **Somatic / embodied language** before abstract explanation.
- **Multiple entry points:** couples, internal conflict (both energies in one person), groups.
- **Shadow and gift** for each energy—no blame framing.
- **No foreclosure:** leave room for the seeker’s own answer.
- **Card order matters:** the same two cards in reverse order are a different reading; write for **this** order only.
- **Integration before prescription:** “How can both be honoured?” not “which card is right?”

Bracketed directional lines describe **draw order** (B after A in the narrative), **not** reversed tarot faces. Avoid the word **“reversal”** in new copy; existing “In this reversal” brackets in the file should be renamed on publish (see [TWO-CARD-CORPUS-AUDIT.md](./TWO-CARD-CORPUS-AUDIT.md) §7).

---

## Length and density

| Section | Target (approx.) |
|---------|------------------|
| Dynamic Recap | ~20 words |
| Directional context | ~5 words (short line or parenthetical) |
| The Taste of This Together | ~250 words |
| [First Card] Enters | ~180 words |
| [Second Card] Arrives | ~180 words |
| The Dance Unfolds | ~330 words |
| Each “If you recognize…” block | ~160 words |
| Collective honouring (§9) | ~200 words |
| The Questions (~7) | ~170 words total |
| **Whole pairing** | **~1,600–1,700 words** |

Shorter than this usually means depth loss. Paired A→B plus B→A (if ever authored as one response) targets ~3,200–3,400 words combined.

---

## Format in the master file

### Model block

The **Fool as first card** block (21/21 complete) is the reference for early format: ALL CAPS pairing title, plain section labels, parenthetical directional line, `\---` separator after each entry.

### Acceptable variants already in the corpus

- **Title-case** pairing line (e.g. `Strength — The High Priestess`) with section labels; some blocks use `Section title: opening prose` on one line.
- **Markdown tail** (~line 30206+): `# Card — Card` title, `##` section headings, plain `---` between entries.
- **Separators:** `\---` (backslash + three hyphens) on its own line between most entries; plain `---` before the next `#` pairing in the tail.

### Heading accuracy (required)

- **Enters** heading must name **Card 1** (first card in the title).
- **Arrives** heading must name **Card 2**.
- Do not copy-paste **The Sun Enters** (or any wrong card) into tail markdown blocks—seven tail defects are documented in [major-arcana-upright-completion-audit.md](./major-arcana-upright-completion-audit.md) §5.

### Naming (canonical)

| Use | Avoid |
|-----|--------|
| Judgement | Judgment |
| Wheel of Fortune | Ambiguous “Wheel” alone in titles |
| The Empress, The Emperor, The Hierophant, etc. | Inconsistent “The” dropping unless matching an existing block |

Site-consistent spelling: **honoured** (British) in section 9 as written in the template.

---

## Editorial workflow

1. Pick the next gap from [MISSING-PAIRINGS-CHECKLIST.md](./MISSING-PAIRINGS-CHECKLIST.md) (order in [MANUAL-COMPLETION-PLAN.md](./MANUAL-COMPLETION-PLAN.md)).
2. Re-read [PAIRING-PROSE-EXAMPLES.md](./PAIRING-PROSE-EXAMPLES.md) for rhythm.
3. Write the full ten sections in the master file; end with the correct separator.
4. Run `node scripts/audit-two-card-corpus.mjs` and refresh checklist JSON.
5. Repeat until **complete = 462**, **missing = 0**, **duplicates = 0**, tail Enters headings fixed.

**Do not** “improve” or normalize existing completed entries while filling gaps unless fixing a documented duplicate or heading defect.

---

## Validation checklist (per new entry)

- [ ] Title states ordered pair (Card 1 → Card 2) clearly.
- [ ] All ten sections present in order.
- [ ] Enters / Arrives headings match first and second card names.
- [ ] Taste section ends with a field-level question that respects **order**.
- [ ] Both recognition blocks include shadow, gift, and vulnerability.
- [ ] Questions are open-ended, not commands or predictions.
- [ ] Entry ends with `\---` (or tail `---` + next `#` title pattern if in markdown batch).
- [ ] ~1,600+ words unless deliberately matching a shorter adjacent convention in the same block.

---

## Related files

| File | Role |
|------|------|
| [PAIRING-PROSE-EXAMPLES.md](./PAIRING-PROSE-EXAMPLES.md) | Verbatim readings only |
| [PAIRING-WRITING-EXAMPLES.md](./PAIRING-WRITING-EXAMPLES.md) | Structure + template excerpt + examples |
| [MANUAL-COMPLETION-PLAN.md](./MANUAL-COMPLETION-PLAN.md) | Counts, priority, roles |
| [MISSING-PAIRINGS-CHECKLIST.md](./MISSING-PAIRINGS-CHECKLIST.md) | Generated gap list |
| [major-arcana-upright-completion-audit.md](./major-arcana-upright-completion-audit.md) | Duplicates, tail defects, methodology |
