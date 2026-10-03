# Repeating Card Editorial Progress

Permanent production tracker for the Symbolic Reference Library (Repeating Card Meanings) editorial reconstruction.

**Last updated:** 2026-10-03

## Immutable architecture (binding)

This project is **in-place editorial replacement only**. Architecture is immutable.

**Editable:** body copy beneath existing headings; frontmatter values only when declared in per-card contract.

**Contract:** `editorial/repeating-card-library/03_EDITORIAL_REINSERTION_CONTRACT.md`

Before every reinsertion: run `scripts/validate-rcm-editorial-reinsertion.mjs --contract ...`. Stop and report on any unapproved difference.

---

## Status legend

| Status | Meaning |
|--------|---------|
| NOT STARTED | No extraction yet |
| EXTRACTED | Production copy exported to `editorial/repeating-card-library/extracted/` |
| UNDER EDITORIAL REVIEW | With external editor |
| READY FOR IMPORT | QA passed, awaiting reinsertion |
| REINSERTED | Production file updated |
| QA COMPLETE | Build and spot-check passed |
| DEPLOYED | Live on production |

---

## Progress summary

| Suit | Total | Not started | Extracted | In review | Ready for import | Local QA complete | Historical reinserted | Deployed |
|------|-------|-------------|-----------|-----------|------------------|-------------------|-----------------------|----------|
| Major Arcana | 22 | 17 | 0 | 0 | 0 | 3 | 1 | 1 |
| Cups | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| Swords | 14 | 13 | 0 | 0 | 0 | 0 | 1 | 0 |
| Wands | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| Pentacles | 14 | 12 | 0 | 0 | 0 | 1 | 1 | 0 |
| **Total** | **78** | **70** | **0** | **0** | **0** | **4** | **3** | **1** |

Counts reflect the card rows in this repository tracker. The four local QA-complete cards received the owner's public repository and website publication approval at 19:30 UTC; preview and live checks remain required. Historical reinserted rows are retained as earlier implementation records and do not establish review against the current governing brief.

---

# Major Arcana

| Card | Collection ID | Status | Date | Notes |
|------|---------------|--------|------|-------|
| ☐ Fool | `majors/the-fool` | DEPLOYED | 2026-10-03 | Accepted whole-card language audit imported after authoritative chat-file placement. Previous production preserved as v3-editorial; exact accepted source and per-card provenance retained. Three approved metadata fields only; EOF-only deployment normalisation documented. |
| ☐ Magician | `majors/the-magician` | QA COMPLETE | 2026-10-03 | Final whole-card reviewed source preserved; only featuredSnippetAnswer metadata allowed. v3 archive and exact EOF derivative recorded. Owner-approved Core sentence clarification applied; exact prior reviewed hash retained. Final batch build and preview/live checks govern release. |
| ☐ High Priestess | `majors/the-high-priestess` | REINSERTED | 2026-07-07 | Editorial rewrite complete. v2-editorial archived. Build passed. |
| ☐ Empress | `majors/the-empress` | QA COMPLETE | 2026-10-03 | Final whole-card reviewed version prepared; only summary metadata allowed. Exact source and v2 archive preserved; individual contract passed. Aggregate four-card build and both rendered routes passed. Owner approved public repository and website publication after preview checks at 19:30 UTC. |
| ☐ Emperor | `majors/the-emperor` | NOT STARTED | | |
| ☐ Hierophant | `majors/the-hierophant` | QA COMPLETE | 2026-10-03 | Only terminal 45678 removed; earlier approved prose and metadata unchanged. Exact source, EOF derivative and v2 archive preserved; individual contract passed. Aggregate four-card build and both rendered routes passed. Owner approved public repository and website publication after preview checks at 19:30 UTC. |
| ☐ Lovers | `majors/the-lovers` | NOT STARTED | | |
| ☐ Chariot | `majors/the-chariot` | NOT STARTED | | |
| ☐ Strength | `majors/strength` | NOT STARTED | | |
| ☐ Hermit | `majors/the-hermit` | NOT STARTED | | |
| ☐ Wheel of Fortune | `majors/wheel-of-fortune` | NOT STARTED | | |
| ☐ Justice | `majors/justice` | NOT STARTED | | |
| ☐ Hanged Man | `majors/the-hanged-man` | NOT STARTED | | |
| ☐ Death | `majors/death` | NOT STARTED | | |
| ☐ Temperance | `majors/temperance` | NOT STARTED | | |
| ☐ Devil | `majors/the-devil` | NOT STARTED | | |
| ☐ Tower | `majors/the-tower` | NOT STARTED | | |
| ☐ Star | `majors/the-star` | NOT STARTED | | |
| ☐ Moon | `majors/the-moon` | NOT STARTED | | |
| ☐ Sun | `majors/the-sun` | NOT STARTED | | |
| ☐ Judgement | `majors/judgement` | NOT STARTED | | |
| ☐ World | `majors/the-world` | NOT STARTED | | |

