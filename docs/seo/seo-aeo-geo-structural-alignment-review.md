# Tides of Knowing SEO, AEO, and GEO Structural Alignment Review

**Status:** Structural decision pass (documentation only)  
**Date:** 2026-05-29  
**Prerequisite work completed:** Truth document, site audit, Phase 2 templates, Repeating Card Meanings tool UX correction  
**Doctrine:** [`seo-aeo-geo-truth-document.md`](./seo-aeo-geo-truth-document.md) §6 (Action-first optimisation principle)  
**Does not replace:** [`seo-aeo-geo-site-audit.md`](./seo-aeo-geo-site-audit.md) (inventory of strengths/gaps)

---

## 1. Purpose

This document checks whether Tides of Knowing’s **current page structures** align with SEO, AEO, and GEO goals **without** sacrificing reader clarity or visitor action.

The site audit asked what exists and what is missing. This review asks a different question: **Does each page type put the right thing first?**

Authority targets remain: recognised leadership in symbolic interpretation, intuitive literacy, tarot methodology, and structured reflective practice within 18 months, with serious traction by March 2027. Structural alignment serves that goal by making pages more useful and more citeable, not more mechanical.

**This pass:** documentation and decision rules only. No layout, content, schema, or route changes.

---

## 2. Core alignment principle

### Action-first optimisation

Any optimisation that reduces the visitor’s ability to act is not optimisation.

For tool pages especially, **engagement is the authority signal**. SEO, AEO, and GEO support should clarify and strengthen the visitor’s path, not push the primary action below explanatory content.

### Site-wide rule

Every page should make its **primary visitor action or reader value** clear before asking the visitor to absorb supporting authority material.

Supporting material (method framing, library links, author credentials, entity definitions, further reading) belongs in structure, schema, headings, and sections that **follow** or **sit beside** the primary value, unless the page’s entire purpose is reference (e.g. canonical entity library hub).

---

## 3. Page type action map

| Page type | Primary visitor intent | Primary site goal | Required above-the-fold priority | SEO/AEO/GEO support role | Risk of over-optimisation | Structural recommendation |
|-----------|------------------------|-------------------|----------------------------------|--------------------------|---------------------------|---------------------------|
| **Homepage** | Orient: what is TOK, where do I go next? | Route to method, tools, practice, training, repeating cluster | Value proposition + pathway cards (action choices) | WebSite schema, entity graph, crawlable links to hubs | Authority phrase or long intro before pathways | Keep pathways high; any authority phrase is one line in hero, not a new block above pathways |
| **About** | Trust Leigh Spencer and the work | Person + methodology credibility | Who she is, why the work exists, TOC to sections | WebPage `about` + `ENTITY_IDS.person`; extractable experience signals | Long credential essay before navigation | TOC and lede stay; schema already aligned in Phase 2 |
| **Method hub** (`/articles/compass-method/`) | Understand COMPASS framework | Canonical method entity | Definition of method + seven pillars visible early | TechArticle, keywords, internal links from site | Short answer duplicating opening if added blindly | Add optional “In brief” only if distinct from hero; further reading below body |
| **Long-form articles** | Learn one methodological idea | Topical authority, series progression | Title, author trust, article opening (core inquiry) | Excerpt/meta, TechArticle, breadcrumbs, optional `shortAnswer` | “In brief” repeating excerpt; FAQ block; pathway links feeling boilerplate | Use `shortAnswer` when it answers one question; keep generic pathway block or refine per-article later |
| **Article series landing** | Choose where to start in a series | Series hub + ItemList | Series title, short description, article list | ItemList schema, series description in `seriesData` | Long duplicate of every article excerpt | Add 2–3 sentence series summary above list only if not redundant with `seriesData` description |
| **Field Notes** | Read a lived/practical observation | Voice, immediacy, practitioner trust | Title, author link, note opens quickly | BlogPosting, description meta, optional `shortAnswer` | Pseudo-academic framing; heavy COMPASS preamble | No short answer unless it sharpens the observation; avoid further reading unless methodological |
| **Field Note series landing** | Enter a practitioner walkthrough | Ordered series + cheat sheet path | Series title, what the series is for, note list | Series description, crawlable child URLs | Positioning copy longer than the first note’s value | Use `positioningSentence` on parts; keep index scannable |
| **Tool pages** | Use an interactive function now | Engagement, practice, link to canon | Tool UI + clear instruction | Semantic links to `/repeating-card-meanings/`, crawlable paths; page title/description | Library or methodology essay above selector | Follow tool page standard (§4); audit other tools when live |
| **Repeating card entity pages** | Deep reference for one repeating card | Indexable authority, AEO extraction | Card identity, summary, short answer (if distinct), reading body | Article + FAQPage schema, canonical URL, hub links | Two duplicate intros; page feels like tool not reference | Keep summary + short answer hierarchy; link to tool as secondary |
| **Practice page** | Decide whether to enter Deck Compass | Bridge to practice ecosystem | What practice is + primary CTA to The Deck Compass | Entity link to deckcompass.com; clear copy | TOK homepage duplicate before CTA | CTA and “what happens inside” before long essays |
| **COMPASS training** | Decide whether to apply / register interest | Conversion to apply + method trust | Hero + primary apply CTA + schedule signal | FAQPage JSON-LD (Phase 2), method link | FAQ or copy before first CTA | Keep hero/CTA first; FAQ and long sections follow |
| **Subscribe / lead magnets** | Join list or download asset | List growth, attribution | Form or download action | Subscribe `noindex` correct; lead pages need clear offer meta | SEO copy before signup | Offer + form first on subscribe; field guide: value prop then form |
| **Tag pages** | Browse articles on one topic | Discovery, internal linking | Tag label + article cards | ItemList, thin but valid hub | Indexing 57 thin tags; tag as SEO destination | Policy decision: nav-only vs indexed; avoid adding SEO blocks to tags |

