# Frontmatter Field Map
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 1 — System Audit

---

## Current Field Set — All 78 Cards

| Field | Type | Required | Consistent | Notes |
|-------|------|----------|------------|-------|
| `title` | string | yes | yes | Pattern: `"{Card Name} Repeating Meaning"` |
| `slug` | string | yes | yes | Pattern: `"repeating-card-meanings/{card-name}"` |
| `arcana` | string | yes | yes | Values: `"major"` or `"minor"` |
| `suit` | string | yes | yes | Values: `"major-arcana"`, `"cups"`, `"wands"`, `"swords"`, `"pentacles"` |
| `card_number` | string | yes | yes | String type; 0-21 for majors, 1-14 for minors |
| `tier` | string | yes | yes | Values: `"full"` (majors), `"abbreviated"` (minors) |
| `status` | string | yes | yes | Current value: `"draft"` across all cards |
| `summary` | string | yes | yes | 60-110 words, distinct from opening blockquote |

---

## Field Detail Analysis

### title
- Format: `"[Card Name] Repeating Meaning"` uniformly applied
- Used as H1 heading in document body (also repeated as `# [Card Name] Repeating Meaning`)
- Not currently used as metaTitle (different field needed for SEO)
- Future extension: `metaTitle` should be a separate field or generated from `title` via helper

### slug
- Format: `"repeating-card-meanings/{card-name}"` uniformly applied
- Used as the canonical URL path segment
- Kebab-case, all lowercase
- No trailing slash
- Not currently including domain (correct — domain belongs in config)

### arcana
- Two values in use: `"major"` and `"minor"`
- Note: `suit` field already encodes this for minors; `arcana` provides a clean boolean-style filter
- Useful for filtering: majors vs. minors, suit-level views, collection queries

### suit
- Values: `"major-arcana"`, `"cups"`, `"wands"`, `"swords"`, `"pentacles"`
- Note: Major Arcana suit value is `"major-arcana"` (with hyphen) not `"majors"`
- This differs from the collection ID prefix which uses `majors/` (without hyphen)
- IMPORTANT: Confirm whether collection ID folder is `majors/` vs `major-arcana/` in the live Astro repo before implementing taxonomy queries

### card_number
- String format: `"0"` through `"21"` for majors; `"1"` through `"14"` for minors
- Court cards: Page = `"11"`, Knight = `"12"`, Queen = `"13"`, King = `"14"`
- The Fool = `"0"` (confirmed)
- String type is important — do not cast to integer in schema without confirming downstream usage
- Useful for sequential navigation (prev/next card) and suit ordering

### tier
- Two values: `"full"` (Major Arcana), `"abbreviated"` (Minor Arcana)
- This likely affects rendering templates (word count targets differ per tier)
- Future use: conditional rendering of content sections based on tier

### status
- All cards currently `"draft"`
- Should be updated to `"published"` as part of launch preflight
- Useful for draft/preview gating in Astro — confirm whether this is used in content collection filtering

### summary
- 60-110 words per card (confirmed across audit sample)
- Distinct from the opening blockquote (which is shorter and image-focused)
- Currently stored in frontmatter only — not rendered as a visible page section
- Used for: metaDescription base, answerEngineSummary, social sharing, collection listing pages

---

## Missing Fields (Needed for SEO/AEO Layer)

The following fields do not currently exist but are recommended for future implementation:

| Field | Type | Purpose | Priority |
|-------|------|---------|---------|
| `metaTitle` | string | SEO title tag (distinct from H1) | High |
| `metaDescription` | string | SEO meta description | High |
| `canonicalUrl` | string | Canonical URL (absolute) | High |
| `openGraphImage` | string | OG image path | Medium |
| `datePublished` | string | ISO date for schema.org | Medium |
| `dateModified` | string | ISO date for schema.org | Medium |
| `primaryKeyword` | string | Primary SEO keyword | Medium |
| `secondaryKeywords` | array | Secondary keyword list | Medium |
| `themes` | array | Controlled vocabulary taxonomy | Medium |
| `seeker_states` | array | Controlled vocabulary taxonomy | Medium |
| `life_areas` | array | Controlled vocabulary taxonomy | Medium |
| `related_cards` | array | Related card collection IDs | Medium |
| `featured_snippet_answer` | string | 40-70 word direct answer | Medium |
| `extractable_quote` | string | Citation-worthy pull quote | Low |
| `ai_retrieval_strength` | string | low/medium/high signal | Low |

---

## Extension Recommendations

1. Add SEO fields as a separate frontmatter block or as individual fields (human review required for schema approach)
2. Keep core content fields (`title`, `slug`, `arcana`, `suit`, `card_number`, `tier`, `status`, `summary`) stable — these are the structural fields that Astro content collection relies on
3. Add metadata fields to the Astro content collection schema with appropriate zod validation
4. The `themes`, `seeker_states`, and `life_areas` fields could be inline YAML arrays or sourced from the taxonomy YAML in this package
5. Do not add `word_target` field (editorial rule — already confirmed absent)
6. Do not add `compass_references` or similar proprietary-method naming to source markdown (editorial rule)

---

## suit Field Value Consistency Note

One potential inconsistency: the `suit` field for Major Arcana cards uses `"major-arcana"` (hyphenated string) while the collection folder is likely named `majors/` in the file system. When building taxonomy queries or collection filters, confirm whether the system queries by `suit` field value or by collection folder path.

Human review required: Confirm Astro content collection schema for `suit` field enum values.
