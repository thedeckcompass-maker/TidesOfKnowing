# Repeating Card Editorial Progress

Permanent production tracker for the Symbolic Reference Library (Repeating Card Meanings) editorial reconstruction.

**Last updated:** 2026-10-06

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
| Major Arcana | 22 | 3 | 0 | 0 | 0 | 5 | 0 | 14 |
| Cups | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| Swords | 14 | 13 | 0 | 0 | 0 | 0 | 1 | 0 |
| Wands | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| Pentacles | 14 | 12 | 0 | 0 | 0 | 0 | 1 | 1 |
| **Total** | **78** | **56** | **0** | **0** | **0** | **5** | **2** | **15** |

The first three five-card publication groups are deployed and live-verified, for fifteen cards. The owner resumed continued batched publication on 2026-10-06. This batch contains Temperance, The Tower, The Star, The Moon, Judgement. Cards with unresolved protected wording choices remain held separately. Previous production/source archives are preserved; fresh local, preview and live gates govern each release. Historical reinserted rows remain earlier implementation records, not current whole-card review claims.

---

# Major Arcana

| Card | Collection ID | Status | Date | Notes |
|------|---------------|--------|------|-------|
| ☐ Fool | `majors/the-fool` | DEPLOYED | 2026-10-03 | Accepted whole-card language audit imported after authoritative chat-file placement. Previous production preserved as v3-editorial; exact accepted source and per-card provenance retained. Three approved metadata fields only; EOF-only deployment normalisation documented. |
| ☐ Magician | `majors/the-magician` | DEPLOYED | 2026-10-03 | First-group reviewed source deployed via PR #13 at merge 400db99 on 2026-10-03. Exact Pages deployment and both live routes verified; source/archive/provenance preserved. |
| ☐ High Priestess | `majors/the-high-priestess` | DEPLOYED | 2026-10-05 | Second-group whole-card review and local build passed. Two approved answer metadata values only; exact source, current-production baseline, v3 archive and EOF-only derivative retained. Deployed via PR #14 at merge 7be7f534; Cloudflare Pages c64a4f22 and both live routes verified. |
| ☐ Empress | `majors/the-empress` | DEPLOYED | 2026-10-03 | First-group reviewed source deployed via PR #13 at merge 400db99 on 2026-10-03. Exact Pages deployment and both live routes verified; source/archive/provenance preserved. |
| ☐ Emperor | `majors/the-emperor` | DEPLOYED | 2026-10-05 | Second-group whole-card review and local build passed. Two approved answer metadata values only; exact source, current-production baseline and v2 archive retained. Deployed via PR #14 at merge 7be7f534; Cloudflare Pages c64a4f22 and both live routes verified. |
| ☐ Hierophant | `majors/the-hierophant` | DEPLOYED | 2026-10-03 | First-group reviewed source deployed via PR #13 at merge 400db99 on 2026-10-03. Exact Pages deployment and both live routes verified; source/archive/provenance preserved. |
| ☐ Lovers | `majors/the-lovers` | DEPLOYED | 2026-10-05 | Whole-card review confirmed existing production prose and metadata. Accepted source has one additional terminal LF; normalised deployment remains byte-identical to main. Exact source, baseline, v2 archive and review provenance retained. Deployed via PR #14 at merge 7be7f534; Cloudflare Pages c64a4f22 and both live routes verified. |
| ☐ Chariot | `majors/the-chariot` | DEPLOYED | 2026-10-05 | Exact reviewed map restoration prepared with unchanged topology and metadata. All three reader-context wording decisions approved and applied on 2026-10-05; previous reviewed bytes retained separately. Baseline, v2 archive, accepted source and EOF derivative retained. Fresh final build, contracts and all ten local routes passed. Deployed via PR #14 at merge 7be7f534; Cloudflare Pages c64a4f22 and both live routes verified. |
| ☐ Strength | `majors/strength` | DEPLOYED | 2026-10-05 | Second-group whole-card review and local build passed; no metadata changes. Exact source, current-production baseline and v2 archive retained. Deployed via PR #14 at merge 7be7f534; Cloudflare Pages c64a4f22 and both live routes verified. |
| ☐ Hermit | `majors/the-hermit` | DEPLOYED | 2026-10-05 | Exact reviewed source and immediate production archive retained; contract and exact-label gates passed. Fresh candidate build, 78-card checks and all ten complete local routes passed; PR #15 merged as 74dd527; exact-commit Pages 63159609 and both live routes verified on 2026-10-05. |
| ☐ Wheel of Fortune | `majors/wheel-of-fortune` | DEPLOYED | 2026-10-05 | Exact reviewed source and immediate production archive retained; contract and exact-label gates passed. Fresh candidate build, 78-card checks and all ten complete local routes passed; PR #15 merged as 74dd527; exact-commit Pages 63159609 and both live routes verified on 2026-10-05. |
| ☐ Justice | `majors/justice` | DEPLOYED | 2026-10-05 | Exact reviewed source and immediate production archive retained; contract and exact-label gates passed. Fresh candidate build, 78-card checks and all ten complete local routes passed; PR #15 merged as 74dd527; exact-commit Pages 63159609 and both live routes verified on 2026-10-05. |
| ☐ Hanged Man | `majors/the-hanged-man` | DEPLOYED | 2026-10-05 | Exact reviewed source and immediate production archive retained; contract and exact-label gates passed. Fresh candidate build, 78-card checks and all ten complete local routes passed; PR #15 merged as 74dd527; exact-commit Pages 63159609 and both live routes verified on 2026-10-05. |
| ☐ Death | `majors/death` | DEPLOYED | 2026-10-05 | Exact reviewed source and immediate production archive retained; contract and exact-label gates passed. Fresh candidate build, 78-card checks and all ten complete local routes passed; PR #15 merged as 74dd527; exact-commit Pages 63159609 and both live routes verified on 2026-10-05. Action 2 is Allow the grief its own time.; action 7 remains Trust the dark., as expressly approved. |
| ☐ Temperance | `majors/temperance` | QA COMPLETE | 2026-10-06 | Exact full reviewed source imported after contract and strict action-label checks; accepted source, immediate baseline and version archive retained. Fresh candidate build, 78-card validators, independent source/import/scope and all complete local routes passed. Exact-commit preview and live checks remain required. |
| ☐ Devil | `majors/the-devil` | NOT STARTED | | |
| ☐ Tower | `majors/the-tower` | QA COMPLETE | 2026-10-06 | Exact full reviewed source imported after contract and strict action-label checks; accepted source, immediate baseline and version archive retained. Fresh candidate build, 78-card validators, independent source/import/scope and all complete local routes passed. Exact-commit preview and live checks remain required. |
| ☐ Star | `majors/the-star` | QA COMPLETE | 2026-10-06 | Exact full reviewed source imported after contract and strict action-label checks; accepted source, immediate baseline and version archive retained. Fresh candidate build, 78-card validators, independent source/import/scope and all complete local routes passed. Exact-commit preview and live checks remain required. |
| ☐ Moon | `majors/the-moon` | QA COMPLETE | 2026-10-06 | Exact full reviewed source imported after contract and strict action-label checks; accepted source, immediate baseline and version archive retained. Fresh candidate build, 78-card validators, independent source/import/scope and all complete local routes passed. Exact-commit preview and live checks remain required. |
| ☐ Sun | `majors/the-sun` | NOT STARTED | | |
| ☐ Judgement | `majors/judgement` | QA COMPLETE | 2026-10-06 | Exact full reviewed source imported after contract and strict action-label checks; accepted source, immediate baseline and version archive retained. Fresh candidate build, 78-card validators, independent source/import/scope and all complete local routes passed. Exact-commit preview and live checks remain required. |
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
| ☐ King | `pentacles/king-of-pentacles` | DEPLOYED | 2026-10-03 | First-group reviewed source deployed via PR #13 at merge 400db99 on 2026-10-03. Exact Pages deployment and both live routes verified; source/archive/provenance preserved. |

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

