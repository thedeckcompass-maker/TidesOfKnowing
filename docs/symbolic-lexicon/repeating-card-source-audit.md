# Repeating-Card Source Audit for the Symbolic Lexicon

**Date:** 2026-05-31  
**Scope:** Map existing Tides of Knowing repeating-card and related single-card sources to the Symbolic Lexicon card record schema.  
**Out of scope:** Two-card meanings, pairings, combinations, and card-relationship systems.

---

## Executive summary

The site already has **complete, TOK-native repeating-card coverage for all 78 cards** under `src/content/repeating-card-meanings/`, plus structured SEO/taxonomy sidecars. This is strong source material for **identity-adjacent copy**, **contexts** (with reframing), **semantic tags**, and **SEO seeds**.

It is **not** a direct source for upright/reversed `interpretation.*` or vocabulary tiers (`clearCurrent` / `deepCurrent` / `hiddenCurrent`), because repeating-card pages answer a different question: *what does it mean when this card keeps appearing?* rather than *what is this card?*

For upright/reversed core meanings and keyword ladders, the best complementary single-card source in the repo is **`content-intake/tarot/tarot-cards-master.md`** (TOK-native, orientation-split). That file must be used **only above the `### Combination Logic` boundary** per card. Combination Logic and `With …` bullets are excluded (two-card material).

**Reuse potential (high level):**

| Lexicon area | Repeating-card sources | Additional single-card source |
|--------------|------------------------|------------------------------|
| `interpretation.*` (upright/reversed) | Low (reframe heavily or skip) | **High** (`tarot-cards-master.md` Upright/Reversed only) |
| `contexts.*` | Medium (life-area sections, distilled) | Low |
| `vocabulary.*` | Low | **High** (`keywords` / `extendedKeywords`) |
| `semanticTags` | **High** (`card-taxonomy-map.yaml`) | Medium (themes from intake) |
| `seo` | **High** (frontmatter + `card-metadata-map.yaml`) | Low |
| `lineages` / `translations` | None | None (original writing) |

No card JSON records, public pages, or game files should be changed during extraction. Normalize em dashes on import (SEO YAML uses them heavily; card body markdown generally does not).

---

## 1. Where repeating-card content currently lives

### Primary card corpus (78 files)

| Path | Role |
|------|------|
| `src/content/repeating-card-meanings/majors/*.md` | 22 Major Arcana repeating meanings (`tier: full`) |
| `src/content/repeating-card-meanings/cups/*.md` | 14 Cups (`tier: abbreviated`) |
| `src/content/repeating-card-meanings/wands/*.md` | 14 Wands (`tier: abbreviated`) |
| `src/content/repeating-card-meanings/swords/*.md` | 14 Swords (`tier: abbreviated`) |
| `src/content/repeating-card-meanings/pentacles/*.md` | 14 Pentacles (`tier: abbreviated`) |

Collected by Astro as `repeatingCardMeanings` (see `src/content/config.ts` → `repeatingCardMeaningsSchema`). Framework/memory docs in the same tree are **not** collected as cards.

### Editorial and system docs (not per-card records)

| Path | Role |
|------|------|
| `src/content/repeating-card-meanings/framework.md` | Hub framework copy |
| `src/content/repeating-card-meanings/repetition-philosophy.md` | Philosophy of repetition |
| `src/content/repeating-card-meanings/generation-prompt.md` | Generation rules |
| `src/content/repeating-card-meanings/repeating-card-resource-style-guide.md` | Style guide |
| `src/content/repeating-card-meanings/memory/` | Project memory and generation rules |

### SEO / AEO / taxonomy sidecars (high reuse for tags and SEO)

