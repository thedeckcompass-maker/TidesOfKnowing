# Implementation Roadmap
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 8 — Cursor Implementation

---

## Purpose

This document defines the implementation sequence for deploying the SEO/AEO intelligence layer into the Tides of Knowing live site. It is structured as a Cursor-compatible task sequence — each phase contains discrete, implementable steps with clear inputs, outputs, and verification checks.

This roadmap assumes:
- The site is built on Astro with markdown content collections
- The content collection is stored at `src/content/repeating-card-meanings/`
- JSON-LD is injected via layout components or Astro head slots using the @graph pattern
- The human implementer is working in Cursor with access to the full codebase

Confirm Astro version before beginning Phase 1.

---

## Pre-Implementation Checks

Before beginning any implementation phase, verify:

- [x] Content collection path: `src/content/repeating-card-meanings/` (suit subfolders: majors, cups, swords, wands, pentacles)
- [x] Major Arcana suit field value: `"n/a"` (not `"major-arcana"` or `"majors"`)
- [x] Image format: `.jpg` at `/images/tarot/rws/{card-slug}.jpg`
- [x] Site URL: `https://www.tidesofknowing.com`
- [x] Author: Person — Leigh Spencer | Publisher: Organization — Tides of Knowing
- [x] JSON-LD implementation: @graph consolidated pattern (preferred)
- [ ] Confirm Astro version
- [x] Individual card canonical URL: `/repeating-card-meanings/{slug}/` (confirmed, trailing slash). Do not use `/tools/repeating-card-meanings/{slug}`. Astro route: `src/pages/repeating-card-meanings/[...slug].astro`
- [x] Trailing slash on canonical paths (helpers in `src/lib/repeatingCardUrls.ts`; `card-metadata-map.yaml` updated)
- [x] Astro schema accepts optional SEO fields (`src/content/config.ts`)
- [ ] Back up the current content collection before adding new frontmatter fields

---

## Phase 1 — Frontmatter Extension

**Goal**: Add SEO/AEO fields to each of the 78 card markdown files.

**Source files**:
- `04-metadata/card-metadata-map.yaml` — all metadata values for all 78 cards
- `frontmatter-field-map.md` — confirms current field structure and missing fields

**Fields to add** (per card):
```yaml
metaTitle: ""
metaDescription: ""
primaryKeyword: ""
secondaryKeywords: []
featuredSnippetAnswer: ""
answerEngineSummary: ""
canonicalUrl: ""
openGraphImage: ""
```

**Values for each field**: Drawn from `card-metadata-map.yaml`. The card's collection ID (e.g., `majors/the-fool`) is the lookup key.

**Implementation approach**:
- Do not manually edit 78 files — use the Cursor implementation prompts in `cursor-prompts.md` to automate frontmatter extension
- After extension, verify frontmatter structure on a sample of 5 cards (major arcana + numbered minor + court card)
- Confirm no existing fields were altered

**Verification**:
- [ ] Run Astro build — confirm no frontmatter parse errors
- [ ] Spot-check `the-fool.md`, `five-of-cups.md`, `king-of-wands.md` for correct field values
- [ ] Confirm Astro zod schema is updated to accept new fields

**Rollback**: Restore from backup if build fails.

---

## Phase 2 — Astro Schema Update

**Goal**: Update the Astro content collection schema (zod validation) to accept the new frontmatter fields.

**File to update**: `src/content/config.ts` (or equivalent collection config file)

**New fields to add to the zod schema**:
```typescript
metaTitle: z.string().optional(),
metaDescription: z.string().optional(),
primaryKeyword: z.string().optional(),
secondaryKeywords: z.array(z.string()).optional(),
featuredSnippetAnswer: z.string().optional(),
answerEngineSummary: z.string().optional(),
canonicalUrl: z.string().optional(),
openGraphImage: z.string().optional(),
datePublished: z.string().optional(),
dateModified: z.string().optional(),
```

**Note**: Using `.optional()` for all new fields ensures backward compatibility during rollout. Fields can be made required after all 78 cards are confirmed to have values.

**Verification**:
- [ ] `astro check` passes with no type errors
- [ ] `astro build` completes without errors
- [ ] New fields are accessible in page templates via `entry.data.metaTitle` etc.

---

## Phase 3 — JSON-LD Schema Injection

**Goal**: Inject Article, BreadcrumbList, and FAQPage JSON-LD into the `<head>` of every card page.

**Source files**:
- `05-schema/schema-strategy.md` — schema type decisions and implementation notes
- `05-schema/schema-field-map.yaml` — field-to-source mappings
- `05-schema/jsonld-example-library.md` — ready-to-use JSON-LD examples

**Implementation approach**:

### Step 3a — Create a shared JSON-LD component

Create a reusable Astro component (e.g., `CardSchema.astro`) that accepts card frontmatter data and renders all three schema types in a single `@graph` JSON-LD block. See `cursor-prompts.md` Prompt 3A for the generation prompt. Use `jsonld-example-library.md` Example 5 as the reference implementation.

### Step 3b — Inject FAQPage question-answer pairs

The FAQPage block requires section content from the card markdown body. The implementation must:
1. Parse the rendered card markdown to extract section text by heading
2. Map section text to FAQ question-answer pairs using the patterns in `schema-field-map.yaml`
3. Render the FAQ pairs as JSON-LD `mainEntity` items