| 2026-10-05 | High Priestess, Emperor, Lovers, Chariot and Strength | AUTHORISED RELEASE | Owner accepted all three exact Chariot reader-context changes and authorised this five-card batch plus its technical/archive files after fresh checks. Exact reviewed sources and baseline-only EOF derivatives are preserved. Lovers production remains byte-identical. Fresh final build, 78-card checks and all ten complete local routes passed. Exact-commit preview and live evidence govern completion. |

| 2026-10-05 | High Priestess, Emperor, Lovers, Chariot and Strength | DEPLOYED | PR #14 merged as 7be7f534 at 20:42 UTC. Exact merged-commit Cloudflare Pages c64a4f22 succeeded at 20:44 UTC; all ten public routes were verified by 20:46 UTC. Source and archive bindings are retained. |
| 2026-10-05 | Hermit, Wheel of Fortune, Justice, Hanged Man and Death | AUTHORISED RELEASE | Owner authorised fresh build/preview checks and publication once they pass at 23:05 UTC. Exact accepted sources are imported with no EOF transformation. Death own-time and Trust-the-dark decisions are resolved; technical/archive files remain scoped to this release. Fresh candidate build, all five contracts, 78-card checks and all ten complete local routes passed. Exact-commit preview and live checks still govern publication. |

| 2026-10-06 | Temperance, The Tower, The Star, The Moon, Judgement | AUTHORISED RELEASE | Owner resumed continued publication of unblocked reviewed cards in five-card batches. Exact accepted sources, strict label gates, current-main archives and independent source evidence bind this release. Fresh candidate build, source/import/whole-route QA and 78-card checks passed. Exact-commit preview and live verification remains required. |