| Path | Role |
|------|------|
| `src/content/repeating-card-meanings/seo-aeo-output/04-metadata/card-metadata-map.yaml` | Per-card `metaTitle`, `metaDescription`, keywords, snippet answers (78 entries) |
| `src/content/repeating-card-meanings/seo-aeo-output/02-taxonomy/card-taxonomy-map.yaml` | Controlled tags: `themes`, `life_areas`, `seeker_states`, `shadow_patterns`, etc. |
| `src/content/repeating-card-meanings/seo-aeo-output/02-taxonomy/controlled-vocabulary.md` | Vocabulary definitions |
| `src/content/repeating-card-meanings/seo-aeo-output/01-audit/source-inventory.md` | Card list and collection IDs |
| `src/content/repeating-card-meanings/seo-aeo-output/01-audit/frontmatter-field-map.md` | Frontmatter contract |
| `src/content/repeating-card-meanings/seo-aeo-output/01-audit/content-structure-audit.md` | Section template and retrieval notes |

### Public surfaces (reference only; not extraction targets)

| Path | Role |
|------|------|
| `src/pages/repeating-card-meanings/index.astro` | Public hub |
| `src/pages/repeating-card-meanings/[...slug].astro` | Public card pages |
| `src/pages/tools/repeating-card-meanings.astro` | Tool selector |
| `src/pages/tools/repeating-card-meanings/[...id].astro` | Tool card panels |
| `src/lib/repeatingCard*.ts` | URL, SEO, page model, hub helpers |
| `src/components/RepeatingCard*.astro` | Rendering components |

### Related articles (series-level, not per-card lexicon)

| Path | Role |
|------|------|
| `src/content/articles/why-the-same-tarot-card-keeps-appearing.md` | Series intro |
| `src/content/articles/repeating-major-arcana-cards.md` | Major-arcana repetition article |
| `src/content/articles/repeating-cards-vs-stalker-cards.md` | Distinction article |

### Supplementary TOK single-card intake (not repeating-card, but critical for lexicon)

| Path | Role |
|------|------|
| `content-intake/tarot/tarot-cards-master.md` | 78 cards with **Upright / Reversed** blocks, keywords, `coreMeaning`, `essenceSentence`. **Exclude** `### Combination Logic` and all `With …` lines. |

### Docs mirror (SEO planning)

| Path | Role |
|------|------|
| `docs/seo-ai/repeating-card-meanings/` | Planning notes (entity map, UX, performance). Reference only. |

---

## 2. Files with reusable single-card or repeating-card copy

### Tier A: Per-card, safe for lexicon mapping (with reframing)

- All **78** `src/content/repeating-card-meanings/{majors,cups,wands,swords,pentacles}/*.md` body sections listed in section 4 below.
- Frontmatter on those files: `summary`, SEO fields where populated on-card.
- `card-metadata-map.yaml` (78 entries).
- `card-taxonomy-map.yaml` (78 entries).

### Tier B: Supplementary for upright/reversed and vocabulary (single-card, not repetition)

- `content-intake/tarot/tarot-cards-master.md` — **Upright** and **Reversed** sections only per card.

### Tier C: Useful for methodology, not card record fields

- `framework.md`, `repetition-philosophy.md`, repeating-card articles series.
- `seo-aeo-output/01-audit/content-structure-audit.md` (chunking and FAQ ideas).

### Tier D: Do not use for lexicon card records

See section 8.

---

## 3. Tarot cards already covered

**78 / 78** in repeating-card markdown (confirmed by `source-inventory.md` and file count: 22 majors + 56 minors).

| Suit | Count | Collection folder | Example collection ID |
|------|-------|-------------------|------------------------|
| Major Arcana | 22 | `majors/` | `majors/the-fool` |
| Cups | 14 | `cups/` | `cups/ace-of-cups` |
| Wands | 14 | `wands/` | `wands/ace-of-wands` |
| Swords | 14 | `swords/` | `swords/ace-of-swords` |
| Pentacles | 14 | `pentacles/` | `pentacles/ace-of-pentacles` |

**Slug convention:** `repeating-card-meanings/{card-slug}` (e.g. `repeating-card-meanings/the-fool`).  
**Lexicon `cardId` alignment:** Use the card slug without the prefix (`the-fool`, `ace-of-wands`, etc.), matching `tarot-card-index.json` and intake `cardId`.

**Tier split:**

