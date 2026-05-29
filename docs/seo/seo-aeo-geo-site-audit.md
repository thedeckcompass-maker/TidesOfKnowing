# Tides of Knowing SEO, AEO, and GEO Site Audit

**Status:** Phase 2 implemented (2026-05-29); Phase 3 waves 1–3 complete; consolidation pass 2026-05-29  
**Audit date:** 2026-05-29  
**Doctrine reference:** [`seo-aeo-geo-truth-document.md`](./seo-aeo-geo-truth-document.md)  
**Structural alignment:** [`seo-aeo-geo-structural-alignment-review.md`](./seo-aeo-geo-structural-alignment-review.md) (action-first page hierarchy; test all future SEO/AEO/GEO work against §2 and §8 there before implementation)  
**Method:** Codebase and content review (`src/content/`, `src/pages/`, layouts, schema helpers, sitemap, GSC baseline docs)

---

## 1. Executive Summary

Tides of Knowing already has a **strong technical and architectural foundation** for authority-building: a site-wide ecosystem JSON-LD graph, disciplined canonicals for the repeating-card cluster, thoughtful article and Field Note templates with author trust lines, series landing pages with ItemList schema, and a custom sitemap with sensible priorities. Editorial differentiation (symbolic interpretation, AI boundary, COMPASS Method, journalism-backed authority) is real and visible—not generic tarot filler.

The largest gaps are **not** “missing SEO basics” but **entity visibility, extractability, and indexing traction**:

| Area | Current level | Main gap |
|------|---------------|----------|
| SEO | Good architecture; indexing lag on large cluster | ~141 URLs in GSC “Discovered – currently not indexed”; repeating-card entity wave in progress |
| AEO | Strong on repeating-card frontmatter; weak on articles/Field Notes | No standard short-answer pattern on articles; `featuredSnippetAnswer` not visibly rendered on entity pages |
| GEO | Strong ecosystem graph; About Person `@id` split | “Intuitive literacy” under-signalled; no glossary; no `llms.txt`; external corroboration still early |

**Biggest opportunities (highest ROI, reader-safe)**

1. Template-level optional short answer + further reading (articles, key hubs)—no mass rewrites.
2. Align About page Person schema with global `ENTITY_IDS.person`.
3. Glossary hub scaffolding + DefinedTerm schema later.
4. Continue controlled indexing ops for repeating-card canonicals.
5. Strengthen homepage/about copy for authority phrase and “intuitive literacy” without new SEO sections.

**Overall optimisation level:** **Foundation strong / execution mid-stage** — ready for phased template and priority-page work, not a ground-up SEO rebuild.

---

## 2. Existing Strengths

### Entity clarity

- `src/lib/ecosystem-structured-data.ts` injects a consistent `@graph` on every page via `BaseLayout.astro`: Person (Leigh Spencer), COMPASS Method CreativeWork, Tides and Deck Compass orgs/websites.
- `docs/ecosystem-structured-data.md` documents cross-repo `@id` sync requirements.
- About page (`/about/`) provides deep authority narrative (40+ years tarot, 30 years journalism, COMPASS, Deck Compass).
- Homepage trust line and pathway cards route users to method, repeating meanings, tools, practice, training.

### Article structure

- 18 articles in `src/content/articles/` with required `excerpt`, series support, hero images, tags.
- `ArticlesLayout.astro`: breadcrumbs, TechArticle JSON-LD, author trust line (`articleAuthorAttribution`), “Continue through the system” pathway block, series nav, conversion block.
- Four article series with rich descriptions in `src/data/series.ts` and dedicated `/series/[slug]/` landings (ItemList + breadcrumbs).
- Compass Method hub at `/articles/compass-method/` with elevated sitemap priority (`0.85`).

### Field Notes structure

- `blog` collection with typed frontmatter (`field-note`, `series`, `cheat-sheet`), required descriptions for notes/series.
- `BlogPostLayout.astro` and series layouts: author link to about, attribution string, BlogPosting schema with `ENTITY_IDS.person`.
- Practitioner series example: `reading-the-grip/` with ordered parts and cheat sheet.

### Repeating card meanings architecture

- Dual surface: **canonical entity** `/repeating-card-meanings/{slug}/` vs **tool** `/tools/repeating-card-meanings/{collection-id}/` with canonical consolidation documented in `seo-aeo-output/canonical-url-convention.md`.
- Content: 83 markdown files; **79** pass readiness heuristic (`## Core Repeating Message` + body length); **78** have `featuredSnippetAnswer`.
- `repeatingCardEntitySchema.ts`: Article, BreadcrumbList, FAQPage (from visible Q&A), ecosystem `mentions` / `about`.
- Hub pages: SEO hub + tool hub; sitemap priority `0.88` for SEO hub, `0.78` per entity page.

### Schema already present

| Page type | Schema (observed) |
|-----------|-------------------|
| All pages | Ecosystem `@graph` |
| Articles | TechArticle + BreadcrumbList |
| Field Notes | BlogPosting + BreadcrumbList |
| Series | ItemList + BreadcrumbList |
| Repeating card entities | Article + BreadcrumbList + FAQPage (when Q&A built) |
| About | WebPage + Person (local `@id`) |
| Homepage | WebSite (references ecosystem ids) |
| Some tools | FAQPage (e.g. tarot-combination-interpreter) |

