# Metadata and Frontmatter Standards

Canonical metadata rules for every repeating-card entry and related page. Standardises titles, descriptions, tags, excerpts, slugs, AI retrieval phrasing, and semantic consistency so all 78 cards and supporting pages present a unified surface to search and answer engines.

## Canonical URL paths

### Trailing slash (required)

All canonical paths for this cluster **end with `/`**. This matches live URL helpers (`src/lib/repeatingCardUrls.ts`), sitemap rows (`src/pages/sitemap.xml.ts`), and site redirects in `astro.config.mjs`.

| Correct | Incorrect |
|---------|-----------|
| `/repeating-card-meanings/the-fool/` | `/repeating-card-meanings/the-fool` |
| `/tools/repeating-card-meanings/majors/the-fool/` | `/tools/repeating-card-meanings/majors/the-fool` |

### SEO target vs live routes

| Purpose | Path pattern | Example |
|---------|--------------|---------|
| SEO/AEO canonical (target) | `/repeating-card-meanings/{card-slug}/` | `/repeating-card-meanings/the-hermit/` |
| Live Astro page (current) | `/tools/repeating-card-meanings/{collection-id}/` | `/tools/repeating-card-meanings/majors/the-hermit/` |

`{card-slug}` is the card filename only (no suit folder). `{collection-id}` is the content collection id (e.g. `majors/the-hermit`).

Use `seo-aeo-output/card-metadata-map.yaml` for per-card `canonicalUrl` and `liveUrl` values. See `open-questions.md` (Q-R1, resolved) and `seo-aeo-output/canonical-url-convention.md`.

## Frontmatter (collection)

Publish field definitions aligned with the `repeatingCardMeanings` content collection schema:

- `title`, `metaTitle`, `metaDescription`, `summary`, `ready`
- `slug` in body frontmatter (legacy); collection id drives live routing

## Title and description formulas

_To be expanded._

- Title pattern for card pages: see `getRepeatingCardMetaTitle()` in `src/lib/repeatingCardSeo.ts`
- Meta description max length: 160 characters (`trimMetaDescription`)

## Slug rules

- Collection id: `{suit}/{card-slug}` (e.g. `cups/ace-of-cups`)
- SEO canonical slug: `{card-slug}` only
- Majors keep leading article in slug where applicable (`the-fool`, not `fool`)

## Retrieval-friendly phrasing

_To be expanded with examples for AI and voice contexts._