- `tier: full` — 22 majors (longer Core Repeating Message, typically 400–700 words).
- `tier: abbreviated` — 56 minors (same section template, shorter sections per `content-structure-audit.md`).

---

## 4. Content orientation: upright, reversed, general, or mixed?

| Source | Orientation | Notes |
|--------|-------------|-------|
| Repeating-card `.md` bodies | **Repeating-card / pattern** | No `upright` or `reversed` sections. Language is temporal (weekly/monthly/seasonal/years) and pattern-based (held leap, serial beginning, etc.). |
| Repeating-card frontmatter `summary` | **Repeating-card** | Describes persistence in readings, not orientation. |
| `card-metadata-map.yaml` | **Repeating-card + SEO** | Keywords and answers use “keeps appearing” framing. |
| `tarot-cards-master.md` | **Upright + Reversed** | Explicit `### Upright` / `### Reversed` per card. **Not** repeating-card copy. |
| Shadow / Integrated sections (repeating) | **Pattern shadow / integration** | Maps loosely to shadow work but not to reversed upright meaning. |

**Implication:** Populate `interpretation.upright` and `interpretation.reversed` primarily from **tarot-cards-master** (or new TOK writing). Use repeating-card material for **distilled teaching notes**, **context essences**, **FAQ seeds**, and **semanticTags**, after reframing away from “keeps appearing.”

---

## 5. Schema field mapping

Legend: **Strong** = direct distill/adapt | **Partial** = needs reframing or merge | **Weak** = poor fit | **None** = no source

### `interpretation` (upright and reversed)

| Field | Repeating-card source | Suggested source section | Fit |
|-------|----------------------|---------------------------|-----|
| `summary` | Partial | `summary` (frontmatter); opening blockquote | **Partial** — repetition-framed; shorten and generalize |
| `teachingNote` | Partial | Core Repeating Message (pattern 1 thesis); “What This Card Wants…” | **Partial** — strong TOK voice; remove repetition hook |
| `practicalMeaning` | Partial | Career & Purpose; Practical Integration Actions | **Partial** |
| `emotionalMeaning` | Partial | Emotional & Mental Patterns; Core patterns | **Partial** |
| `relationalMeaning` | Partial | Love & Relationships | **Partial** |
| `creativeMeaning` | Weak | Career & Purpose (creative threads only) | **Weak** for many cards |
| `spiritualMeaning` | Partial | Spiritual Growth; Integrated Expression | **Partial** |
| `shadowMeaning` | Partial | The Shadow Expression | **Partial** — pattern shadow, not reversed card meaning |

**Better source for all upright/reversed interpretation fields:** `content-intake/tarot/tarot-cards-master.md` → `coreMeaning`, `essenceSentence`, orientation-specific keywords (**Strong** after reframing to lexicon field split).

### `contexts` (relationship, romance, business, innerDevelopment)

Lexicon uses four contexts; repeating cards use seven life areas.

| Lexicon context | Repeating-card sections | Fit |
|-----------------|-------------------------|-----|
| `relationship` | Love & Relationships (non-romantic threads) | **Partial** |
| `romance` | Love & Relationships (attraction, commitment, partnership) | **Partial** — split from general relationship |
| `business` | Career & Purpose + Money & Stability | **Partial** |
| `innerDevelopment` | Spiritual Growth + Emotional & Mental Patterns + Family & Generational (as inner work) | **Partial** |

Each context needs new lexicon-shaped fields: `essence`, `keywords`, `phrases`, `watchFor`, `readerNote` (upright and reversed). Repeating copy is **single orientation** (pattern persistence); **reversed context sides** will require intake reversed material or original writing.

### `vocabulary` (clearCurrent / deepCurrent / hiddenCurrent)

| Level | Repeating-card source | Fit |
|-------|----------------------|-----|
| `clearCurrent` | Core pattern names; life-area keywords in prose | **Weak** |
| `deepCurrent` | Extended pattern language in Core section | **Weak** |
| `hiddenCurrent` | Advanced sections (shadow, generational) | **Weak** |