---

## 4. Tool page standard

The Repeating Card Meanings tool (`/tools/repeating-card-meanings/`) exposed a structural failure mode: **library-first layout** buried the selector. That is now corrected and serves as the reference implementation.

### Tool pages must

1. **Show the interactive function early** (selector, spread, interpreter UI).
2. **Make the user’s action obvious** (label: “Choose the card that keeps appearing”, etc.).
3. **Keep explanatory SEO content below or beside the tool**, not above it on mobile.
4. **Link clearly to canonical/reference pages** with semantic anchor text (“repeating card pattern library”, not “click here”).
5. **Preserve crawlable, semantic links** without burying the tool (href to `/repeating-card-meanings/`, per-card canonical links in results).
6. **Avoid requiring a methodology essay** before first use.

### Current example: Repeating Card Meanings tool

| Element | Placement |
|---------|-----------|
| H1 + one-line intro | Top of workspace |
| Selector panel | Immediately under intro (strongest visual weight) |
| One-line library link | Under selector |
| Compact library aside | Right column desktop; after selector on mobile |
| Card results | Below workspace when selected |
| Long contextual copy | Below results (`rcm-tool__context`) |
| Editorial article links | Footer of page |

**Apply this pattern to:** `/tools/tarot-combination-interpreter/` (already tool-first with FAQ schema), future two-card tool, any new interactive page.

### Tools hub (`/tools/`)

**Moderate risk:** COMPASS framing block appears **before** H1. Acceptable for a directory page (intent is choose a tool), but card grid should remain visible without deep scroll. When adding tools, list live tools before long framing copy or keep framing to one short paragraph above grid.

---

## 5. Article and Field Note standard

### Articles (evergreen methodology)

| Dimension | Standard |
|-----------|----------|
| Purpose | Durable interpretive authority |
| Above the fold | Title, author (`AuthorBlock`), opening that states the inquiry |
| AEO | Optional `shortAnswer` (“In brief”) when it adds a direct answer **without** duplicating excerpt |
| Links | Contextual links in prose; generic “Continue through the system” is acceptable but not a substitute for semantic links |
| Further reading | `furtherReading` frontmatter for cornerstone pieces only when curated |
| Voice | Full methodological depth in body; do not flatten for snippets |
| Schema | TechArticle + breadcrumbs; dates when updated |

### Field Notes (lived observation)

| Dimension | Standard |
|-----------|----------|
| Purpose | Personal/practical signal from practice |
| Above the fold | Field Note label, title, author link, observation begins quickly |
| AEO | Rare `shortAnswer`; only if it names the practical takeaway |
| Links | Natural links to method or tools when the note genuinely depends on them |
| Further reading | Sparingly; avoid academic bibliography tone |
| Optional patterns | “Reading in practice” subsection, cheat sheets for series, `positioningSentence` on series parts |
| Voice | Must stay immediate; resist turning Field Notes into mini-articles |
| Schema | BlogPosting + person `@id` |

**Structural difference:** Articles build **durable topical authority**. Field Notes build **trust and practitioner presence**. Templates are shared (Phase 2); **content choices** must diverge in Phase 3.

