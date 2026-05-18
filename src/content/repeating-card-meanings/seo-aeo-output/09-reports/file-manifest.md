# File Manifest
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 9 — Reports

---

## Purpose

Complete inventory of all files in the SEO/AEO intelligence layer. Each entry records the file path, purpose, key contents, and the primary implementation touchpoint for that file.

---

## Stage 1 — Content Audit

### `01-audit/source-inventory.md`
**Purpose**: Complete inventory of all 78 card markdown source files
**Key contents**: File paths, card names, suit/arcana grouping, confirmation of completeness
**Implementation touchpoint**: Pre-implementation verification; confirm source file locations match this inventory before running batch operations

### `01-audit/frontmatter-field-map.md`
**Purpose**: Documents the current frontmatter field structure and identifies missing SEO fields
**Key contents**: 8 current fields (title, slug, arcana, suit, card_number, tier, status, summary); 15 missing fields needed for SEO/AEO layer; suit field consistency note
**Implementation touchpoint**: Phase 2 (Astro schema update); confirms which new fields to add and their types

### `01-audit/content-structure-audit.md`
**Purpose**: Section-by-section audit of the 78-card template structure
**Key contents**: Section ordering (42-section template), heading hierarchy issue, retrieval quality grades per section, semantic density assessment, recommendations priority table
**Implementation touchpoint**: Phase 4 (summary field rendering); AI retrieval strategy decisions

---

## Stage 2 — Taxonomy

### `02-taxonomy/controlled-vocabulary.md`
**Purpose**: Defines all valid terms across 10 controlled vocabulary fields
**Key contents**: 10 vocabularies with full term lists; COMPASS pillar definitions (7 canonical terms: center, open, map, perceive, align, sense, seal); governance rules for term usage
**Implementation touchpoint**: Taxonomy consistency reference; use when extending or auditing card-taxonomy-map.yaml

### `02-taxonomy/taxonomy-governance-rules.md`
**Purpose**: Rules for assigning taxonomy terms to cards
**Key contents**: COMPASS Method pillar mapping logic; assignment count rules per vocabulary; quality criteria for each field; consistency validation checklist
**Implementation touchpoint**: Reference when creating new card content or updating taxonomy assignments

### `02-taxonomy/card-taxonomy-map.yaml`
**Purpose**: Complete taxonomy assignments for all 78 cards across all 10 vocabularies
**Key contents**: Per-card YAML blocks with: themes, life_areas, seeker_states, compass_pillars, archetypal_states, relational_patterns, shadow_patterns, integration_paths, emotional_patterns, transitional_states
**Implementation touchpoint**: AI feature development (pattern matching, semantic search); pillar page content generation; future conversational retrieval features
**Note**: compass_pillars updated to canonical 7-term set (center, open, map, perceive, align, sense, seal) — no old placeholder terms remain

---

## Stage 3 — Related Cards

### `03-related-cards/relationship-logic.md`
**Purpose**: Defines the logic rules for related card assignments
**Key contents**: 6 relationship types (same-theme, progressive, shadow-pair, suit-companion, archetypal-mirror, resolving-pair); assignment rules (3-5 per card, minimum 2 types); suit progression arcs; Major Arcana thematic groupings
**Implementation touchpoint**: Reference when auditing or extending related-card-map.yaml; related cards component development (Phase 6)

### `03-related-cards/related-card-map.yaml`
**Purpose**: Related card assignments for all 78 cards
**Key contents**: 3-5 related cards per card, each with relationship_type; collection ID format (majors/the-fool, cups/ace-of-cups, etc.)
**Implementation touchpoint**: Phase 6 (related cards component); provides the direct card-to-card link targets for each page

### `03-related-cards/high-authority-clusters.md`
**Purpose**: Defines 11 topic clusters for internal linking architecture
**Key contents**: 11 clusters with card lists, pillar page candidates, dense core cards, cross-cluster hub table, cluster gap analysis
**Implementation touchpoint**: Phase 7 (pillar pages); internal linking decisions; pillar page content planning

---

## Stage 4 — Metadata

