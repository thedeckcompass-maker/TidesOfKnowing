# Editorial Reinsertion Contract

**Effective:** 2026-07-06  
**Applies to:** All 78 Repeating Card Meanings cards  
**Status:** Mandatory for every reinsertion

This contract governs every editorial reinsertion in the Symbolic Reference Library reconstruction project. No card may be written to production without satisfying this contract.

---

## 1. Scope

This is an **in-place editorial replacement**. The Repeating Card Meanings architecture is immutable. Reinsertion updates a single production file:

```
src/content/repeating-card-meanings/{suit}/{slug}.md
```

Nothing outside that file may change during editorial reinsertion.

---

## 2. Editable areas (only)

### A. Body copy beneath existing headings

Always editable without additional declaration:

| Type | Location |
|------|----------|
| Paragraph prose | All text under existing `#` and `##` headings |
| Blockquote text | Pull quote line(s) beginning with `>` |
| List item text | Numbered items under Reflective Questions and integration actions |
| Inline emphasis | `**bold**` wording within prose lines |

### B. Frontmatter values (owner-declared only)

Frontmatter **field names, key order, and structure** are immutable.

A frontmatter **value** may change only when the owner has **explicitly declared** that field as editable for that card in the per-card contract file:

```
editorial/repeating-card-library/contracts/{suit}/{slug}.yaml
```

List approved fields under `allowed_frontmatter_edits`. An empty list means frontmatter must be byte-identical to the extracted original.

**Never editable via this contract:** slugs, URLs, `card_number`, `arcana`, `suit`, `canonicalUrl`, `openGraphImage`, or any field that affects routing, identity, or site architecture — unless the owner explicitly overrides in writing for a specific card.

---

## 3. Immutable (never change without separate explicit approval)

- Slugs, collection IDs, file paths, URLs
- Heading text, heading levels, heading count, section order
- Section names, anchors, IDs
- Frontmatter field names and key order
- Unapproved frontmatter values
- Horizontal rules (`---`) in body
- List numbering structure and item count
- Action header lines (`**Label.**`) in Practical Integration Actions
- Schema, components, rendering, CSS, data model
- JSON-LD, breadcrumbs, canonical tags, Open Graph logic
- Internal links, navigation, related-card map
- Images and image paths

---

## 4. Per-card contract (required)

Before each reinsertion, a per-card contract must exist:

```
editorial/repeating-card-library/contracts/{suit}/{slug}.yaml
```

Copy from `contracts/_TEMPLATE.yaml`. Fill in:

- `collection_id`
- `allowed_frontmatter_edits` (empty unless owner has named specific fields)
- `reinsertion_date` when ready
- `approved_by` (owner sign-off)

---

## 5. Mandatory validation (automatic)

Before writing to production:

1. **Global integrity audit** — `npm run audit:rcm-integrity` (blocking)
2. **EOF newline normalisation** — `scripts/normalise-rcm-eof.mjs` (automatic; Claude working copy only; baseline-driven)
3. **Contract validation** — `scripts/validate-rcm-editorial-reinsertion.mjs`

After writing to production:

3. **Post-reinsertion integrity audit** — `npm run audit:rcm-integrity` again
4. **Cache + build** — clear `.astro/` only, `npx astro sync`, `npm run build` (orchestrated script does this)

```bash
node scripts/validate-rcm-editorial-reinsertion.mjs \
  --contract editorial/repeating-card-library/contracts/{suit}/{slug}.yaml \
  editorial/repeating-card-library/claude/{suit}/{slug}.md
```

The script:

1. Loads the extracted production baseline from the contract
2. Compares the rewritten file against that baseline
3. Permits differences only in body copy and owner-declared frontmatter fields
4. **Stops with a diff report** if anything else has changed

### Integrity audit (blocking failures)

`npm run audit:rcm-integrity` fails on real collisions:

- Wrong total or suit card counts
- Duplicate Astro collection IDs
- Duplicate frontmatter `slug` values
- Duplicate `canonicalUrl` values
- Multiple source files mapping to one card

**Not a blocking failure:** Astro `[glob-loader] Duplicate id` during content sync when a card's digest changes. That is a misleading loader warning, not duplicate published content.

### Dual URL surfaces (intentional)

One markdown file powers:

- Entity page: `/repeating-card-meanings/{card-slug}/`
- Tool page: `/tools/repeating-card-meanings/{collection-id}/`

Both routes read the same collection entry. This is by design.

### Diagnostic discipline

- Investigations are **read-only by default**
- Never modify production card files experimentally
- Never clear caches or run builds during diagnostics unless authorised for reinsertion QA

### Outcomes

| Result | Action |
|--------|--------|
| **PASS** | Proceed to owner review, then reinsert to production path |
| **FAIL** | **STOP immediately.** Do not write to production. Report structural mismatches in full. Wait for explicit owner approval before any correction. |

### Dry-run failure — mandatory stop

If contract validation exits non-zero after EOF normalisation:

1. **Stop** — do not archive, reinsert, build, or commit
2. **Report** the structural mismatch output (original vs rewritten positions, nature of change, whether words appear missing)
3. **Do not** automatically fix non-EOF structural issues
4. **Wait** for explicit owner approval before any other repair

EOF newline normalisation is the only step that may run without owner approval. All other structural mismatches remain blocking failures.

---

## 6. Reinsertion procedure

1. Confirm per-card contract exists with correct `allowed_frontmatter_edits`
2. Run `npm run audit:rcm-integrity` (pre)
3. Run contract validation (must exit 0)
4. **Archive current production** before any write (or use orchestrated script below)
5. Owner reviews prose changes (and any declared frontmatter changes)
6. Copy validated file to production, or use orchestrated reinsert
7. Run `npm run audit:rcm-integrity` (post)
8. Clear `.astro/` cache, `npx astro sync`, `npm run build`
9. Spot-check entity + tool URLs
10. Update `docs/repeating-card-editorial-progress.md`
11. Git commit and deploy

Orchestrated script (steps 2–8):

```bash
node scripts/reinsert-rcm-editorial.mjs \
  --contract editorial/repeating-card-library/contracts/{suit}/{slug}.yaml
```

Dry run (pre-audit + contract only):

```bash
node scripts/reinsert-rcm-editorial.mjs --contract ... --dry-run
```

Manual archive:

```bash
node scripts/archive-rcm-production-version.mjs \
  --contract editorial/repeating-card-library/contracts/{suit}/{slug}.yaml
```

**If validation or integrity audit fails at any step: stop. Do not reinsert.**

---

## 7. Agent obligations

- Treat this contract as binding for all 78 cards
- Never skip validation before reinsertion
- If contract validation fails after EOF normalisation: **stop immediately** and report; do not proceed
- EOF newline normalisation is the only authorised automatic structural fix (baseline-driven; absolute EOF only)
- Never auto-fix any other structural differences
- Never add, remove, or rename frontmatter keys
- Never alter headings, section order, or structural markdown without explicit owner approval
- Report violations with original/rewritten positions and wait for owner direction

---

## Related documents

| Document | Purpose |
|----------|---------|
| [`01_IMMUTABLE_ARCHITECTURE.md`](01_IMMUTABLE_ARCHITECTURE.md) | Architecture immutability policy |
| [`02_REINSERTION_VALIDATION.md`](02_REINSERTION_VALIDATION.md) | Validation protocol detail |
| [`contracts/_TEMPLATE.yaml`](contracts/_TEMPLATE.yaml) | Per-card contract template |
| [`00_README.md`](00_README.md) | Full editorial workflow |
