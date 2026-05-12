# Ecosystem structured data (JSON-LD)

This site emits a shared Schema.org graph so search engines and other consumers can relate **Tides of Knowing**, **The Deck Compass**, **the COMPASS Method**, and **Leigh Spencer** as one ecosystem instead of unrelated pages.

## Roles

- **Tides of Knowing** — Editorial and methodology authority: long-form articles, conceptual foundations, and public methodology series.
- **The Deck Compass** — Live practice and reflection environment: cohort work, repetition, containment, and applied skill-building.
- **the COMPASS Method** — Shared interpretive framework published from Tides and practised within The Deck Compass; one creative work entity in schema.
- **Leigh Spencer** — Founder, creator, and author: single `Person` node referenced by organisations, the method, and authorship on articles and Field Notes where applicable.

## Stable `@id` values

These fragment URLs are the canonical identity of each entity. **They must stay identical** in the Deck Compass codebase (`ecosystem-structured-data` or equivalent) so both properties describe the same real-world things.

| Entity | `@id` |
|--------|--------|
| Leigh Spencer (Person) | `https://www.tidesofknowing.com/#leigh-spencer` |
| the COMPASS Method (CreativeWork) | `https://www.tidesofknowing.com/#the-compass-method` |
| Tides of Knowing (Organization) | `https://www.tidesofknowing.com/#organization` |
| Tides of Knowing (WebSite) | `https://www.tidesofknowing.com/#website` |
| The Deck Compass (Organization) | `https://www.thedeckcompass.com/#organization` |
| The Deck Compass (WebSite) | `https://www.thedeckcompass.com/#website` |

Implementation on this repo: `src/lib/ecosystem-structured-data.ts` (graph builder) and `src/layouts/BaseLayout.astro` (injects the graph on every page, then adds page-level JSON-LD). Article and Field Notes layouts use the same `ENTITY_IDS` for `author` / `publisher` `@id` alignment.

## Sync warning

When you add entities or change any `@id`, update **both** this repo and The Deck Compass repo in the same release window. Divergent IDs split the knowledge graph and weaken cross-site consistency.