### `04-metadata/metadata-governance.md`
**Purpose**: Rules for generating and maintaining all 8 metadata fields
**Key contents**: Format rules for metaTitle (50-60 chars), metaDescription (150-160 chars), primaryKeyword, secondaryKeywords (3-5 phrases), featuredSnippetAnswer (40-70 words), answerEngineSummary (2-3 sentences), canonicalUrl, openGraphImage; field priority for AI retrieval; metadata lifecycle
**Implementation touchpoint**: Reference for updating metadata fields; keyword audit guidance

### `04-metadata/card-metadata-map.yaml`
**Purpose**: Complete metadata for all 78 cards (8 fields each)
**Key contents**: metaTitle, metaDescription, primaryKeyword, secondaryKeywords, featuredSnippetAnswer, answerEngineSummary, canonicalUrl, openGraphImage for all 78 cards
**Implementation touchpoint**: Phase 1 (frontmatter extension) — this is the data source for all new frontmatter values; Phase 3 (Article schema) — description and headline fields
**Note**: If image format is confirmed as .webp, update all 78 openGraphImage values before implementation

---

## Stage 5 — Schema

### `05-schema/schema-strategy.md`
**Purpose**: Defines the structured data strategy and schema type selection
**Key contents**: 4 schema types (Article, BreadcrumbList, FAQPage, DefinedTerm); implementation priority table; date field handling; author/publisher object definitions; FAQPage and Article co-existence guidance
**Implementation touchpoint**: Phase 3 (JSON-LD schema injection); key reference before building CardSchema.astro component

### `05-schema/schema-field-map.yaml`
**Purpose**: Maps each schema.org property to its source field in the card content
**Key contents**: Complete property-to-source mappings for Article, BreadcrumbList, and FAQPage; FAQ question patterns for all 12 question sources; variable reference (card_name, card_slug notation)
**Implementation touchpoint**: Phase 3 — use as the specification for building the schema components

### `05-schema/jsonld-example-library.md`
**Purpose**: Ready-to-use JSON-LD examples for all three schema types
**Key contents**: Complete Article example (The Fool), BreadcrumbList example, FAQPage full example (12 questions), combined @graph pattern for single-block environments, implementation checklist, validation guidance
**Implementation touchpoint**: Phase 3 — use as the reference for CardSchema.astro and CardFAQSchema.astro

---

## Stage 6 — Internal Linking

### `06-internal-linking/internal-linking-map.yaml`
**Purpose**: Per-card cluster membership, linking tier, and anchor text for all 78 cards
**Key contents**: cluster membership arrays, hub_status, linking_tier (1-4), anchor_text_suggestion, anchor_text_alt, pillar_page_candidates; summary counts (10 tier-1, 32 tier-2, 25 tier-3, 11 tier-4)
**Implementation touchpoint**: Phase 6 (related cards component); pillar page planning; anchor text for link rendering

### `06-internal-linking/topic-cluster-map.md`
**Purpose**: Linking strategy for each of the 11 topic clusters
**Key contents**: Per-cluster dense core cards, linking guidance, incoming cross-cluster link sources, pillar page URL proposals, hub card priority table, link quota guidelines, pillar page launch priority order
**Implementation touchpoint**: Phase 7 (pillar page development); link architecture decisions

### `06-internal-linking/future-content-opportunities.md`
**Purpose**: Content gap analysis and expansion opportunities
**Key contents**: 4 cluster gap territories (Spiritual Emergence, Body and Health, Collaboration and Community, Creative Blocks); per-card analysis of 11 tier-4 cards; search intent gaps; content expansion priority table
**Implementation touchpoint**: Post-launch content planning; cluster expansion decisions

---

## Stage 7 — AI Retrieval

### `07-ai-retrieval/ai-retrieval-audit.md`
**Purpose**: Section-by-section audit of AI retrieval readiness
**Key contents**: AI retrieval grades per section (Opening blockquote B+, Life areas A, Why Not Released A, etc.); risk identification; specific recommendations; top 5 improvement actions
**Implementation touchpoint**: Implementation priority decisions; identifies which sections need schema and which need content-level review

### `07-ai-retrieval/retrieval-guidelines.md`
**Purpose**: Operational guidelines for writing content that performs in AI retrieval
**Key contents**: 10 principles (query-first writing, first-sentence claim positioning, answer burial detection, entity language consistency, section length calibration, schema as signal layer, voice preservation); new content checklist; monitoring guidance
**Implementation touchpoint**: Reference for all future content creation and card content revisions