### Canonical logic

- `BaseLayout.astro`: `ogUrl` drives canonical link tag.
- Repeating cards: `getRepeatingCardCanonicalUrl()` for entity pages.
- Subscribe: canonical `/subscribe/` with `noindex, follow` for parameterized URLs.
- Redirects in `astro.config.mjs` (library → articles, compass anchor → method article, etc.).

### Internal linking

- Article pathway block links to method, tools, practice, compass.
- Repeating card pages link hub ↔ tool ↔ related cards/articles.
- Homepage pathways; about page deep links to method and practice.
- `src/data/relatedPosts.ts` and blog sidebar patterns for Field Notes.

### Trust signals

- `src/lib/authorProfile.ts`: standard attribution string (Matakite, 40+ years, 30 years journalism, COMPASS founder).
- Visible on articles and Field Notes; meta author on layouts.
- About portrait, pull quotes, experience section.

### Indexing support

- `public/robots.txt`: allows major bots including GPTBot, ClaudeBot, PerplexityBot; sitemap declared.
- `src/pages/sitemap.xml.ts`: ~185 URLs including articles, series, tags, blog, repeating entities; subscribe omitted (correct).
- Ops docs: `docs/seo/repeating-card-index-monitoring.md`, `manual-indexing-wave-1.md`, GSC baselines.

### Site architecture

- Clear separation: **Articles** (evergreen methodology) vs **Field Notes** (`/blog/` URLs, “Field Notes” label) vs **Tools** vs **Practice/Training**.
- Server output on Cloudflare; prerender on static routes including repeating-card entities.

### Content differentiation

- AI and Intuition series, Deck Compass Methodology series, Repeating Card Patterns, Burn Series—distinct intellectual lanes.
- Language centres perception, recurrence, longing, pre-symbolic interface—not “card of the day” genericism.

---

## 3. Existing Weaknesses

*Evidence from codebase only; not inflated.*

### Author and entity schema

- ~~**About page Person `@id` mismatch**~~ **Resolved in Phase 2:** About `WebPage` references `ENTITY_IDS.person`; no duplicate Person node on About JSON-LD.
- **No shared AuthorBlock component**—attribution duplicated in layouts (maintainable but easy to drift).

### Short answers and extractability

- **Articles:** no `shortAnswer` frontmatter or rendered “Short answer” block in `articlesSchema` or `ArticlesLayout.astro`.
- ~~**Repeating cards:** `featuredSnippetAnswer` not visible~~ **Resolved in Phase 2:** rendered when distinct from panel `summary`; tool pages unchanged.
- **Field Notes:** no extractable summary block beyond description meta.

### Definitions and glossary

- **No `/glossary/` route** (explicitly deferred in repeating-card schema docs).
- **“Intuitive literacy”** barely appears in `src/` compared to “intuitive discernment” / “symbolic perception”—target authority phrase under-signalled.

### Meta and excerpts

- Several articles rely on `excerpt` only; **`metaDescription` optional** and not always set (e.g. many methodology articles use excerpt alone—acceptable but limits fine-tuning for SERP).
- Articles without `updatedDate` when content has been revised—misses freshness signals.

### Further reading

- No standard **Further reading** component on methodology articles.
- Repeating cards have `related_articles` frontmatter but coverage varies by card.

### Internal links to method

- Article pathway block is **generic** (same four links on all articles)—good for discovery, not semantic per-topic linking.
- Field Notes and tools **inconsistently** link back to `/articles/compass-method/`.

### Series and Field Note framing

- Field Note **series index** pages exist; standalone foundational notes have footer copy but **no series-level short answer** for AEO.
- `/blog/` URL vs “Field Notes” brand may confuse external systems (noted in `astro.config.mjs` TODO).

### Schema gaps

- ~~**COMPASS training page** (`/compass/`): no FAQPage JSON-LD~~ **Resolved in Phase 2:** `faqPageJsonLd()` injected on `/compass/`.
- **Practice page:** no page-specific schema beyond global ecosystem graph.
- **Articles use TechArticle**—reasonable; no FAQPage unless content warrants it.
- **DefinedTerm** deferred until glossary exists (correct guardrail).

### Sitemap and canonical

- **Tag pages** in sitemap (57 tags)—can dilute crawl budget; may be intentional for topical clustering.
- **Tool deep-links** not in sitemap (good); still crawlable—GSC shows “Alternative page with proper canonical” bucket (8 pages)—healthy.
- **`/compass/` and `/practice/`** in sitemap—verify priority vs content depth.

### Indexing risk

- GSC baseline (2026-05-25): **155 not-indexed** pages; **141 Discovered – currently not indexed**—many likely canonical repeating-card entities and secondary surfaces.
- Manual indexing Wave 1 queued for 12 priority majors (`docs/seo/manual-indexing-wave-1.md`).
- New site + large cluster = **time and internal linking** matter as much as on-page SEO.