**Better source:** `tarot-cards-master.md` → `keywords` (clear), `extendedKeywords` (deep/hidden split by editor judgment). Repeating prose is too narrative for Hidden Current.

### `semanticTags`

| Source | Fit |
|--------|-----|
| `card-taxonomy-map.yaml` → `themes`, `seeker_states`, `shadow_patterns`, `integration_paths`, `emotional_patterns`, `transitional_states` | **Strong** — map kebab-case to `semanticTags` |
| `controlled-vocabulary.md` | Reference for consistent tagging |
| Core pattern labels in body | **Partial** — extract 4–8 stable tags per card |

### `seo`

| Lexicon field | Repeating-card source | Fit |
|---------------|----------------------|-----|
| `metaTitle` | `card-metadata-map.yaml` / frontmatter `metaTitle` | **Strong** — rewrite to general card meaning titles when lexicon goes public |
| `metaDescription` | Same | **Strong** — remove “keeps appearing” if page positioning changes |
| `canonicalTopic` | `primaryKeyword` | **Partial** |
| `schemaReadyDescription` | `featuredSnippetAnswer` or `answerEngineSummary` | **Partial** |
| `relatedEntities` | `themes`, archetypal states from taxonomy | **Partial** |
| `faqSeeds` | Reflective Questions (top 3–5); temporal section headers as questions | **Partial** |
| `internalLinkTargets` | Card slugs only — **not** `related-card-map` targets | **Partial** |

**Hygiene:** `card-metadata-map.yaml` contains many em dashes (U+2014). Normalize to commas or hyphens when copying into lexicon JSON.

### Fields with no repeating-card source (original writing required)

| Lexicon section | Notes |
|-----------------|-------|
| `identity.*` (except slug/cardId from inventory) | `visualEssence`, `archetypalRole`, `primaryMovement`, `shadowMovement`, astrology: write from TOK system or intake relational profile |
| `lineages` (all 13 registers) | Not present in repeating-card corpus |
| `translations.spanish` | Not present |
| `usageFlags` / `metadata.publicationStatus` | Governance only |
| `gameMetadata` | Optional; do not import tool mechanics |
| `interpretation.reversed` (from repeating alone) | Insufficient — use intake Reversed block |

---

## 6. Gaps requiring original writing

1. **Full upright/reversed interpretation grid** — eight fields × two orientations, card-centric (not repetition-centric).
2. **All `contexts.*.reversed` blocks** — repeating life areas are not orientation-split.
3. **Vocabulary tiers** — structured keyword/phrase ladders (4 terms per level target).
4. **All 13 `lineages` registers** per card.
5. **Spanish `translations` layer** with review status.
6. **`identity` symbolic fields** — movement, archetypal role, visual essence, astrological association.
7. **Explicit distillation** from majors’ rich Core section into concise lexicon strings (character limits implied by schema use, not repetition essays).

**Minors (`tier: abbreviated`):** Same template as majors but shorter life-area and core sections. Expect more gap-filling for `creativeMeaning`, `romance`, and `hiddenCurrent` vocabulary.

---

## 7. Risk of overfitting to the repeating-card use case

| Risk | Description | Mitigation |
|------|-------------|------------|
| Repetition framing in `interpretation` | Copy that says “when this card keeps appearing” belongs on repeating pages, not canonical card records. | Strip temporal/repetition hooks; write “what is this card.” |
| Temporal sections in core meaning | Weekly/monthly/seasonal/years sections are **frequency-specific**, not card identity. | Do not map into `interpretation.*`; optional `gameMetadata` or omit. |
| Shadow Expression ≠ reversed | Pattern shadow is psychologically related but not the same as reversed orientation. | Use intake `### Reversed` for `interpretation.reversed`; use repeating shadow for `shadowMeaning` only with clear labeling. |
| SEO keyword contamination | Primary keywords are “{card} keeps appearing in tarot.” | Create separate lexicon SEO seeds for general card-meaning queries. |
| `teachingNote` becomes an essay | Core Repeating Message is 400–700 words for majors. | Distill to 2–4 sentences. |
| Related-card thinking | Taxonomy includes `relational_patterns`, `shadow-pair` in related-card system. | Use for `semanticTags` only, not pair meanings. |
| COMPASS / seeker_states in taxonomy | TOK method terms may not belong in public lexicon without review. | Tag internally or map to `semanticTags` with governance. |
| Health & Energy life area | Often stretched (per content-structure audit). | Low priority for `contexts`; avoid weak physical metaphors in lexicon. |