### `07-ai-retrieval/future-ai-features.md`
**Purpose**: Roadmap of AI-powered feature opportunities
**Key contents**: 6 feature descriptions (Pattern Identifier, Conversational Interpreter, Content Freshness Monitor, Personal Draw Tracker, AI Pillar Page Generation, Semantic Search); readiness ratings; data asset inventory
**Implementation touchpoint**: Product and engineering planning for AI feature development

---

## Stage 8 — Cursor Implementation

### `08-cursor-implementation/implementation-roadmap.md`
**Purpose**: Phased implementation sequence for deploying the SEO/AEO layer
**Key contents**: 7 implementation phases (frontmatter extension, schema update, JSON-LD injection, summary rendering, status update, related cards, pillar pages); pre-implementation checks; verification steps; launch readiness checklist
**Implementation touchpoint**: The primary implementation guide — start here before using cursor-prompts.md

### `08-cursor-implementation/cursor-prompts.md`
**Purpose**: Ready-to-use Cursor prompts for each implementation task
**Key contents**: 13 prompts covering: single-card frontmatter inspection, single-card frontmatter addition, batch frontmatter extension, Astro schema update, Article+Breadcrumb schema component, FAQPage component, section extraction helper, FAQ assembly, summary block rendering, status update, related cards frontmatter, RelatedCards component; 3 troubleshooting prompts
**Implementation touchpoint**: Use in Cursor during implementation phases 1-6; replace [PLACEHOLDER] values before running

---

## Stage 9 — Reports

### `09-reports/executive-summary.md`
**Purpose**: Overview of the complete SEO/AEO system and its highest-impact actions
**Key contents**: What was built; what the system does (for search engines, for AI systems, for internal linking); content quality assessment; future expansion guidance; governance note
**Implementation touchpoint**: Project stakeholder briefing; implementation prioritisation

### `09-reports/open-questions.md`
**Purpose**: Single reference point for all unresolved implementation decisions
**Key contents**: 24 open questions across 6 categories (site configuration, technical architecture, media assets, editorial decisions, cluster and pillar, governance); resolution tracking table
**Implementation touchpoint**: Pre-launch review checklist; assign owners and resolve before implementation begins

### `09-reports/file-manifest.md`
**Purpose**: This file — complete inventory of all 25 files with purposes and touchpoints
**Key contents**: All files, descriptions, key contents, implementation touchpoints
**Implementation touchpoint**: System orientation; use when navigating the full package

---

## File Count Summary

| Stage | Files | Approximate Size |
|-------|-------|-----------------|
| 01-audit | 3 | 26 KB |
| 02-taxonomy | 3 | 94 KB |
| 03-related-cards | 3 | 54 KB |
| 04-metadata | 2 | 122 KB |
| 05-schema | 3 | 28 KB |
| 06-internal-linking | 3 | 59 KB |
| 07-ai-retrieval | 3 | 34 KB |
| 08-cursor-implementation | 2 | 27 KB |
| 09-reports | 3 | ~25 KB |
| **Total** | **25** | **~469 KB** |

---

## File Dependency Map

The following files depend on (draw data from) other files:

```
card-metadata-map.yaml
  depends on: frontmatter-field-map.md (field structure)
              content-structure-audit.md (section quality)
              metadata-governance.md (format rules)

card-taxonomy-map.yaml
  depends on: controlled-vocabulary.md (valid terms)
              taxonomy-governance-rules.md (assignment rules)

related-card-map.yaml
  depends on: relationship-logic.md (relationship type definitions)
              card-taxonomy-map.yaml (theme and seeker_state overlap)

internal-linking-map.yaml
  depends on: high-authority-clusters.md (cluster definitions)
              related-card-map.yaml (relationship data)

schema-field-map.yaml
  depends on: frontmatter-field-map.md (source fields)
              metadata-governance.md (metadata field definitions)
              content-structure-audit.md (section names)

cursor-prompts.md
  depends on: implementation-roadmap.md (phase structure)
              card-metadata-map.yaml (data source)
              related-card-map.yaml (data source)
              schema-field-map.yaml (property mappings)

executive-summary.md
  depends on: all 22 preceding files (synthesises the full system)

open-questions.md
  depends on: all files containing "Human review required" markers
```