### Overlapping intent

- Tool vs entity repeating-card URLs—**handled by canonicals**; risk is marketing links pointing to tool URLs only.
- `compass-method-anchor-article` blog redirect to article—good; watch for legacy blog URLs in the wild.

### Human-strong, AI-weak pages

- Long interpretive essays (Burn series, AI series) are **excellent for readers** but open with narrative, not definitional extract—GEO may prefer a optional short answer without changing voice in the body.

---

## 4. Page Type Findings

### Homepage (`/`)

| Dimension | Finding |
|-----------|---------|
| SEO | Strong title/description; WebSite schema; pathways to key hubs |
| AEO | No single “short answer” for “what is Tides of Knowing”—lede is multi-paragraph |
| GEO | Ecosystem ids; could state authority phrase explicitly once |
| Action | Light copy addition for “intuitive literacy” + authority phrase (Phase 3) |

### About (`/about/`)

| Dimension | Finding |
|-----------|---------|
| SEO | Strong meta; long-form authority; TOC |
| AEO | Good definitional sections (work, method, who it serves) |
| GEO | **Fix Person `@id`** to match `ENTITY_IDS.person` |
| Action | Schema alignment (Phase 5); optional sameAs links when profiles confirmed |

### Articles (`/articles/[slug]/`)

| Dimension | Finding |
|-----------|---------|
| SEO | Excerpts present; series; sitemap; breadcrumbs |
| AEO | No short answer template; headings vary by article quality |
| GEO | Author + TechArticle + ecosystem; strong for AI series topics |
| Action | Optional frontmatter short answer on 5–7 flagship URLs first |

### Article series (`/series/[slug]/`)

| Dimension | Finding |
|-----------|---------|
| SEO | `seriesData` descriptions for all 4 series; ItemList schema |
| AEO | Could add 2–3 sentence “start here” above article list |
| GEO | Clear series naming |
| Action | Series summary block component (low risk) |

### Field Notes (`/blog/...`)

| Dimension | Finding |
|-----------|---------|
| SEO | Required description; BlogPosting schema |
| AEO | Weaker than articles for snippet extraction |
| GEO | Author linked; category URLs |
| Action | Contextual intro field for series notes (frontmatter exists: `positioningSentence`)—use more consistently |

### Field Note series (`/blog/[seriesSlug]/`)

| Dimension | Finding |
|-----------|---------|
| SEO | Series type in collection; ordered notes |
| AEO | Series description on index; cheat sheets for some |
| Action | Ensure every live series has `description` + hub link to related articles |

### Tool pages (`/tools/...`)

| Dimension | Finding |
|-----------|---------|
| SEO | Tools index linked; repeating tool not canonical for SEO |
| AEO | Combination interpreter has FAQ schema; others vary |
| GEO | Tools are practice interfaces—need one-line “what this trains” |
| Action | Two-card system is separate initiative (`docs/two-card-system/`) |

### Repeating card pages (`/repeating-card-meanings/...`)

| Dimension | Finding |
|-----------|---------|
| SEO | **Strongest cluster**; canonical discipline; monitoring in flight |
| AEO | Frontmatter answers; FAQ schema; visible FAQ component via questions model |
| GEO | mentions COMPASS in schema; long-form depth |
| Action | Surface `featuredSnippetAnswer` in UI; continue indexing waves |

### Practice (`/practice/`)

| Dimension | Finding |
|-----------|---------|
| SEO | Clear bridge to Deck Compass |
| AEO | Defines practice environment; could add one short definitional paragraph |
| Schema | Ecosystem only |
| Action | Optional WebPage schema + link to COMPASS article (template) |

### Training / COMPASS (`/compass/`, `/compass/apply/`)

| Dimension | Finding |
|-----------|---------|
| SEO | Data-driven copy from training modules |
| AEO | **FAQ present**—candidate for FAQPage JSON-LD |
| GEO | Links to method article |
| Action | Add FAQPage schema in Phase 5 |

### Subscribe / lead magnets

| Subscribe | `noindex`, omitted from sitemap — **correct** |
| AI field guide | Indexable landing; verify meta and author if traction matters |

---

## 5. Priority Page List

Pages that can build authority fastest with lowest editorial risk.