---

## 8. Files excluded (two-card, pairing, combination, card-relationship)

Do **not** use these to populate single-card Symbolic Lexicon records:

| Path | Reason |
|------|--------|
| `content-intake/two-card-corpus/**` | Two-card corpus (separate rebuild) |
| `docs/two-card-system/**` | Pairing architecture and checklists |
| `src/content/repeating-card-meanings/seo-aeo-output/03-related-cards/related-card-map.yaml` | Card-to-card relationships (`shadow-pair`, `resolving-pair`, etc.) |
| `src/content/repeating-card-meanings/seo-aeo-output/03-related-cards/relationship-logic.md` | Relationship types between cards |
| `src/content/repeating-card-meanings/seo-aeo-output/03-related-cards/high-authority-clusters.md` | Cross-card clusters |
| `src/lib/repeatingCardRelated.ts` | Consumes related-card map for UI |
| `src/components/RepeatingCardRelatedMeanings.astro` | Renders related-card links |
| `content-intake/tarot/tarot-cards-master.md` → **`### Combination Logic`** and all **`With …`** bullets under it | Exact pair / combination semantics |
| Any `content-intake/two-card*` or pairing draft under `docs/` | Pairing system |
| Tool/combination scripts (e.g. two-card reading tools) | Not single-card data |

**Note:** Phrases like “some combination of” in repeating-card prose refer to **multiple patterns within one card**, not two-card readings. Those are allowed as source text.

---

## 9. Recommended extraction workflow

### Phase 0: Inventory and ID map

1. Build a CSV or JSON map: `collectionId` → lexicon `cardId`, `slug`, arcana, suit, rank, `tier`, file paths.
2. Source of truth for IDs: `seo-aeo-output/01-audit/source-inventory.md` and filenames.

### Phase 1: Mechanical, low-risk fields (per card)

1. Create draft record from `card-record.blank-template.json` (do not publish).
2. Fill `identity` from frontmatter + inventory (`cardId`, `slug`, `cardName`, `number`, `arcana`, `suit`, `rank`).
3. Fill `semanticTags` from `card-taxonomy-map.yaml` (themes, seeker_states, shadow_patterns → kebab-case).
4. Draft `seo` from `card-metadata-map.yaml` + frontmatter; **normalize em dashes**; plan separate titles for general meaning vs repeating pages.

### Phase 2: Card-centric interpretation (primary TOK intake)

1. For each card in `tarot-cards-master.md`, extract only through **`### Reversed`** (stop before `### Combination Logic`).
2. Map `essenceSentence` → `interpretation.{orientation}.summary`.
3. Map `coreMeaning` → split across `practicalMeaning`, `emotionalMeaning`, `relationalMeaning`, `creativeMeaning`, `spiritualMeaning`, `shadowMeaning` (editorial pass).
4. Map `keywords` / `extendedKeywords` → `vocabulary.{orientation}.clearCurrent` / `deepCurrent` / `hiddenCurrent`.
5. Set `metadata.sourcePolicy` and `recordVersion`; mark `reviewStatus.interpretive` draft.

### Phase 3: Distill repeating-card copy (secondary)

1. Read `summary`, Core Repeating Message (pattern 1 + closing thesis), Shadow Expression, Integrated Expression, life areas.
2. Reframe into `contexts.*.upright` essences and keywords (split Love into `relationship` vs `romance`).
3. Pull 1–2 `teachingNote` sentences per orientation where intake is thin (minors).
4. Add `seo.faqSeeds` from Reflective Questions (reword to general card FAQs, not repetition FAQs).
5. **Do not** paste weekly/monthly/seasonal/years sections into `interpretation`.

