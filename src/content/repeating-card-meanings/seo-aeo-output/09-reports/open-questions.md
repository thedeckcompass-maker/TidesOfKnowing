# Open Questions
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Updated: 2026-05-18 — all original questions resolved; Q-R1 resolved 2026-05-18

---

## Purpose

This document records all implementation decisions and confirmation items for the SEO/AEO intelligence layer. All 24 original questions and one residual question (Q-R1) have been resolved. There are no open questions.

---

## Resolved Questions

### Q1.1 — Site URL
**Status**: Resolved
**Answer**: `https://www.tidesofknowing.com`
Use this full canonical domain (with www) in all schema blocks, canonicalUrl examples, BreadcrumbList entries, and implementation prompts. All documentation updated accordingly.

---

### Q1.2 — Author Attribution Model
**Status**: Resolved
**Answer**:
```
author:
  "@type": Person
  name: Leigh Spencer
  url: https://www.tidesofknowing.com/about/

publisher:
  "@type": Organization
  name: Tides of Knowing
  url: https://www.tidesofknowing.com/
```
Rationale: The content is authored through Leigh Spencer's long-term tarot practice, symbolic interpretation, journalism and editing background, and authorship of The COMPASS Method TM. Tides of Knowing is the publishing entity.

---

### Q1.3 — Site Language Code
**Status**: Resolved
**Answer**: `en-NZ`
Rationale: The site is written in English by a New Zealand-based author and brand. All schema `inLanguage` fields use `en-NZ`.

---

### Q2.1 — Astro Content Collection Folder Path
**Status**: Resolved
**Answer**:
```
src/content/repeating-card-meanings/
  majors/
  cups/
  swords/
  wands/
  pentacles/
```
Current tool route: `src/pages/tools/repeating-card-meanings.astro`
Public collection URL: `https://www.tidesofknowing.com/tools/repeating-card-meanings/`

---

### Q2.2 — suit Field Value for Major Arcana
**Status**: Resolved
**Answer**: Major Arcana frontmatter uses `suit: "n/a"`. Collection IDs use the `majors/` prefix. Do not use `"major-arcana"` or `"majors"` as the suit field value. Minor suit field values are: cups, swords, wands, pentacles.

---

### Q2.3 — Multi-Block JSON-LD Support
**Status**: Resolved
**Answer**: Use the consolidated `@graph` pattern as the preferred implementation. This is cleaner to maintain in Astro and reduces duplicated script management. Separate script blocks are an alternative if the layout already has a clean multi-block pattern, but @graph is the default. See `jsonld-example-library.md` Example 5 (the @graph example) for the preferred implementation.

---

### Q2.4 — Markdown Section Extraction Method
**Status**: Resolved
**Answer**: A new utility function is needed. The current repeating-card-meanings tool uses heading processing helpers, but a dedicated FAQ extraction utility should be built separately. Build the utility to extract sections by H2 heading from raw markdown content before rendering. Do not rely on DOM scraping. See `cursor-prompts.md` Prompt 3C for the implementation specification.

---

### Q2.5 — status Field Behaviour
**Status**: Resolved
**Answer**: The `status: "draft"` field does not block rendering. Draft-status card files have already been rendered successfully through the content collection. The status field is editorial metadata, not a rendering filter. Before launch and public indexing, update published cards to `status: "published"` and confirm whether this triggers any sitemap or filtering behaviour in the site config.

---

### Q2.6 — Date Field Generation
**Status**: Resolved
**Answer**: Use a site-wide launch/publication date for the first publication pass rather than git commit timestamps. Git timestamps reflect phased development commits, not editorial publication order. Recommended value for initial launch: the actual public launch date. `dateModified` should be updated manually or via CMS workflow when content is revised.

---

### Q3.1 — Image File Format
**Status**: Resolved
**Answer**: Confirmed `.jpg`. Current image convention: `public/images/tarot/rws/{card-slug}.jpg`

---

### Q3.2 — Image Directory Path
**Status**: Resolved
**Answer**: Confirmed image path pattern: `/images/tarot/rws/{card-slug}.jpg`

Full URL pattern: `https://www.tidesofknowing.com/images/tarot/rws/{card-slug}.jpg`

Examples:
- `https://www.tidesofknowing.com/images/tarot/rws/the-fool.jpg`
- `https://www.tidesofknowing.com/images/tarot/rws/ace-of-cups.jpg`
- `https://www.tidesofknowing.com/images/tarot/rws/the-wheel-of-fortune.jpg`

