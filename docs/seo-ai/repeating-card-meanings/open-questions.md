# Repeating Card Meanings: Open Questions

Track unresolved SEO/AEO decisions here. Move items to **Resolved** when documented in implementation files.

## Resolved

### Q-R1: Trailing slash on canonical card URLs

**Status:** Resolved (2026-05-18)

**Question:** Should canonical card paths use a trailing slash?

- `/repeating-card-meanings/the-fool`
- `/repeating-card-meanings/the-fool/`

**Decision:** Use a **trailing slash** on all canonical card and hub paths.

**Rationale:**

- `astro.config.mjs` does not set `trailingSlash`; Astro defaults to `ignore`, but the codebase **generates** paths with trailing slashes (`src/lib/repeatingCardUrls.ts`, `src/pages/sitemap.xml.ts`, redirects in `astro.config.mjs`).
- Live card canonicals from `getRepeatingCardCanonicalUrl()` resolve to `/tools/repeating-card-meanings/{collection-id}/` (with slash).
- SEO/AEO target prefix remains `/repeating-card-meanings/{card-slug}/` (card slug only, no suit folder); trailing slash matches hub examples in `repeating-card-meanings-seo-and-ai-strategy.md`.

**Applied in:**

- `seo-aeo-output/card-metadata-map.yaml` (`canonicalUrl` and documented `conventions.trailingSlash`)
- `docs/seo-ai/repeating-card-meanings/metadata-and-frontmatter-standards.md`
- `seo-aeo-output/canonical-url-convention.md`

**Note:** Live route prefix (`/tools/...`) vs SEO target prefix (`/repeating-card-meanings/...`) is intentional until a route migration; both use trailing slashes.

## Open

_(none)_