---

## 6. Authority without clutter

Phase 2 added optional components. This table defines **where each belongs** and **where to avoid**.

| Mechanism | Where it belongs | Where to avoid |
|-----------|------------------|----------------|
| **AuthorBlock** (inline) | Articles, Field Notes, major hubs with byline | Tag pages, tool selector band, repeated mid-article |
| **AuthorBlock** (extended) | Cornerstone only (compass-method, about) if approved | Every article footer |
| **COMPASS Method™ mention** | Method hub, training, about, contextual article links | Every paragraph; tool hint text |
| **Internal links** | In prose, hub lists, pathway block, library/tool cross-links | Footers with 10+ generic links |
| **FurtherReading** | Deep methodology articles, AI series anchors | Field Notes by default; tool pages |
| **ShortAnswerBlock** (“In brief”) | Articles with one clear question | Field Notes unless takeaway is genuinely extractable |
| **featuredSnippetAnswer** (cards) | Entity pages when distinct from `summary` | Tool deep-link pages as duplicate block |
| **FAQ schema** | Visible FAQ (training page, card entity Q&A, combination tool) | Articles without visible FAQ |
| **Repeating card canonical links** | Tool results, entity pages, hub, tools index | Replacing tool action with library-only landing |
| **Entity definitions** | Glossary (future), method hub, first mention in articles | Inline definition stacks on every page |
| **Glossary links** (future) | First use of technical terms in methodology content | Field Notes casual voice |

**Rule:** One visible trust/authority band per page above the body is enough. Stack only when each layer serves a different job (e.g. author line + distinct short answer).

---

## 7. Structural risks to watch

| Risk | Example | Mitigation |
|------|---------|------------|
| Library-first where tool/action should lead | Repeating card tool (fixed) | Tool page standard §4; review new tools before launch |
| Excessive authority copy above the fold | Long hero before CTA on practice/training | Action map §3; move support copy down |
| Repeated trust lines | AuthorBlock + conversion block + pathway + footer | One author band; vary or shorten downstream CTAs in Phase 3 |
| Short answer duplicating excerpt | “In brief” = meta description | Dedup rule like repeating cards; editorial review |
| Mechanical FAQs | FAQ schema without visible questions | FAQ only where HTML FAQ exists |
| Entity pages too similar to tool | Same layout confusion | Entity = reference; tool = selector; cross-link, do not merge |
| Field Notes losing voice | shortAnswer + furtherReading on every note | Field Note standard §5 |
| Method articles dense before foothold | No definitional line before 2,000 words | Optional short answer or stronger opening H2 |
| Thin or confusing tag pages | 57 tag URLs, low unique copy | Indexing policy decision before SEO investment |
| Excessive internal links | Boilerplate pathway on every article | Per-article contextual links in Phase 3 priority URLs only |

---

## 8. Recommended structural rules before Phase 3 content work

Before editing any page, answer:

1. **What is the visitor trying to do or understand?**
2. **What is the page’s authority role?** (entity, method, tool, observation, conversion)
3. **What must appear above the fold?**
4. **What should move below the primary action?** (authority essay, library note, FAQ, further reading)
5. **What short answer, if any, would genuinely help?** (not duplicate excerpt or opening)
6. **What internal link strengthens understanding?** (one semantic link beats five generic ones)
7. **What schema is justified by visible content?**
8. **What should not be added?** (FAQ, further reading, extended author, keyword block)
9. **What existing voice or strategic content must be preserved?**
10. **Does the page feel more useful after optimisation?** (action-first test)

If question 10 is no, revert the structural change.

---

## 9. Phase 3 readiness

### Verdict

The site is **structurally ready** for a **targeted** Phase 3 content pass. Templates (`AuthorBlock`, `ShortAnswerBlock`, `FurtherReading`, card snippet UI, FAQ schema on training) are in place. Action-first hierarchy is documented and exemplified on the repeating card tool.

Phase 3 must **not** be site-wide rewriting. It should be a controlled pass on priority URLs with explicit actions per URL.

### Priority URL recommendations