| Page | Current role | SEO priority | AEO priority | GEO priority | Recommended action | Risk | Notes |
|------|--------------|-------------|-------------|-------------|-------------------|------|-------|
| `/articles/compass-method/` | Method canon | High | High | High | Optional short answer + further reading links | Low | Sitemap 0.85; do not duplicate content |
| `/about/` | Author + entity hub | High | Med | **High** | Fix Person `@id`; add sameAs when ready | Low | Schema-only change possible first |
| `/` | Brand + routing | High | Med | High | One-sentence authority phrase in existing lede band | Low | No FAQ block |
| `/repeating-card-meanings/` | SEO hub | **High** | High | Med | Hub intro short answer; monitor indexing | Low | Wave 0/1 ops ongoing |
| `/repeating-card-meanings/the-fool/` (and Wave 1 queue) | Entity template | **High** | High | High | Indexing ops + surface snippet answer in UI | Med | GSC Discovered bucket |
| `/articles/why-the-same-tarot-card-keeps-appearing/` | Repeating patterns entry | High | High | High | Short answer block; link to hub | Low | Pairs with entity cluster |
| `/articles/what-ai-cant-access/` | AI series entry | High | High | High | Short answer; series link | Low | Flagship GEO topic |
| `/series/the-ai-and-intuition-series/` | Series hub | Med | High | High | Series summary block | Low | 7 parts complete |
| `/articles/tarot-pre-symbolic-interface/` | AI + method bridge | Med | High | High | Definition near top | Low | Strong differentiation |
| `/practice/` | Deck Compass bridge | Med | Med | Med | WebPage schema; one definitional line | Low | |
| `/compass/` | Training conversion | Med | **High** | Med | FAQPage JSON-LD | Low | FAQ already visible |
| `/blog/reading-the-grip/` (series) | Practitioner Field Notes | Med | Med | Med | Series framing + method links | Low | |
| `/tools/` | Tool discovery | Med | Med | Low | Improve tool blurbs | Low | |
| `/ai-and-intuition-field-guide/` | Lead magnet | Med | Med | Med | Audit meta + extractable summary | Low | |

---

## 6. Recommended Implementation Plan

### Phase 1: Documentation and audit only ✅

- Truth document + this audit.
- No template or content rewrites.

### Phase 2: Template and component improvements

- Optional `shortAnswer` / `whyThisMatters` / `compassApproach` frontmatter on articles (Zod + layout slot).
- `AuthorBlock.astro` (single source for attribution).
- `FurtherReading.astro` (optional frontmatter list).
- Render `featuredSnippetAnswer` on repeating-card entity pages (styled as Short answer, not duplicate of pull quote).
- Series summary slot on `/series/[slug]/`.

### Phase 3: Priority page improvements

- Apply short answers to ~10 URLs in §5 table only.
- Further reading on COMPASS method + 2–3 AI series anchors.
- Homepage/about micro-copy for authority phrase.

### Phase 4: Glossary and entity spine

- `/glossary/` route scaffold; seed 10–20 terms (symbolic interpretation, intuitive literacy, repeating card, viraha, COMPASS pillars, etc.).
- DefinedTerm schema on card pages pointing to glossary (per existing schema strategy).
- Consider `/field-notes/` redirects from `/blog/` when ready.

### Phase 5: Schema and technical refinement

- Unify About Person `@id` with `ENTITY_IDS.person`.
- FAQPage JSON-LD on `/compass/`.
- WebPage schema on practice/training as needed.
- Article `dateModified` when content updates.
- `llms.txt` draft in `public/`.

### Phase 6: External authority support

- Consistent naming in LinkedIn, interviews, guest posts.
- Link to canonical URLs (entity pages, method article, about).
- Monitor GSC indexing waves; adjust internal links from high-traffic pages to Discovered URLs.

**Do not implement Phases 2–6 in this pass** unless explicitly approved.

---

## 7. Low-Risk Quick Wins

Safe changes with minimal content disruption:

| Win | Type | Notes |
|-----|------|-------|
| Standard `AuthorBlock` component | Template | Wrap existing `articleAuthorAttribution` text |
| Optional `shortAnswer` frontmatter | Schema + layout | Empty by default |
| Optional `furtherReading` frontmatter | Component | Array of `{ title, href }` |
| Related method link helper | Component | Single link to `/articles/compass-method/` with custom label |
| Article metadata validation script | Tooling | Warn if excerpt &lt; 120 or &gt; 160 chars, missing series description |
| Field Note `positioningSentence` usage | Editorial | Already in schema—use on series openers |
| Series-level summary block | Template | 40–70 words from `seriesData.description` |
| About Person `@id` fix | Schema | One-line change in `about.astro` |
| FAQPage on `/compass/` | Schema | Map existing FAQ items to JSON-LD |
| `llms.txt` draft | Static file | Site purpose, key URLs, author, usage guidance |
| Glossary route scaffold | Route | Empty state + 3 seed terms |
| Surface `featuredSnippetAnswer` on entity pages | Template | Read from frontmatter; skip if empty |

---

## 8. Content Preservation Notes

**Do not lose or flatten** the following in any optimisation pass:

| Element | Why it matters |
|---------|----------------|
| Symbolic interpretation framing | Core differentiation from dictionary sites |
| Human advantage in the age of AI | AI series + practitioner edge positioning |
| The COMPASS Method™ as original framework | Proprietary methodology entity |
| Leigh Spencer’s **40+ years** tarot practice | Trust and GEO person entity |
| Leigh Spencer’s **30 years** journalism | Credibility and discernment narrative |
| Field Notes as personal/practical observations | Different job from evergreen articles |
| Articles as evergreen methodology | Series structure and depth |
| The Deck Compass as practice ecosystem | Commercial and pedagogical bridge |
| Reader-first clarity over SEO clutter | Non-negotiable editorial rule |
| Mystical but grounded voice | Brand; do not “sanitize” for snippets |
| Avoiding generic tarot content | Competitive moat |