### Phase 4: Human review gates

1. Interpretive review: confirm upright/reversed are orientation meanings, not repetition essays.
2. Context review: four contexts populated; reversed sides completed.
3. Vocabulary review: four keywords per level where possible; no filler terms.
4. Cultural/SEO review per `review-workflow.md`.
5. Set `usageFlags` (likely internal-only until decoupled from repeating URLs).

### Phase 5: Validation and index

1. Validate JSON against `card-record.schema.json`.
2. Append path to `tarot-card-index.json` with `status: draft`.
3. Merge new tags into `tarot-semantic-tags.json` registry.

### Suggested first pilot cards

1. **The Fool** — full tier major; example lexicon record already exists as structural reference.
2. **Ace of Wands** — abbreviated tier; tests minor path.
3. **Nine of Swords** — strong emotional pattern vocabulary in repeating + intake.

---

## Appendix A: Repeating-card body section template (all 78 cards)

1. YAML frontmatter  
2. H1 title  
3. Opening blockquote  
4. `## Core Repeating Message` (4 patterns)  
5. `## When This Card Repeats Weekly`  
6. `## When This Card Repeats Monthly`  
7. `## When This Card Repeats Seasonally`  
8. `## When This Card Repeats Across Years`  
9. `# Life Area Interpretations` → 7× `##` subsections  
10. `# Advanced Interpretive Sections` → Shadow, Integrated, Why Not Released, What Card Wants, Signs Resolving  
11. `## Reflective Questions` (10)  
12. `## Practical Integration Actions` (5)  

---

## Appendix B: Files reviewed for this audit

### Created by this audit

- `docs/symbolic-lexicon/repeating-card-source-audit.md`

### Documentation and lexicon foundation

- `docs/symbolic-lexicon/card-dataset-specification.md`
- `docs/symbolic-lexicon/file-structure.md`
- `docs/symbolic-lexicon/review-workflow.md`
- `src/data/symbolic-lexicon/tarot/schema/card-record.blank-template.json`
- `src/data/symbolic-lexicon/tarot/schema/card-record.example.the-fool.json`
- `src/data/symbolic-lexicon/tarot/indexes/tarot-card-index.json`

### Repeating-card corpus and sidecars

- `src/content/repeating-card-meanings/` (78 card markdown files across five suit folders)
- `src/content/repeating-card-meanings/framework.md`
- `src/content/repeating-card-meanings/seo-aeo-output/01-audit/source-inventory.md`
- `src/content/repeating-card-meanings/seo-aeo-output/01-audit/frontmatter-field-map.md`
- `src/content/repeating-card-meanings/seo-aeo-output/01-audit/content-structure-audit.md`
- `src/content/repeating-card-meanings/seo-aeo-output/02-taxonomy/controlled-vocabulary.md`
- `src/content/repeating-card-meanings/seo-aeo-output/02-taxonomy/card-taxonomy-map.yaml` (sampled; 78 entries)
- `src/content/repeating-card-meanings/seo-aeo-output/04-metadata/card-metadata-map.yaml` (sampled; 78 entries)
- `src/content/repeating-card-meanings/seo-aeo-output/03-related-cards/related-card-map.yaml` (exclusion check)
- `src/content/repeating-card-meanings/majors/the-fool.md` (full read)
- `src/content/repeating-card-meanings/wands/ace-of-wands.md` (structure sample)

### Schema and intake

- `src/content/config.ts` (`repeatingCardMeaningsSchema`)
- `content-intake/tarot/tarot-cards-master.md` (structure and Combination Logic boundary)

### Public wiring (confirmed not lexicon data)

- `src/pages/repeating-card-meanings/index.astro`
- `src/pages/tools/repeating-card-meanings.astro`
- `src/lib/repeatingCardMeanings.ts`
- `src/lib/repeatingCardRelated.ts`

### Excluded paths (named, not opened for copy)

- `content-intake/two-card-corpus/`
- `docs/two-card-system/`

---

## Build status

`npm run build` was run after adding this report only. **Build passed** (exit code 0).
