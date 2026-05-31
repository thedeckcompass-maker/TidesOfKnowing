# Major Arcana Upright Two-Card: Manual Completion Plan

**Working brief and index.** Full inventories live in linked audits and regenerated checklists — not duplicated here.

**Last regenerated:** run `node scripts/audit-two-card-corpus.mjs` for current counts.

---

## Source of truth

| Item | Path |
|------|------|
| Editorial master (only file to edit for meanings) | `content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md` |
| Gap checklist (generated) | [`MISSING-PAIRINGS-CHECKLIST.md`](./MISSING-PAIRINGS-CHECKLIST.md) |
| Gap data (generated) | [`missing-pairings.json`](./missing-pairings.json) |
| Audit script | `scripts/audit-two-card-corpus.mjs` |

---

## Current slot counts

| Metric | Value |
|--------|------:|
| Expected ordered slots | **462** (22 × 21, no self-pairs) |
| Complete (chunk + template markers) | **283** |
| Missing | **179** |
| Duplicate full entries | **7** |
| Tail `## The Sun Enters` defects (first card ≠ The Sun) | **7** |

Counts use separator chunking (`\---` between entries, plus plain `---` before markdown `#` pairing titles in the tail). This matches [`major-arcana-upright-completion-audit.md`](./major-arcana-upright-completion-audit.md).

---

## Related documentation

| Doc | Use for |
|-----|---------|
| [MISSING-PAIRINGS-CHECKLIST.md](./MISSING-PAIRINGS-CHECKLIST.md) | Checkbox list of missing pairings by first card, duplicates, manual work order |
| [major-arcana-upright-completion-audit.md](./major-arcana-upright-completion-audit.md) | Duplicate line refs, tail heading defects, coverage table, methodology |
| [TWO-CARD-CORPUS-AUDIT.md](./TWO-CARD-CORPUS-AUDIT.md) | Pre-ingest format, template, naming, export hygiene |
| [existing-two-card-planning-discovery.md](./existing-two-card-planning-discovery.md) | How prior split plans map to this index |

Architecture / migration / SEO plans remain separate: `TWO-CARD-ARCHITECTURE-PLAN.md`, `TWO-CARD-MIGRATION-PLAN.md`, `TWO-CARD-SEO-AEO-PLAN.md`.

---

## Manual completion priority

1. **Complete The Empress as first card** — 21 pairings (0/21 today).
2. **Complete The Emperor as first card** — 21 pairings.
3. **Complete The Hierophant as first card** — 21 pairings.
4. **Fill other first-card gaps** where Empress, Emperor, or Hierophant are **second** card (Fool block already has all three).
5. **Complete late arc** first-card gaps (World, Moon, Sun, Star, Judgement, Temperance, Devil, Tower, Hermit, Justice, Wheel of Fortune).
6. **Merge 7 duplicate** ordered pairs — see completion audit §5.
7. **Fix tail** `## The Sun Enters` headings where the first card is not The Sun (~lines 30206–31840).

After each editorial batch: `node scripts/audit-two-card-corpus.mjs` until complete = 462, missing = 0, duplicates = 0.

---

## Roles and boundaries

| Who | May do |
|-----|--------|
| **Leigh** | Write all missing interpretive pair meanings manually in the master file. |
| **Cursor** | Audit, count, scaffold checklists, validate structure, detect duplicates, report issues. |

**Cursor must not** generate interpretive pair meanings unless explicitly asked for a small, reviewable draft.

**Out of scope for this plan:** Symbolic Lexicon card records, public website pages, Tarot Word Match, ingest/split to `src/data/symbolic-lexicon/pairings/`, merging two-card copy into single-card records.

---

## Re-run audit

```bash
node scripts/audit-two-card-corpus.mjs
```