Any removal or major rewrite of strategic paragraphs requires explicit documentation in commit/PR notes.

---

## 9. Questions Before Implementation

Confirm with Leigh / editorial lead before Phase 2+:

1. **Authority phrase placement:** Should “The leading source for tarot as symbolic interpretation, intuitive literacy, and structured reflective practice” appear verbatim on homepage, about, or meta only?
2. **Short answer pattern:** Approve the three-part block (Short answer / Why this matters / How TOK approaches) for articles—or shorter single-block variant?
3. **Repeating cards:** Should `featuredSnippetAnswer` appear **above** the long-form body, or in a collapsible “Quick answer” panel?
4. **Glossary scope:** First 10–20 terms only, or full COMPASS vocabulary upfront?
5. **Field Notes URL:** Migrate to `/field-notes/` with redirects, or keep `/blog/` indefinitely?
6. **Tag pages:** Keep indexing 57 tag URLs, or `noindex` thin tag pages and keep tags for on-site nav only?
7. **TechArticle vs Article:** Change article schema type, or keep TechArticle for methodology content?
8. **External profiles:** Which `sameAs` URLs are approved for Person schema (LinkedIn, Deck Compass about, etc.)?
9. **Indexing ops:** Continue manual GSC waves for 12-card queue, or pause until more internal links from indexed pages?
10. **Two-card tools:** Coordinate SEO/AEO with `docs/two-card-system/TWO-CARD-SEO-AEO-PLAN.md`—separate release or merged entity strategy?

---

## Phase 2 implementation status (2026-05-29)

### Implemented

| Item | Outcome |
|------|---------|
| Person `@id` | About page references `ENTITY_IDS.person` only; duplicate inline Person node removed |
| `shortAnswer` frontmatter | Optional on `articles` and `blog` collections; rendered via `ShortAnswerBlock` (“In brief” label) when set |
| `featuredSnippetAnswer` UI | Shown on entity repeating-card pages when distinct from `summary` (dedup logic in `RepeatingCardMeaningArticle`) |
| `AuthorBlock` | Shared component; inline variant on articles and Field Notes; `authorBlockExtended` exported for future cornerstone use |
| `FurtherReading` | Optional frontmatter + component on articles and Field Notes (hidden when empty) |
| COMPASS FAQ schema | `FAQPage` JSON-LD on `/compass/` from visible `T.faq.items` via `faqPageJsonLd()` |

**Build / validation:** `npm run build` passed; `validate:repeating-card-metadata` and `validate:related-cards` passed.

**Content files changed:** None (template-only pass).

### Deferred (unchanged from audit plan)

- Glossary hub, `llms.txt`, homepage/about copy, tag indexing policy, `/field-notes/` migration
- Populating `shortAnswer` / `furtherReading` on articles and Field Notes
- Series summary blocks, article metadata validation script, `sameAs` on Person
- Indexing wave operations (continue manually per existing runbooks)

### Risks / follow-up

- Repeating-card pages may show both long `summary` and “Short answer”; intentional hierarchy; dedup skips exact/substring duplicates only.
- COMPASS FAQ answers with HTML links lose anchor text in JSON-LD (plain text only); acceptable for schema.
- Confirm label preference: articles use **“In brief”**; repeating cards use **“Short answer”**.

### Decisions before Phase 3

See §9 (authority phrase placement, short-answer label unification, extended author block on cornerstone pages).

### Repeating card tool UX (Phase 3 preparation, 2026-05-29)

After the library-first SEO enhancement on `/tools/repeating-card-meanings/`, the page foregrounded the canonical library callout above the selector and pushed the interactive tool below the fold.

**Principle:** Tool-first hierarchy is required so SEO/AEO/GEO support does not undermine engagement. Canonical library signalling should support the tool, not displace it.

**Change applied:** Two-column workspace at the top (selector + compact library aside on desktop; selector before library note on mobile). Long explanatory copy moved below results. Crawlable links to `/repeating-card-meanings/` and “repeating card pattern library” preserved; canonical URLs and entity pages unchanged.

---

## Phase 3 implementation status (2026-05-29, wave 1)

Controlled content pass on six priority URLs. No routes, sitemap logic, card metadata, or broad rewrites.

### Pages reviewed

| URL | File(s) |
|-----|---------|
| `/articles/compass-method/` | `src/content/articles/compass-method.md` |
| `/articles/what-ai-cant-access/` | `src/content/articles/what-ai-cant-access.md` |
| `/articles/why-the-same-tarot-card-keeps-appearing/` | `src/content/articles/why-the-same-tarot-card-keeps-appearing.md` |
| `/` | `src/pages/index.astro` |
| `/repeating-card-meanings/` | `src/pages/repeating-card-meanings/index.astro` |
| `/blog/reading-the-grip/` | `src/content/blog/reading-the-grip/index.md` |

### Pages changed (change type)