A new extraction utility is needed (Q2.4 confirmed). The current tool uses heading processing helpers, but FAQ extraction should be built separately. See `cursor-prompts.md` Prompt 3C for the implementation specification. Build to extract from raw markdown before rendering — do not rely on DOM scraping.

### Step 3c — Add schema component to card page layout

Add `<CardSchema>` to the card page layout component, passing the card's frontmatter data.

**Verification**:
- [ ] Validate 3 card pages using Google Rich Results Test
- [ ] Confirm Article schema is detected
- [ ] Confirm BreadcrumbList schema is detected
- [ ] Confirm FAQPage schema is detected and FAQ items render correctly
- [ ] Check for schema errors or warnings

---

## Phase 4 — Summary Field Rendering

**Goal**: Render the frontmatter `summary` field as a visible "In Brief" block near the top of each card page.

**Source**: `07-ai-retrieval/ai-retrieval-audit.md` — identified as the highest-impact AI retrieval improvement

**Implementation approach**:
- Add a styled "Core Pattern" block to the card page template
- Label: "Core Pattern" (confirmed Q4.2)
- Position: immediately below the H1, above the opening blockquote
- Content: `entry.data.summary`
- Styling: visually distinct from body content (e.g., highlighted block or card element)

**Verification**:
- [ ] Confirm `summary` text is visible in rendered HTML
- [ ] Confirm `summary` text is indexed (check Google Search Console after crawl)
- [ ] Confirm visual design matches site aesthetic (human review required)

---

## Phase 5 — Status Field Update

**Goal**: Update the `status` field from `"draft"` to `"published"` for all 78 cards at launch.

**Current value**: `"draft"` (all 78 cards)
**Target value**: `"published"`

**Note**: The `status: "draft"` field does not block rendering — draft-status files have already been rendered successfully through the content collection (Q2.5 confirmed). The status field is editorial metadata. Update to `"published"` when the site is ready for public indexing, and confirm whether this triggers any sitemap behaviour in the site config.

**Verification**:
- [ ] Confirm sitemap includes all 78 card URLs after status update
- [ ] Confirm no draft-filtering logic excludes published cards

---

## Phase 6 — Related Cards Component

**Goal**: Render related cards as in-content links on each card page.

**Source file**: `03-related-cards/related-card-map.yaml` — 3-5 related cards per card with relationship types

**Implementation approach**:
- Add related card IDs to each card's frontmatter (using collection IDs from `related-card-map.yaml`)
- Create a `RelatedCards.astro` component that accepts related card IDs and renders card name + brief pattern descriptor as links
- Display: bottom-of-page grid first, inline links added later where editorially natural (Q4.3 confirmed)
- Anchor text: use card name + pattern descriptor per `internal-linking-map.yaml` anchor_text_suggestion

**Verification**:
- [ ] Confirm related card links render on card pages
- [ ] Confirm links are valid (point to existing card pages)
- [ ] Confirm anchor text is descriptive, not just card name

---

## Phase 7 — Pillar Pages (Post-Launch)

**Goal**: Create 11 pillar collection pages for each topic cluster.

**Source files**:
- `06-internal-linking/topic-cluster-map.md` — pillar page structure and linking guidance
- `06-internal-linking/future-content-opportunities.md` — pillar page priority order

**Launch priority pillar pages** (confirmed Q5.1):
1. Why Tarot Cards Repeat
2. Repeating Major Arcana Cards
3. Repeating Tarot Cards in Love and Relationships
4. Repeating Tarot Cards and Shadow Patterns

**Post-launch pillar pages**:
- Repeating Tarot Cards in Career and Purpose
- Repeating Tarot Cards During Spiritual Transition
- Repeating Minor Arcana Cards
- Repeating Court Cards
- Repeating Cards and Emotional Cycles
- Repeating Cards and Timing
- Repeating Cards as Journaling Prompts

**Implementation approach**:
- Each pillar page lists all cards in its cluster with the `answerEngineSummary` as the card preview
- Each pillar page is the link destination for in-content cluster links from card pages
- See `future-ai-features.md` Feature 5 for AI-assisted pillar page generation approach

**Verification**:
- [ ] Pillar pages are crawlable and included in sitemap
- [ ] Pillar pages link to all cards in their cluster
- [ ] Card pages link to their respective pillar page(s)

---

## Implementation Priority Summary

| Phase | Action | Impact | Effort | Priority |
|-------|--------|--------|--------|---------|
| 1 | Frontmatter extension | High | Medium | Launch critical |
| 2 | Astro schema update | High | Low | Launch critical |
| 3 | JSON-LD schema injection | High | Medium | Launch critical |
| 4 | Summary field rendering | High | Low | Launch critical |
| 5 | Status field update | Medium | Low | Launch day |
| 6 | Related cards component | Medium | Medium | Post-launch v1 |
| 7 | Pillar pages | High | High | Post-launch v2 |

---

## Launch Readiness Checklist

Before going live with the SEO/AEO layer:

- [ ] All 78 frontmatter fields populated
- [ ] All 78 cards pass Astro build
- [ ] JSON-LD schema validated on minimum 5 representative card pages
- [ ] Summary field is rendered visibly on all card pages
- [ ] Status fields updated to `"published"`
- [ ] Sitemap confirmed to include all 78 card URLs
- [ ] Robots.txt allows crawling of all card pages
- [ ] Google Search Console verified and sitemap submitted
- [ ] At least one pillar page live ("Why Tarot Cards Repeat" recommended as first priority — confirmed Q5.1)
