# Extraction Register

## Purpose

The Extraction Register transforms Tides of Knowing Field Notes into reusable intellectual property: semantic SEO infrastructure, COMPASS Method ecosystem knowledge, training and product seeds, and structured data for future tooling, recommendation systems, and AI retrieval.

This is not a content index. Each extraction captures interpretive problems, conceptual assets, reader pain points, monetisation pathways, and linking strategy in a consistent, version-controlled format.

## Extraction methodology

1. **Source fidelity:** Work from published Field Note content (series index, individual notes, and any companion assets such as cheat sheets). Do not invent claims not supported by the source material.
2. **One register entry per extractable unit:** Use a series-level extraction by default for multi-part Field Note series (as with Reading the Grip). Add note-level entries only when a single note is commercially or strategically significant on its own. Document the choice in entry metadata.
3. **COMPASS alignment:** Map insights to the seven conditions of attention (Center, Open, Map, Perceive, Align, Sense, Seal) only where the source genuinely supports the link.
4. **Product lens:** Every extraction includes training and product potential sections so editorial work connects to The Deck Compass, downloads, tools, and future cohort design.
5. **Priority signals:** Record **Commercial Priority** (monetisation potential) and **Audience Signal Strength** (observed audience response) in metadata and the index table.
6. **Semantic layer:** Terminology and entity lists support topical authority, internal linking, and future automated clustering.

## How to update this register

1. Duplicate `template.md` into `entries/` using kebab-case slug matching the Field Note `seriesSlug` or primary slug (e.g. `reading-the-grip.md`).
2. Complete all sections from published content. Link to canonical URLs on tidesofknowing.com.
3. Add or update a row in the table below.
4. Set **Status** to `Extracted` when the entry file is complete, `In review` when editorial has not signed off, or `Published asset` when a derived product (PDF, tool, training) ships.
5. Keep placeholder examples clearly marked until real extractions replace them.

## Entry index

| Field Note | Core Theme | COMPASS Pillars | Reader Type | Commercial Priority | Audience Signal Strength | Monetisation Potential | Related Assets | Status |
|------------|------------|-----------------|-------------|---------------------|--------------------------|------------------------|----------------|--------|
| [the COMPASS Method (article)](/articles/compass-method/) | Seven conditions of attention for reliable intuitive reading | Center, Open, Map, Perceive, Align, Sense, Seal (full framework) | Creator | Flagship | Defining | High: anchor for Deck Compass, cohort curriculum, certification language | `/compass/`, methodology article series | Placeholder |
| [Repeating Card Meanings](/tools/repeating-card-meanings/) | Pattern recognition when the same card recurs for a Seeker | Map, Perceive, Sense | Mixed (Seeker + Creator) | Medium | Strong | Medium: tool expansion, premium interpretations, email series | RCM SEO cluster in `docs/seo-ai/` | Placeholder |
| [Reading the Grip](/blog/reading-the-grip/) | High-stakes readings when a Seeker grips a specific outcome | Center, Open, Map, Perceive, Align, Sense | Creator | High | Emerging | High: existing Field Guide PDF, workshop, supervision theme | [Entry](./entries/reading-the-grip.md), [Field Guide](/blog/reading-the-grip/cheat-sheet/) | Extracted |

## File locations

| Asset | Path |
|-------|------|
| Master index | `docs/editorial/extraction-register/index.md` |
| Duplication template | `docs/editorial/extraction-register/template.md` |
| Completed extractions | `docs/editorial/extraction-register/entries/*.md` |
| Workflow notes | `docs/editorial/extraction-register/workflow-notes.md` |