| URL | Change type |
|-----|-------------|
| `/articles/compass-method/` | `shortAnswer`, `furtherReading` (4 curated links) |
| `/articles/what-ai-cant-access/` | `shortAnswer`, `furtherReading` (3 links), one contextual body link to COMPASS hub |
| `/articles/why-the-same-tarot-card-keeps-appearing/` | `shortAnswer`, `furtherReading` (4 links); body links to hub, tool, COMPASS already present |
| `/` | Hero micro-copy (authority phrase: symbolic interpretation, intuitive literacy, reflective tarot practice) |
| `/repeating-card-meanings/` | Hub hero tightened; card library moved above footer; hub vs tool distinction in intro links; COMPASS footer blurb; editorial links component in footer |
| `/blog/reading-the-grip/` | `shortAnswer` (frontmatter), COMPASS link in series intro body |

### Layout support (Phase 3)

| File | Change |
|------|--------|
| `src/layouts/FieldNoteSeriesLayout.astro` | Wire `shortAnswer` via `ShortAnswerBlock` (“In brief”) after subtitle |
| `src/pages/blog/[slug].astro` | Pass `seriesView.series.data.shortAnswer` to series layout |

### Pages intentionally unchanged

| URL | Reason |
|-----|--------|
| `/tools/repeating-card-meanings/` | Tool-first hierarchy already applied in Phase 3 prep |
| Repeating card entity pages | Out of scope; metadata and summaries untouched |
| `/practice/`, `/compass/` | No copy pass this wave (linked from `furtherReading` only) |
| Other articles and Field Notes | Deferred to wave 2 |

### Build / validation

- `npm run build`: passed
- `validate:repeating-card-metadata`: passed (78 cards)
- `validate:related-cards`: passed

### Em dash check (wave 1)

- New Phase 3 copy: no em dashes added.
- Pre-existing em dash in homepage JSON-LD `description` in `index.astro` fixed in wave 2 (see below).

### Risks / follow-ups (wave 1)

- **Label policy (confirmed wave 2):** “In brief” for articles, Field Notes, and series; “Short answer” for repeating-card entity pages.
- **Authority phrase (confirmed wave 2):** Homepage hero is canonical concept; About meta and lede adapted naturally (not verbatim paste).
- **Duplicate content IDs:** Astro content sync warns on duplicate ids for edited articles and `reading-the-grip/index` (pre-existing glob-loader pattern; monitor if collection behaviour changes).
- **Indexing:** Continue GSC manual waves for repeating-card entities in parallel with content passes.

### Recommended Phase 3 wave 2

- ~~About page micro-copy aligned with homepage authority phrase~~ Done (wave 2)
- ~~`/practice/` and `/compass/` light orientation copy~~ Done (wave 2)
- ~~`meaning-not-in-card` + AI continuation article~~ Done (wave 2)
- Cornerstone `authorBlockExtended` on COMPASS hub if approved in §9

---

## Phase 3 implementation status (2026-05-29, wave 2)

Controlled pass on About, Practice, COMPASS, three cluster articles, and homepage em dash cleanup. No routes, schema redesign, or bulk rewrites.

### Pages reviewed

| URL | File(s) |
|-----|---------|
| `/` | `src/pages/index.astro` (JSON-LD description em dash only) |
| `/about/` | `src/pages/about.astro` |
| `/practice/` | `src/pages/practice.astro` |
| `/compass/` | `src/pages/compass.astro` |
| `/articles/meaning-not-in-card/` | `src/content/articles/meaning-not-in-card.md` |
| `/articles/repeating-major-arcana-cards/` | `src/content/articles/repeating-major-arcana-cards.md` |
| `/articles/pre-verbal-knowing-ai/` | `src/content/articles/pre-verbal-knowing-ai.md` (AI series continuation) |

### Pages changed (change type)

| URL | Change type |
|-----|-------------|
| `/` | Em dash removed from `websiteLd.description` (period + second sentence) |
| `/about/` | Meta description + hero lede micro-copy (authority alignment, credentials) |
| `/practice/` | Internal links to COMPASS Method and COMPASS training; method section link clarity |
| `/compass/` | Hero micro-note (framework origin; training vs practice); no FAQ/schema change |
| `/articles/meaning-not-in-card/` | `shortAnswer`, `furtherReading`, one COMPASS body link |
| `/articles/repeating-major-arcana-cards/` | `shortAnswer`, `furtherReading`, tool link in library section |
| `/articles/pre-verbal-knowing-ai/` | `shortAnswer`, `furtherReading` (series + COMPASS) |

### Pages intentionally unchanged

| URL | Reason |
|-----|--------|
| `/compass/` FAQ JSON-LD | Still generated from visible `T.faq.items` via `faqPageJsonLd()`; content unchanged |
| `/about/` Person schema | No issue found; ecosystem `ENTITY_IDS.person` unchanged |
| `authorBlockExtended` on COMPASS hub | Would duplicate About; deferred |
| Repeating card tool, entity pages, other AI articles | Out of scope |

### Build / validation

- `npm run build`: passed
- `validate:repeating-card-metadata`: passed (78 cards)
- `validate:related-cards`: passed

### Em dash check (wave 2)

- Homepage JSON-LD description: fixed.
- All wave 2 changed files: no em dashes in new copy.