| URL | Next action | Notes |
|-----|-------------|-------|
| `/` (Homepage) | Micro-copy only | Pathways already action-first; optional one-line authority phrase in hero |
| `/about/` | Micro-copy only; optional extended AuthorBlock | Person `@id` done; no structural move |
| `/articles/compass-method/` | Add `shortAnswer` + `furtherReading` | Cornerstone method entity |
| `/repeating-card-meanings/` (hub) | Micro-copy; optional hub “In brief” | Library hub: card list is the action; keep list high |
| `/tools/repeating-card-meanings/` | No change (or minor refinement only) | Tool-first layout applied 2026-05-29 |
| `/articles/what-ai-cant-access/` | Add `shortAnswer` | AI series entry; high GEO potential |
| `/articles/why-the-same-tarot-card-keeps-appearing/` | Add `shortAnswer` + contextual links | Bridges to card cluster |
| `/blog/reading-the-grip/` (series index) | Improve series framing | Series landing, not a single note |
| One standalone Field Note (e.g. welcome or foundational) | No short answer unless clear takeaway | Preserve voice |
| `/compass/` | Messaging/action path review | CTA first; FAQ schema done; check fold on mobile |
| Other articles / Field Notes / tags | No change in initial Phase 3 wave | Queue after priority wave |

### What to do first in Phase 3

1. **COMPASS Method hub** (`shortAnswer` + curated `furtherReading`): highest entity payoff.
2. **Two cluster bridge articles** (repeating + AI entry): connect hubs with extractable answers.
3. **Homepage micro-copy** (authority phrase, intuitive literacy): visible entity spine without new blocks.
4. **Continue indexing ops** for repeating-card entities (parallel, not a content rewrite).
5. **Defer:** glossary, llms.txt, tag policy, Field Note series bulk edits, tools hub reorder.

### Separate strategic review (not Phase 3 first wave)

- Tag indexing policy (57 URLs)
- `/field-notes/` URL migration
- Two-card tool SEO (see `docs/two-card-system/TWO-CARD-SEO-AEO-PLAN.md`)
- Tools hub framing-before-H1 layout
- Generic article pathway block replacement with semantic links

---

## 10. Phase 3 implementation note (2026-05-29)

Wave 1 confirmed the action-first and page-type rules in production:

- **Hub vs tool:** `/repeating-card-meanings/` leads with the searchable card library; tool link is secondary in hero copy. `/tools/repeating-card-meanings/` remains selector-first (unchanged this wave).
- **Field Note series:** `shortAnswer` on series landings is supported via `FieldNoteSeriesLayout` with the same “In brief” pattern as articles, kept observational for Reading the Grip (not definitional).
- **Articles vs Field Notes:** Three cornerstone articles received `shortAnswer` + curated `furtherReading`; homepage and hub received micro-copy only; no `furtherReading` on homepage, hub, or tool.

No change to the structural rules in §2–§8; Phase 3 applied them rather than revising them.

**Wave 2 (2026-05-29):** Training (`/compass/`) and practice (`/practice/`) pages may repeat the training-vs-practice distinction in hero micro-copy when it orients the visitor without displacing the primary CTA. That is orientation, not a new SEO block. Label policy confirmed: “In brief” vs “Short answer” by page type (see audit wave 2).

**Wave 3 (2026-05-29):** Cluster-capstone articles may already contain strong body links; wave passes should add `shortAnswer` / `furtherReading` and only one or two missing contextual links rather than duplicating link blocks at the foot of every article.

**Pre-commit correction (2026-05-29):**

1. **Formal naming:** Use **The COMPASS Method™** when naming the framework. Use **COMPASS** only in conversational or derivative labels (COMPASS training, COMPASS practice, COMPASS programme, COMPASS section). Do not shorten formal references to “COMPASS Method” or “the COMPASS method” in visible copy.
2. **Field Notes visibility:** Field Notes (`/blog/`) are a primary authority pathway and belong in primary navigation alongside Articles, not only in footers or sidebars. Adding Field Notes to the seven-item primary nav exposed the need for a proper collapsed mobile menu (burger + vertical panel). Primary navigation must never hide, clip, or make authority pathways unreachable on mobile. Responsive navigation is part of action-first optimisation.
3. **Field Notes visual taxonomy:** Differences between foundational notes, standalone notes, and series must be reader-legible and intentional (badges: Foundational Field Note, Field Note, Field Note Series), without database-style clutter.

4. **Affirmative interpretive positioning:** Tides of Knowing defines its approach affirmatively. SEO, AEO, and GEO copy must not create defensive positioning by dismissing fortune-telling, divination, prediction, or other tarot practices. Describe the site's own method, vocabulary, and reader value (symbolic interpretation, recurrence, relational meaning, reflective practice, The COMPASS Method™).
5. **Tools hub ordering:** On `/tools/`, live tools precede coming-soon tools so the primary visitor action is not buried behind future-state cards.

---

*End of structural alignment review.*
