# Canonical URL Convention: Repeating Card Meanings

## Trailing slash

**Use trailing slashes** on all canonical paths for this cluster.

| Example | Canonical |
|---------|-----------|
| Hub (SEO target) | `/repeating-card-meanings/` |
| Card (SEO target) | `/repeating-card-meanings/the-fool/` |
| Hub (live Astro) | `/tools/repeating-card-meanings/` |
| Card (live Astro) | `/tools/repeating-card-meanings/majors/the-fool/` |

Do **not** publish bare paths such as `/repeating-card-meanings/the-fool` in metadata maps, JSON-LD `@id`, sitemaps, or internal link targets.

## Astro configuration

`astro.config.mjs` does not set `trailingSlash`. Convention is enforced in URL helpers and sitemap generation, not via Astro `always` / `never`.

## SEO vs live paths

| Layer | Path pattern |
|-------|----------------|
| SEO/AEO canonical (target) | `/repeating-card-meanings/{card-slug}/` |
| Live site (current) | `/tools/repeating-card-meanings/{collection-id}/` |

`{card-slug}` is the filename segment only (e.g. `the-fool`, `ace-of-cups`). `{collection-id}` includes the suit folder (e.g. `majors/the-fool`).

## Source of truth

- Machine-readable map: `seo-aeo-output/card-metadata-map.yaml`
- Open question log: `docs/seo-ai/repeating-card-meanings/open-questions.md` (Q-R1 resolved)
- Frontmatter rules: `docs/seo-ai/repeating-card-meanings/metadata-and-frontmatter-standards.md`