### Risks / follow-ups (wave 2)

- **COMPASS hero note** duplicates `trainingPractice` section below the fold; intentional reinforcement, not a new SEO block.
- **Next batch:** second AI article (`tarot-pre-symbolic-interface`), `repeating-cards-vs-stalker-cards`, About extended author block only if editorial wants it on articles not About.

---

## Phase 3 implementation status (2026-05-29, wave 3)

Cluster-completion pass: AI/intuitive literacy (2 articles), repeating-card capstone (1), Deck Compass methodology (1). `/compass/` reviewed only for hero-note duplication.

### Pages reviewed

| URL | File(s) |
|-----|---------|
| `/articles/tarot-pre-symbolic-interface/` | `src/content/articles/tarot-pre-symbolic-interface.md` |
| `/articles/myth-ai-intuition-simulation/` | `src/content/articles/myth-ai-intuition-simulation.md` |
| `/articles/repeating-cards-vs-stalker-cards/` | `src/content/articles/repeating-cards-vs-stalker-cards.md` |
| `/articles/the-flow-problem/` | `src/content/articles/the-flow-problem.md` |
| `/compass/` | `src/pages/compass.astro` (hero note review only) |

### Pages changed (change type)

| URL | Change type |
|-----|-------------|
| `/articles/tarot-pre-symbolic-interface/` | `shortAnswer`, `furtherReading` (series + COMPASS); body links already present |
| `/articles/myth-ai-intuition-simulation/` | `shortAnswer`, `furtherReading`, one body link to tarot pre-symbolic interface |
| `/articles/repeating-cards-vs-stalker-cards/` | `shortAnswer`, `furtherReading`; one body link to repeating majors article; hub/tool/COMPASS links already present |
| `/articles/the-flow-problem/` | `shortAnswer`, `furtherReading`; body links to COMPASS Method and Practice |
| `/compass/` | No change (hero note kept; see below) |

### `/compass/` hero note review

Hero note (“Training installs it; practice stabilises it”) and the `trainingPractice` section below share a concept but differ in length and function: hero orients before apply CTA; section explains programme vs platform. **Left unchanged** per editorial decision; not visibly repetitive enough to trim.

### Pages intentionally unchanged

| Item | Reason |
|------|--------|
| `authorBlockExtended` | Deferred by editorial decision |
| Repeating card tool and entity pages | Out of scope |
| Other AI / methodology series articles | Not in wave 3 list |
| `/compass/` copy and FAQ JSON-LD | Review-only |

### Build / validation

- `npm run build`: passed
- `validate:repeating-card-metadata`: passed (78 cards)
- `validate:related-cards`: passed

### Em dash check (wave 3)

- No em dashes in new copy across changed article files.

### Risks / follow-ups (wave 3)

- **AI cluster:** Remaining series essays (`meaning-wrong-battleground`, `augmented-intuition-vs-replaced-thinking`, etc.) not yet optimised.
- **Methodology cluster:** `from-more-to-better`, `rethinking-timing` still without `shortAnswer`.
- **Indexing:** Continue GSC waves for repeating-card entities in parallel.

### Recommended Phase 3 wave 4 (or Phase 4)

- Remaining AI series articles (2–3 anchors)
- Deck Compass methodology bookends (`from-more-to-better`, `rethinking-timing`)
- Indexing ops + `llms.txt` / glossary only when explicitly scheduled

---

## Phase 3 waves 1 to 3 consolidation

**Consolidation date:** 2026-05-29  
**Live-readiness review:** [`phase-3-live-readiness-review.md`](./phase-3-live-readiness-review.md)  
**Indexing workflow:** [`indexing-operations-plan.md`](./indexing-operations-plan.md)  
**Infrastructure prep:** [`llms-and-glossary-prep.md`](./llms-and-glossary-prep.md)

### Cluster status

| Cluster | Status | Priority URLs covered | Notes |
|---------|--------|----------------------|-------|
| **AI / intuitive literacy** | Substantially complete for priority wave | Cornerstone (`what-ai-cant-access`), `pre-verbal-knowing-ai`, `myth-ai-intuition-simulation`, `tarot-pre-symbolic-interface` | `shortAnswer` + `furtherReading` on four articles; series body links intact. Remaining series essays not optimised (deferred). |
| **Repeating-card interpretation** | Substantially complete for priority wave | Hub, tool UX, `why-the-same…`, `repeating-major-arcana-cards`, `repeating-cards-vs-stalker-cards` | Hub library-first; tool selector-first; cluster capstone language grounded. Entity pages unchanged (indexing via GSC waves). |
| **COMPASS / practice methodology** | Substantially complete for priority wave | `compass-method`, `meaning-not-in-card`, `the-flow-problem`, `/practice/`, `/compass/` | Method articles have extractable briefs; pathway pages have light orientation copy. `from-more-to-better`, `rethinking-timing` not in Phase 3. |
| **Homepage / About / pathway** | Complete for priority wave | `/`, `/about/`, `/practice/`, `/compass/` | Authority phrase on homepage; About aligned naturally; practice/training links clarified. |
| **Repeating card tool and hub** | Complete | `/repeating-card-meanings/`, `/tools/repeating-card-meanings/` | Action-first tool; hub as reference library. |
| **Field Notes (sample)** | Partial | `/blog/reading-the-grip/` | Series `shortAnswer` wired via `FieldNoteSeriesLayout`; bulk Field Notes not touched. |