---

# Cups

| Card | Collection ID | Status | Date | Notes |
|------|---------------|--------|------|-------|
| ☐ Ace | `cups/ace-of-cups` | NOT STARTED | | |
| ☐ Two | `cups/two-of-cups` | NOT STARTED | | |
| ☐ Three | `cups/three-of-cups` | NOT STARTED | | |
| ☐ Four | `cups/four-of-cups` | NOT STARTED | | |
| ☐ Five | `cups/five-of-cups` | NOT STARTED | | |
| ☐ Six | `cups/six-of-cups` | NOT STARTED | | |
| ☐ Seven | `cups/seven-of-cups` | NOT STARTED | | |
| ☐ Eight | `cups/eight-of-cups` | NOT STARTED | | |
| ☐ Nine | `cups/nine-of-cups` | NOT STARTED | | |
| ☐ Ten | `cups/ten-of-cups` | NOT STARTED | | |
| ☐ Page | `cups/page-of-cups` | NOT STARTED | | |
| ☐ Knight | `cups/knight-of-cups` | NOT STARTED | | |
| ☐ Queen | `cups/queen-of-cups` | NOT STARTED | | |
| ☐ King | `cups/king-of-cups` | NOT STARTED | | |

---

# Swords

| Card | Collection ID | Status | Date | Notes |
|------|---------------|--------|------|-------|
| ☐ Ace | `swords/ace-of-swords` | NOT STARTED | | |
| ☐ Two | `swords/two-of-swords` | NOT STARTED | | |
| ☐ Three | `swords/three-of-swords` | NOT STARTED | | |
| ☐ Four | `swords/four-of-swords` | NOT STARTED | | |
| ☐ Five | `swords/five-of-swords` | REINSERTED | 2026-07-07 | Editorial rewrite complete. v2-editorial archived. Build passed. |
| ☐ Six | `swords/six-of-swords` | NOT STARTED | | |
| ☐ Seven | `swords/seven-of-swords` | NOT STARTED | | |
| ☐ Eight | `swords/eight-of-swords` | NOT STARTED | | |
| ☐ Nine | `swords/nine-of-swords` | NOT STARTED | | |
| ☐ Ten | `swords/ten-of-swords` | NOT STARTED | | |
| ☐ Page | `swords/page-of-swords` | NOT STARTED | | |
| ☐ Knight | `swords/knight-of-swords` | NOT STARTED | | |
| ☐ Queen | `swords/queen-of-swords` | NOT STARTED | | |
| ☐ King | `swords/king-of-swords` | NOT STARTED | | |

---

# Wands

| Card | Collection ID | Status | Date | Notes |
|------|---------------|--------|------|-------|
| ☐ Ace | `wands/ace-of-wands` | NOT STARTED | | |
| ☐ Two | `wands/two-of-wands` | NOT STARTED | | |
| ☐ Three | `wands/three-of-wands` | NOT STARTED | | |
| ☐ Four | `wands/four-of-wands` | NOT STARTED | | |
| ☐ Five | `wands/five-of-wands` | NOT STARTED | | |
| ☐ Six | `wands/six-of-wands` | NOT STARTED | | |
| ☐ Seven | `wands/seven-of-wands` | NOT STARTED | | |
| ☐ Eight | `wands/eight-of-wands` | NOT STARTED | | |
| ☐ Nine | `wands/nine-of-wands` | NOT STARTED | | |
| ☐ Ten | `wands/ten-of-wands` | NOT STARTED | | |
| ☐ Page | `wands/page-of-wands` | NOT STARTED | | |
| ☐ Knight | `wands/knight-of-wands` | NOT STARTED | | |
| ☐ Queen | `wands/queen-of-wands` | NOT STARTED | | |
| ☐ King | `wands/king-of-wands` | NOT STARTED | | |

