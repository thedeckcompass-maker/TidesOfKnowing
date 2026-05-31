# Two-Card Writing Session — Stopping Point

**Date:** 2026-05-31  
**Corpus:** `content-intake/two-card-corpus/major-arcana-upright-ordered-pairs-master.md`  
**Audit:** `node scripts/audit-two-card-corpus.mjs` (run at session close)

---

## What was completed today

Manually drafted and inserted **27** ordered upright Major Arcana pairings (exact wording preserved). All targeted first-card blocks below are now **21/21** per audit:

### 1. The Hierophant–first block (13)

- The Hierophant → The Hermit
- The Hierophant → Wheel of Fortune
- The Hierophant → Justice
- The Hierophant → The Hanged Man
- The Hierophant → Death
- The Hierophant → Temperance
- The Hierophant → The Devil
- The Hierophant → The Tower
- The Hierophant → The Star
- The Hierophant → The Moon
- The Hierophant → The Sun
- The Hierophant → Judgement
- The Hierophant → The World

### 2. The Lovers–first block (3)

- The Lovers → The Empress
- The Lovers → The Emperor
- The Lovers → The Hierophant

### 3. The Chariot–first block (3)

- The Chariot → The Empress
- The Chariot → The Emperor
- The Chariot → The Hierophant

### 4. Strength–first block (3)

- Strength → The Empress
- Strength → The Emperor
- Strength → The Hierophant

### 5. The Hermit–first block (5)

- The Hermit → The Empress
- The Hermit → The Emperor
- The Hermit → The Hierophant
- The Hermit → Death
- The Hermit → The Tower

**Insertion region:** contiguous gap-fill block after `The Hierophant – The World`, ending with `The Hermit – The Tower`, immediately before legacy `THE MAGICIAN — THE LOVERS`.

---

## Current audit snapshot

| Metric | Count |
|--------|------:|
| Expected ordered pairings | **462** |
| Complete (chunk + template) | **363** |
| Missing | **99** |
| Complete + missing | **462** ✓ |

**Prior session baseline:** 336 complete / 126 missing (before today’s 27 inserts).  
**Expected after 27 inserts:** 363 complete / 99 missing — **matches audit.**

Regenerated at close:

- `docs/two-card-system/missing-pairings.json`
- `docs/two-card-system/MISSING-PAIRINGS-CHECKLIST.md`
- `docs/two-card-system/COMPLETE-PAIRINGS-LIST.md`

**Build:** `npm run build` — **success** (exit 0).

---

## Next 20 missing pairings (canonical order)

1. The High Priestess → The Hierophant
2. The Empress → The Fool
3. The Empress → Justice
4. Wheel of Fortune → The Empress
5. Wheel of Fortune → The Emperor
6. Wheel of Fortune → The Hierophant
7. Wheel of Fortune → The Moon
8. Justice → The Magician
9. Justice → The Empress
10. Justice → The Emperor
11. Justice → The Hierophant
12. Justice → The Hermit
13. The Hanged Man → The Empress
14. The Hanged Man → The Emperor
15. The Hanged Man → The Hierophant
16. Death → The Empress
17. Death → The Emperor
18. Death → The Hierophant
19. Temperance → The Empress
20. Temperance → The Emperor

---

## Next recommended writing block

**Wheel of Fortune–first contiguous gap-fill** in the pre-legacy insertion region (after `The Hermit – The Tower`, before `THE MAGICIAN — THE LOVERS`):

- Wheel of Fortune → The Empress
- Wheel of Fortune → The Emperor
- Wheel of Fortune → The Hierophant
- Wheel of Fortune → The Moon

Alternatively, in strict canonical checklist order, start with **The High Priestess → The Hierophant** (single gap), then **The Empress → The Fool** and **The Empress → Justice**.

---

## Audit warnings (non-blocking for today’s inserts)

### Duplicate full entries (7)

Count once toward complete; extra chunks should be merged later:

| Pairing | Notes |
|---------|--------|
| The Hermit → Justice | Lines ~24431, ~24673 |
| The Hanged Man → The Hermit | Lines ~25039, ~25279 |
| The Hermit → Temperance | Lines ~25641, ~25879 |
| The Devil → The Hermit | Lines ~26241, ~26481 |
| The Tower → The Hermit | Lines ~26727, ~26975 (em dash vs hyphen) |
| The Hermit → The Star | Lines ~26851, ~27101 |
| The Star → Wheel of Fortune | Lines ~30263, ~30513 |

### Tail heading defects (7)

Wrong `## The Sun Enters` where first card ≠ The Sun (fix headings only; do not rewrite meanings):

- Judgement → The Star (~37636 / defect ~37658)
- The World → The Star (~37808 / ~37830)
- Judgement → The Moon (~38150 / ~38172)
- The World → The Moon (~38322 / ~38344)
- Judgement → The Sun (~38494 / ~38516)
- The World → The Sun (~38666 / ~38688)
- Judgement → The World (~38752 / ~38774)

### Other metrics

- **Complete chunks (incl. duplicates):** 370
- **Heading-only incomplete chunks:** 55 (headings without full template)
- **Detected pairing headings:** 427 (418 unique)
- **Invalid self-pairings:** 0
- **Malformed / uncertain headings:** 0

---

## Roles and boundaries

- **Leigh** writes all missing interpretive pair meanings manually in the master corpus.
- **Cursor** may audit, scaffold checklists, validate structure, detect duplicates, and insert pasted prose **without rewriting**.
- **Cursor must not** generate interpretive pair meanings unless explicitly asked for a small, reviewable draft.

**Out of scope:** Symbolic Lexicon, public website pages, Tarot Word Match, unrelated files.

---

## Re-run before next session

```bash
node scripts/audit-two-card-corpus.mjs
npm run build
```