### Phase 3 programme status

- **Phase 3 waves 1–3 are complete** for the agreed priority URL set.
- **Further content optimisation should pause** until live review on staging/production and indexing monitoring (30-day plan) have run.
- **Wave 4 is optional and targeted**, not automatic. Schedule only after deploy + GSC feedback on strengthened URLs.

### Template / infrastructure delivered (Phase 2, unchanged in consolidation)

- `ShortAnswerBlock` (“In brief”), `FurtherReading`, `AuthorBlock`
- Repeating-card entity “Short answer” when distinct from summary
- FAQPage JSON-LD on `/compass/`
- Person `@id` alignment on About

### Pre-commit correction pass (2026-05-29)

- **The COMPASS Method™** naming aligned on `/compass/`, `/articles/compass-method/`, `/practice/`, training data, and Phase 3 priority articles (formal framework references; conversational “COMPASS training” retained where appropriate).
- **Field Notes** added to primary navigation (`/blog/`, label “Field Notes”).
- **`/blog/` index** badge taxonomy clarified: Foundational Field Note, Field Note, Field Note Series (+ part count). Card colour and series stripe treatment added for attention-weight cues (earth / light blue / deep blue).
- **Mobile primary nav:** Collapsed menu at ≤900px (literal media-query px; CSS variables in `@media` fail on many phones). Burger opens vertical panel with all seven items; horizontal nav from 901px up.
- **Repeating Card hub voice:** Removed defensive “not fortune-telling / fixed predictions” framing from `/repeating-card-meanings/` and aligned Repeating Card Patterns article short answers with affirmative symbolic-interpretation language.

### Operational next steps (post-deploy)

1. Deploy Phase 2–3 commit to production.
2. Run mobile spot-check per live-readiness doc (5 “needs review” URLs).
3. Execute [`indexing-operations-plan.md`](./indexing-operations-plan.md) (5 URLs/day).
4. Continue Wave 1 entity queue where it does not conflict with daily cap.
5. Defer `llms.txt`, glossary routes, and wave 4 articles until monitoring shows indexing/stable snippets.

---

## 10. Implementation TODO (audit tracking)

Phase 2 (complete):

- [x] `AuthorBlock.astro` + replace layout duplicates
- [x] Article `shortAnswer` frontmatter (optional) + layout
- [x] `FurtherReading.astro` (optional)
- [x] Render repeating-card `featuredSnippetAnswer`
- [x] Fix About Person `@id` → `ENTITY_IDS.person`
- [x] FAQPage JSON-LD on `/compass/`

Phase 3 wave 1 (complete):

- [x] Short answers + further reading on COMPASS hub, AI entry, repeating methodology article
- [x] Homepage authority micro-copy
- [x] Repeating card hub orientation (library vs tool)
- [x] Reading the Grip series `shortAnswer` + layout wire
- [x] Repeating card tool action-first hierarchy (prep, same date)

Phase 3 wave 2 (complete):

- [x] Homepage JSON-LD em dash fix
- [x] About, Practice, COMPASS micro-copy and internal links
- [x] `meaning-not-in-card`, `repeating-major-arcana-cards`, `pre-verbal-knowing-ai` short answers + further reading

Phase 3 wave 3 (complete):

- [x] `tarot-pre-symbolic-interface`, `myth-ai-intuition-simulation` (AI cluster)
- [x] `repeating-cards-vs-stalker-cards` (repeating cluster capstone)
- [x] `the-flow-problem` (Deck Compass methodology cluster)
- [x] `/compass/` hero note review (no trim)

Phase 3 consolidation (complete):

- [x] Live-readiness review doc
- [x] Indexing operations plan (30 days)
- [x] llms.txt and glossary prep (docs only)

Phase 3+ (pending):

- [ ] Deploy + GSC monitoring per indexing plan
- [ ] Implement `public/llms.txt` (after prep sign-off)
- [ ] Glossary route scaffold
- [ ] Optional wave 4 articles (targeted only)
- [ ] Article metadata validation script
- [ ] Continue repeating-card indexing waves + tracker updates

---

## Appendix: Content inventory snapshot

| Collection / area | Count (approx.) | Notes |
|-------------------|-----------------|-------|
| Articles | 18 | 4 series in `seriesData` |
| Field Notes (`blog`) | 15 files | Includes demos; live series e.g. reading-the-grip |
| Repeating card meanings | 83 files | 79 ready; 78 with `featuredSnippetAnswer` |
| Static pages | about, practice, compass, tools, subscribe, lead magnets, legal | |
| Sitemap URLs | ~185 | Per GSC baseline doc |
| GSC not indexed (2026-05-25) | 155 total | 141 Discovered – not indexed |

---

*End of Phase 2 audit. No site templates or content were modified in this pass.*