Note: Wheel of Fortune uses `the-wheel-of-fortune.jpg` (not `wheel-of-fortune.jpg`).
Note: The `openGraphImage` values in `card-metadata-map.yaml` have been updated to use this path.

---

### Q3.3 — OG Image Dimensions
**Status**: Resolved
**Answer**: Do not assume existing tarot card images (1:1 or portrait card art) are suitable as Open Graph images. OG images should be 1200x630px. Use existing card images as an interim fallback in schema `image` property, but plan to create dedicated card-level OG/social images. For now, `openGraphImage` uses the existing card image path as an interim value.

---

### Q4.1 — Brand Separator in metaTitle
**Status**: Resolved
**Answer**: Use a pipe separator. Confirmed format: `{Card Name} Keeps Appearing in Tarot | Tides of Knowing`
Rationale: Project style avoids em dashes. The pipe is cleaner for metadata and consistent with SEO conventions. All 78 metaTitle values in `card-metadata-map.yaml` have been updated to use the pipe separator.

---

### Q4.2 — "In Brief" Block Label
**Status**: Resolved
**Answer**: Use "Core Pattern" as the label.
Rationale: More aligned with Tides of Knowing language than "In Brief", and more precise for the resource's purpose. All implementation documentation updated accordingly.

---

### Q4.3 — Related Cards Display Format
**Status**: Resolved
**Answer**: Use both inline links and a bottom-of-page grid.
Implementation priority:
1. Bottom-of-page grid first — controlled implementation, reliable internal linking
2. Add inline links later where editorially natural

Rationale: The bottom grid creates reliable internal linking without interrupting long-form reading flow. Inline links should be added carefully to avoid over-optimised prose.

---

### Q4.4 — Health Content Disclaimer
**Status**: Resolved
**Answer**: No current health disclaimer template confirmed. Avoid medical framing in all content. Use energetic, stress, embodiment, rhythm, depletion, restoration, and nervous-system language only. If health-focused cluster pages are created, use this light disclaimer: "This content is for reflective and symbolic interpretation only and is not medical advice. For health concerns, consult a qualified health professional."

---

### Q4.5 — FAQ Question Phrasing Approval
**Status**: Resolved
**Answer**: Use natural seeker-language questions. Approved patterns:
- "Why does [Card Name] keep appearing in my tarot readings?"
- "What does it mean when [Card Name] repeats?"
- "What does [Card Name] mean when it keeps showing up in love readings?"
- "What does [Card Name] mean when it keeps appearing around work or purpose?"
- "Why might [Card Name] keep appearing over weeks or months?"
- "What lesson is [Card Name] asking me to integrate?"
Avoid overly generic or mechanical schema-only phrasing.

---

### Q5.1 — Pillar Page Priorities
**Status**: Resolved
**Answer**:

Launch priority pillar pages (build first):
1. Why Tarot Cards Repeat
2. Repeating Major Arcana Cards
3. Repeating Tarot Cards in Love and Relationships
4. Repeating Tarot Cards and Shadow Patterns

Post-launch pillar pages:
- Repeating Tarot Cards in Career and Purpose
- Repeating Tarot Cards During Spiritual Transition
- Repeating Minor Arcana Cards
- Repeating Court Cards
- Repeating Cards and Emotional Cycles
- Repeating Cards and Timing
- Repeating Cards as Journaling Prompts

Note: This revised priority list replaces the original cluster-based recommendation in `topic-cluster-map.md`. The original cluster-based list remains valid as reference but this is the confirmed launch sequence.

---

### Q5.2 — Tier-4 Card Cluster Assignments
**Status**: Resolved (provisional — review before implementation)
**Answer**: Use these as provisional cluster assignments. Mark as "review before implementation" in any cluster expansion work.

| Card | Provisional Cluster Territory |
|------|-------------------------------|
| The Star | Spiritual Transition / Healing After Rupture |
| Five of Wands | Creative Blocks / Conflict and Friction |
| Nine of Wands | Burnout / Boundary Fatigue / Resilience Patterns |
| Knight of Wands | Impulse / Momentum / Creative Fire |
| Seven of Cups | Emotional Fantasy / Choice Overload / Projection |
| Two of Swords | Avoidance / Decision Paralysis / Mental Holding Pattern |
| Four of Swords | Recovery / Nervous System Rest / Integration Pause |
| Page of Swords | Curiosity / Watchfulness / Emerging Truth |
| Knight of Swords | Urgency / Mental Pressure / Reactive Action |
| Two of Pentacles | Balance / Resource Management / Daily Rhythms |
| Queen of Pentacles | Embodiment / Care / Sustainable Support |