---

# Pentacles

| Card | Collection ID | Status | Date | Notes |
|------|---------------|--------|------|-------|
| ☐ Ace | `pentacles/ace-of-pentacles` | NOT STARTED | | |
| ☐ Two | `pentacles/two-of-pentacles` | NOT STARTED | | |
| ☐ Three | `pentacles/three-of-pentacles` | NOT STARTED | | |
| ☐ Four | `pentacles/four-of-pentacles` | NOT STARTED | | |
| ☐ Five | `pentacles/five-of-pentacles` | REINSERTED | 2026-07-07 | Editorial rewrite complete. v2-editorial archived. Build passed. |
| ☐ Six | `pentacles/six-of-pentacles` | NOT STARTED | | |
| ☐ Seven | `pentacles/seven-of-pentacles` | NOT STARTED | | |
| ☐ Eight | `pentacles/eight-of-pentacles` | NOT STARTED | | |
| ☐ Nine | `pentacles/nine-of-pentacles` | NOT STARTED | | |
| ☐ Ten | `pentacles/ten-of-pentacles` | NOT STARTED | | |
| ☐ Page | `pentacles/page-of-pentacles` | NOT STARTED | | |
| ☐ Knight | `pentacles/knight-of-pentacles` | NOT STARTED | | |
| ☐ Queen | `pentacles/queen-of-pentacles` | NOT STARTED | | |
| ☐ King | `pentacles/king-of-pentacles` | QA COMPLETE | 2026-10-03 | Exact approved full source-order map restored: 24 Core paragraphs, ten questions, seven actions. King-specific strict map gate and negative tests passed; original abbreviated production preserved as v2-editorial. |

---

## Editorial log

| Date | Card | Event | Notes |
|------|------|-------|-------|
| 2026-07-06 | The Fool | REINSERTED | Editorial rewrite. Contract passed. v2-editorial archived. Build clean. |
| 2026-07-07 | The Magician | REINSERTED | Editorial rewrite. Contract passed. v2-editorial archived. Build clean. |
| 2026-07-07 | The High Priestess | REINSERTED | Editorial rewrite. Contract passed. v2-editorial archived. Build clean. |
| 2026-07-07 | Five of Swords | REINSERTED | Editorial rewrite. Contract passed. v2-editorial archived. Build clean. |
| 2026-07-07 | Five of Pentacles | REINSERTED | Editorial rewrite. Contract passed. v2-editorial archived. Build clean. |
| 2026-10-03 | The Fool | QA COMPLETE | Owner accepted exact candidate at 16:54 UTC and authorised card-by-card publication at 17:44 UTC. Source-file placement verified at 17:51 UTC before import. Contract and integrity checks passed; v3-editorial preserves previous production. Exact accepted source and EOF-normalised deployment hashes are recorded in `editorial/repeating-card-library/provenance/majors/the-fool/2026-10-03.json`. Publication evidence is recorded in the corresponding Git commit, pull request and deployment receipt. |
| 2026-10-03 | The Fool | DEPLOYED | PR #12 merged as `fa90b6e5cd83eb089c81f147c61d259f14c04394`; exact-commit Cloudflare Pages deployment passed and both public URLs verified at 18:07 UTC. |
| 2026-10-03 | King of Pentacles | QA COMPLETE | Owner-authorised faithful restoration verified against the independent approved source-order map. Exact accepted bytes preserved; custom one-card gate validates all 165 units without changing the shared validator. Full build, integrity, metadata and link checks passed. Publication evidence is recorded in the corresponding Git commit, pull request and deployment receipt. |
| 2026-10-03 | Batch containing King, Hierophant, Empress and Magician | PREPARATION | Owner changed rollout to groups of five at 18:20 UTC. The Fool is already deployed as the first card. Prepare the remaining four locally, then obtain explicit repository-publication and deployment approval for the batch. No additional card is authorised for deployment before that approval. |
| 2026-10-03 | King, Hierophant, Empress and Magician | QA COMPLETE | Individual source gates, strict King restoration negatives, aggregate build, 78-card integrity/metadata/link checks and all eight rendered routes passed. Exact accepted files, pre-change archives and per-card provenance retained. Hold all repository writes and deployment until the owner approves this named four-card batch and public source/provenance destination. |
