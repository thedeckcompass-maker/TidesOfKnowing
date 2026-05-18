# Schema Strategy
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 5 — Schema

---

## Purpose

This document defines the structured data strategy for all 78 repeating card meaning pages. It specifies which schema.org types to implement, which sections of each card page map to schema properties, and how schema markup should be applied to maximise AI retrieval signal and search engine feature eligibility.

---

## Schema Types Selected

### 1. Article

**Applies to**: Every card page (all 78)

**Rationale**: Each repeating card meaning page is a substantive interpretive article. Article schema provides Google and AI systems with explicit signals about the document's authorship, publication date, topic, and description. It is the foundational schema type for this content.

**Properties to populate**:
- `@type`: `Article`
- `headline`: card metaTitle
- `description`: frontmatter `summary` field
- `name`: H1 page title
- `datePublished`: set at publication
- `dateModified`: update when card content is revised
- `author`: site author object
- `publisher`: organisation object (Tides of Knowing)
- `url`: canonicalUrl
- `image`: openGraphImage
- `mainEntityOfPage`: canonicalUrl

---

### 2. BreadcrumbList

**Applies to**: Every card page (all 78)

**Rationale**: Breadcrumb schema enables sitelinks and breadcrumb display in search results. It also signals the hierarchical relationship between the card page and the collection. For a 78-page resource, clear breadcrumb signals prevent orphaned page treatment.

**Structure**:
```
Home > Repeating Card Meanings > [Card Name] Repeating Meaning
```

**Properties to populate**:
- Position 1: Home (`/`)
- Position 2: Repeating Card Meanings (`/repeating-card-meanings`)
- Position 3: Current card page (`/repeating-card-meanings/{card-slug}`)

---

### 3. FAQPage

**Applies to**: Every card page (all 78)

**Rationale**: FAQPage schema is the highest-yield schema type for this content. Life area sections and temporal repetition sections directly answer specific, high-frequency seeker questions. AI systems extract FAQPage content heavily for AI overviews. Life area sections answer queries like "what does [card] mean for career" — these are among the most common tarot search queries.

**FAQ question sources** (in priority order):
1. Life area sections (all 7: Love, Career, Money, Spiritual Growth, Emotional Patterns, Family, Health) — highest priority
2. Temporal repetition sections (Weekly, Monthly, Seasonal, Annual) — high priority
3. Shadow Expression section — medium priority
4. "Why This Energy Has Not Released Yet" section — high priority (directly answers primary seeker query)
5. "What This Card Wants the Seeker to Understand" — medium priority

**FAQ count per card**: 7-12 FAQ entries recommended (7 life areas + 4 temporal + optionally 1 from "Why Not Released")

**Answer length guidance**: Each FAQ answer should be drawn directly from the card's section text. Do not truncate below 50 words or extend above 300 words. Prefer complete paragraphs, not partial sentences.

---

### 4. DefinedTerm (Optional — Recommended for Future)

**Applies to**: Cards where a distinctive Tides of Knowing conceptual term is introduced (e.g., "threshold-paralysis", "performing-departure")

**Rationale**: DefinedTerm schema signals that the site has definitional authority over specific interpretive concepts. This supports entity recognition for the COMPASS Method and the Tides of Knowing vocabulary.

**Status**: Future enhancement. Do not implement until a glossary or method vocabulary page exists. Preferred future URL: `https://www.tidesofknowing.com/glossary/`. Alternative: `https://www.tidesofknowing.com/articles/compass-method/`. When implemented, DefinedTerm schema on each card page would point to that glossary as `inDefinedTermSet`.

---

## Priority Order for Implementation

| Priority | Schema Type | Yield |
|----------|-------------|-------|
| 1 | FAQPage | Highest — AI overview extraction, People Also Ask |
| 2 | Article | High — foundation signal for all AI retrieval |
| 3 | BreadcrumbList | Medium-High — sitelinks, collection signal |
| 4 | DefinedTerm | Low-Medium — future authority signal |

---

## Implementation Notes

### Rendering Method
Confirmed: The site uses Astro (SSG). JSON-LD blocks should be injected in the `<head>` of each card page via Astro layout components or head slots. The `schema-field-map.yaml` provides the property-to-source-field mapping for template generation.

### Date Fields
- `datePublished` is not in the current frontmatter and must be added at publication time
- Use a site-wide launch date for the initial publication pass, not git commit timestamps (git timestamps reflect phased development, not editorial publication order)
- `dateModified` should be updated manually or via CMS workflow when content is revised

### Image Format
- Confirmed `.jpg` format
- Confirmed path pattern: `/images/tarot/rws/{card-slug}.jpg`
- Full URL: `https://www.tidesofknowing.com/images/tarot/rws/{card-slug}.jpg`
- Note: Existing card images are card art assets. Dedicated 1200x630px OG images should be created later for social sharing. Existing images serve as an interim fallback.

### Author and Publisher Objects
The `author` and `publisher` objects should be consistent across all 78 card pages. Define them once in a shared schema partial and reference per-page.

Confirmed pattern:
```json
"author": {
  "@type": "Person",
  "name": "Leigh Spencer",
  "url": "https://www.tidesofknowing.com/about/"
},
"publisher": {
  "@type": "Organization",
  "name": "Tides of Knowing",
  "url": "https://www.tidesofknowing.com/"
}
```

Rationale: The content is authored through Leigh Spencer's tarot practice, symbolic interpretation work, and authorship of The COMPASS Method TM. Tides of Knowing is the publishing entity.

### FAQPage and Article Co-existence
Google supports multiple schema types on a single page. The preferred implementation is to consolidate all three types (Article, BreadcrumbList, FAQPage) into a single `@graph` JSON-LD block. This is cleaner to maintain in Astro than managing three separate script elements. See `jsonld-example-library.md` Example 5 for the preferred @graph pattern. Separate blocks remain a valid alternative if the Astro layout already has a clean multi-block injection mechanism.

---

## Schema Sections That Should NOT Be Marked Up

- Reflective Questions section: Questions that invite the seeker to reflect on their own experience are not factual FAQ pairs. Wrapping them in FAQPage schema would misrepresent the content type and may reduce eligibility for featured snippet extraction.
- Practical Integration Actions section: These are instructional tasks, not FAQ answers. They do not map to FAQPage schema. Future consideration: HowTo schema if a dedicated integration page is built.

---

## Exclusions

- SpeakableSpecification: Not recommended at this stage. Voice search extraction is better served by high-quality Article and FAQPage schema than by explicit speakable markup, which has limited adoption.
- VideoObject: Not applicable unless video content is added.
- Review / AggregateRating: Not applicable to interpretive content.