---

### Q5.3 — New Cluster Creation
**Status**: Resolved
**Answer**: Approve as future cluster territories, not launch blockers:
- Spiritual Emergence
- Body and Health (preferred naming: Embodiment, Energy, and Daily Rhythms)
- Collaboration and Community
- Creative Blocks

These should be planned as post-launch cluster and pillar page expansions.

---

### Q6.1 — Content Ownership for Ongoing Governance
**Status**: Resolved
**Answer**: Owner: Leigh Spencer. Leigh Spencer holds final editorial authority over terminology, symbolic interpretation, and publishing priorities. Cursor and AI-assisted workflows may assist with implementation, auditing, and formatting, but all editorial decisions sit with Leigh Spencer.

---

### Q6.2 — Keyword Audit Schedule
**Status**: Resolved
**Answer**: First keyword audit 6 months after public launch, then every 6 months. Data sources: Google Search Console, analytics and search query data, manual review of AI answer visibility, internal site search (when available). Owner: Leigh Spencer, supported by AI and Cursor review workflows.

---

### Q6.3 — AI Retrieval Monitoring
**Status**: Resolved
**Answer**: Start with lightweight monitoring. Use Google Search Console impressions and queries, manual spot checks in Google AI Overviews, manual spot checks in Perplexity and ChatGPT Search, and periodic review of whether Tides of Knowing appears for target queries. Do not invest in paid third-party tracking until the resource has sufficient indexing history.

---

### Q6.4 — DefinedTerm Schema Prerequisite
**Status**: Resolved
**Answer**: Do not implement DefinedTerm schema until a glossary or method vocabulary page exists. Preferred future URL: `https://www.tidesofknowing.com/glossary/`. Alternative: `https://www.tidesofknowing.com/articles/compass-method/`. Document as a future enhancement until the prerequisite page exists.

Terminology note: Use "The COMPASS Method TM" in visible editorial copy. Schema `name` fields may use "The COMPASS Method" without the trademark symbol for clean machine-readable naming.

---

## Residual Question

One question was identified during the resolution process that was not in the original 24.

### Q-R1 — Individual Card Canonical URL Prefix
**Status**: Resolved
**Answer**: Individual card pages use `/repeating-card-meanings/{slug}/`. Do not use `/tools/repeating-card-meanings/{slug}`.

Architecture:
- Interactive dropdown tool: `https://www.tidesofknowing.com/tools/repeating-card-meanings/`
- Individual card pages: `https://www.tidesofknowing.com/repeating-card-meanings/{slug}/`

Examples:
- `https://www.tidesofknowing.com/repeating-card-meanings/the-fool/`
- `https://www.tidesofknowing.com/repeating-card-meanings/ace-of-cups/`
- `https://www.tidesofknowing.com/repeating-card-meanings/king-of-pentacles/`

Rationale: Individual card pages are long-form interpretive resources: canonical indexable article/entity pages for SEO, AI retrieval, direct linking, card-level schema, internal linking, and evergreen entity indexing. They are not tool states and should not be nested under `/tools/`.

Implementation: The individual card Astro route should be `src/pages/repeating-card-meanings/[...slug].astro` (not under `src/pages/tools/`).

Note on trailing slash: Resolved. Astro does not set `trailingSlash`, but URL helpers and sitemap use trailing slashes. All `canonicalUrl` values in `card-metadata-map.yaml` now use `/repeating-card-meanings/{slug}/`. Implementation helpers: `getRepeatingCardSeoCanonicalPath()` in `src/lib/repeatingCardUrls.ts`.

---

## Resolution Summary

| Total questions | 24 original + 1 residual |
|----------------|--------------------------|
| Resolved | 25 |
| Open | 0 |

---

## Governance

Owner: Leigh Spencer
Files updated based on these resolutions: `card-metadata-map.yaml`, `metadata-governance.md`, `schema-strategy.md`, `schema-field-map.yaml`, `jsonld-example-library.md`, `implementation-roadmap.md`, `cursor-prompts.md`
Q-R1 resolution files updated: `open-questions.md`, `implementation-roadmap.md`, `cursor-prompts.md`, `jsonld-example-library.md`
