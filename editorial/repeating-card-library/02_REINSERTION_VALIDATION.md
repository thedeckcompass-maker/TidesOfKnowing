# Reinsertion Validation Protocol

**Mandatory before every card reinsertion.**

Governed by the [**Editorial Reinsertion Contract**](03_EDITORIAL_REINSERTION_CONTRACT.md).

Compare the rewritten file against the extracted original. If any difference exists outside approved editable fields, **stop and report** — do not reinsert.

---

## Comparison sources

| File | Role |
|------|------|
| `editorial/repeating-card-library/extracted/{suit}/{slug}.md` | Original (production source copy section) |
| `editorial/repeating-card-library/contracts/{suit}/{slug}.yaml` | Per-card contract (declares approved frontmatter edits) |
| Rewritten file from external editor | Candidate for reinsertion |
| `src/content/repeating-card-meanings/{suit}/{slug}.md` | Reinsertion target (only after validation passes) |

---

## Automated validation (required)

**Step 1 — Global integrity audit (blocking):**

```bash
npm run audit:rcm-integrity
```

Verifies 78 cards, suit counts, unique collection IDs, frontmatter slugs, canonical URLs, and one file per card.

**Step 2 — EOF newline normalisation (automatic, baseline-driven):**

```bash
node scripts/normalise-rcm-eof.mjs \
  --contract editorial/repeating-card-library/contracts/{suit}/{slug}.yaml
```

Runs automatically in the orchestrated reinsert workflow before contract validation.

This is the **only authorised automatic structural correction**. It adjusts trailing `\n` characters at the absolute end of the Claude working copy so they match the card's `extracted_baseline` EOF pattern exactly. It does not alter prose, internal blank lines, headings, lists, markers, or frontmatter.

**Step 3 — Contract validation:**

```bash
node scripts/validate-rcm-editorial-reinsertion.mjs \
  --contract editorial/repeating-card-library/contracts/majors/the-fool.yaml \
  editorial/repeating-card-library/claude/majors/the-fool.md
```

Exit code `0` = contract satisfied.  
Exit code `1` = violation — do not reinsert.

**Orchestrated workflow** (pre/post audit, EOF normalisation, archive, production, `.astro` cache clear, sync, build):

```bash
node scripts/reinsert-rcm-editorial.mjs \
  --contract editorial/repeating-card-library/contracts/{suit}/{slug}.yaml
```

Dry run (audit + contract only, no production write):

```bash
node scripts/reinsert-rcm-editorial.mjs --contract ... --dry-run
```

---

## Editable vs immutable

### Always editable (body)

- Paragraph prose under existing headings
- Blockquote (`>`) text
- List item text after `N. `

### Editable only when declared (frontmatter)

- Values for fields listed in `allowed_frontmatter_edits` in the per-card contract
- Field names and key order remain immutable

### Always immutable

- Frontmatter keys and key order
- Unapproved frontmatter values
- All headings (H1, H2)
- Section order and count
- Horizontal rules, list numbering, action headers
- Everything outside the markdown file

---

## On failure — STOP immediately

If contract validation **fails** (after EOF normalisation), **stop immediately**. Do not archive, write production, run a build, or commit.

### Authorised automatic correction (EOF only)

Before contract validation, the orchestrated workflow runs `scripts/normalise-rcm-eof.mjs`. This may adjust **only** the trailing newline sequence at the absolute end of the Claude working copy to match that card's `extracted_baseline`. It is baseline-driven (not a hardcoded newline count).

### Prohibited without explicit owner approval

Agents and editors must **never automatically** fix any other structural mismatch:

- split or merge paragraphs
- add or remove **internal** blank lines
- alter list items (numbering, count, or structure)
- restore Markdown markers (`---`, headings, action headers)
- edit the Claude working copy for any reason other than baseline EOF normalisation
- repair any prose or structure in production or `claude/`

No correction may be made without explicit approval. This rule applies to **every remaining card**.

### Required failure report

When validation fails, report the validator output including, for each mismatch:

| Field | Description |
|-------|-------------|
| **Original position** | Body line number (and line kind: prose, `---`, heading, list item, blank) |
| **Rewritten position** | Corresponding body line number in the Claude working copy |
| **Nature** | `missing`, `added`, `merged`, `reordered`, or `structural_marker_changed` |
| **Original content** | The original line or block at that position (truncated if long) |
| **Rewritten content** | The rewritten line or block at that position |
| **Word content** | Whether substantive words appear absent (not merely reflowed on the same line) |

The validation script prints a **Structural mismatch report** section on failure. Copy that report in full. Do not attempt silent repair.

Do not write to production.

---

## On success

1. Owner sign-off on contract (`approved_by`, `reinsertion_date`)
2. Run orchestrated reinsert (or manual archive + copy)
3. Post-reinsertion `npm run audit:rcm-integrity` (included in orchestrated script)
4. `.astro` cache cleared, content store synced, `npm run build` (included in orchestrated script)
5. Spot-check entity page (`/repeating-card-meanings/{slug}/`) and tool deep-link (`/tools/repeating-card-meanings/{collection-id}/`)
6. Update `docs/repeating-card-editorial-progress.md`
7. Git commit and deploy
