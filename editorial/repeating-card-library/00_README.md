# Repeating Card Library — Editorial Workflow

This workspace supports the full editorial reconstruction of the Tides of Knowing Symbolic Reference Library (Repeating Card Meanings). It is a **production pipeline**, not a content rewrite environment.

**Production files are never edited directly** until the Editorial Reinsertion Contract has passed.

Master progress tracker: [`docs/repeating-card-editorial-progress.md`](../../docs/repeating-card-editorial-progress.md)

---

## Lifecycle

```
Production Source
      ↓
Claude Working Copy
      ↓
Claude Rewrite
      ↓
Editorial Review
      ↓
Editorial Reinsertion Contract
      ↓
Archive Previous Production Version
      ↓
Update Production
      ↓
Git Commit
      ↓
Deploy
```

| Stage | Location | Purpose |
|-------|----------|---------|
| Production Source | `src/content/repeating-card-meanings/{suit}/{slug}.md` | Live site content (read-only during editorial) |
| Claude Working Copy | `claude/{suit}/{slug}.md` | **Only folder used for rewriting** |
| Claude Rewrite | Same Claude file after external edit | Working copy updated with rewritten markdown |
| Editorial Review | Human review of Claude output | Confirm editorial intent before validation |
| Contract validation | `scripts/validate-rcm-editorial-reinsertion.mjs` | Structural gate vs `extracted/` baseline |
| Version archive | `archive/{suit}/{slug}/vN-*.md` | Snapshot of production **immediately before** each update |
| Production reinsertion | `src/content/repeating-card-meanings/{suit}/{slug}.md` | Only after contract passes and archive completes |

---

## Per-card workflow

1. **Open** the Claude working copy: `claude/{suit}/{slug}.md`
2. **Copy** the entire file (frontmatter + body only)
3. **Paste** into Claude for editorial reconstruction
4. **Paste** Claude's rewritten markdown back into the same Claude working copy
5. **Review** editorial changes
6. **Run** the orchestrated reinsertion (pre/post integrity audit, validates, archives, updates production, clears `.astro`, syncs, builds):

```bash
node scripts/reinsert-rcm-editorial.mjs \
  --contract editorial/repeating-card-library/contracts/{suit}/{slug}.yaml
```

Dry run (pre-audit + contract validation only; no archive, no production write, no build):

```bash
node scripts/reinsert-rcm-editorial.mjs \
  --contract editorial/repeating-card-library/contracts/{suit}/{slug}.yaml \
  --dry-run
```

Global integrity audit (run standalone or as part of orchestrated reinsert):

```bash
npm run audit:rcm-integrity
```

Or run steps individually:

```bash
# 0. Integrity audit (blocking)
npm run audit:rcm-integrity

# 1. Contract validation
node scripts/validate-rcm-editorial-reinsertion.mjs \
  --contract editorial/repeating-card-library/contracts/{suit}/{slug}.yaml \
  editorial/repeating-card-library/claude/{suit}/{slug}.md

# 2. Archive current production (required before production write)
node scripts/archive-rcm-production-version.mjs \
  --contract editorial/repeating-card-library/contracts/{suit}/{slug}.yaml

# 3. Copy claude working copy to production (manual if not using orchestrator)
```

7. **Build**, spot-check, update progress tracker, **git commit**, deploy

If validation or archive fails: **stop immediately** and report. Do not write to production. Do not auto-repair the Claude working copy or production file. No correction without explicit owner approval. See [`02_REINSERTION_VALIDATION.md`](02_REINSERTION_VALIDATION.md).

---

## Directory structure

```
editorial/repeating-card-library/
├── 00_README.md
├── 01_IMMUTABLE_ARCHITECTURE.md
├── 02_REINSERTION_VALIDATION.md
├── 03_EDITORIAL_REINSERTION_CONTRACT.md
├── contracts/
│   ├── _TEMPLATE.yaml
│   └── {suit}/{slug}.yaml
├── claude/                    ← ONLY folder for editorial rewriting (78 cards)
│   ├── majors/
│   ├── cups/
│   ├── swords/
│   ├── wands/
│   └── pentacles/
├── archive/                   ← Editorial version history (independent of Git)
│   └── {suit}/{slug}/
│       ├── v1-original.md
│       ├── v2-editorial.md
│       └── v3-editorial.md …
├── extracted/                 ← Permanent archive (envelope + production snapshot)
└── rewritten/                 ← Optional QA snapshots after rewrite
```

### Folder roles

| Folder | Role |
|--------|------|
| `claude/` | Working copies for editorial rewrite. YAML frontmatter + markdown body only. |
| `archive/` | **Version history.** Every production state preserved before each reinsertion. Never overwritten. |
| `extracted/` | Permanent archive with editorial reconstruction envelope. Contract validation baseline. |
| `rewritten/` | Optional QA snapshots if needed. |
| `contracts/` | Per-card reinsertion contract declaring approved frontmatter edits. |

---

## Version archive rules

Independent of Git. Enables fast restore of any previous editorial generation.

| File | When created | Contents |
|------|--------------|----------|
| `v1-original.md` | Pipeline setup (once per card) | Untouched production before first editorial rewrite |
| `v2-editorial.md` | Before first production reinsertion | Exact production markdown immediately before that update |
| `v3-editorial.md` | Before second production reinsertion | Exact production markdown immediately before that update |
| `vN-editorial.md` | Before each subsequent reinsertion | Same rule — always the state immediately before the change |

**Never overwrite** a previous archive version. Each reinsertion creates a new numbered file.

To restore a previous version: copy the desired `archive/{suit}/{slug}/vN-*.md` to production (after contract review) or to the Claude working copy for further editing.

---

## Immutable architecture (binding)

This project is an **in-place editorial replacement only**. The library architecture is permanent and immutable.

**The only permitted changes are:**

1. **Body copy** beneath existing headings (always allowed)
2. **Frontmatter values** only for fields explicitly declared in the per-card contract

Read before any editorial work:

- [`03_EDITORIAL_REINSERTION_CONTRACT.md`](03_EDITORIAL_REINSERTION_CONTRACT.md) — mandatory for all 78 cards
- [`01_IMMUTABLE_ARCHITECTURE.md`](01_IMMUTABLE_ARCHITECTURE.md)
- [`02_REINSERTION_VALIDATION.md`](02_REINSERTION_VALIDATION.md)

---

## Claude working copy rules

Each file in `claude/` must contain **only**:

- YAML frontmatter
- Markdown body

Claude working copies are byte-for-byte mirrors of production at setup time. Only editorial text changes belong here after rewrite.

---

## Status markers

| Status | Meaning |
|--------|---------|
| NOT STARTED | No extraction yet |
| EXTRACTED | Archive in `extracted/` |
| UNDER EDITORIAL REVIEW | Rewrite in progress in `claude/` |
| READY FOR IMPORT | Contract validation passed |
| REINSERTED | Production file updated |
| QA COMPLETE | Build and spot-check passed |
| DEPLOYED | Live on production |

---

## Pilot card

**The Fool** (`majors/the-fool`) — first card for end-to-end workflow validation.
