# Tides of Knowing — Cleanup & Technical Debt Register

Last updated: 2026-05-17

This document tracks non-critical cleanup tasks, technical debt, architectural refinements, UX inconsistencies, and future optimisation opportunities across the Tides of Knowing ecosystem.

The purpose is not to aggressively optimise prematurely, but to:
- maintain architectural clarity
- reduce long-term complexity
- preserve editorial and technical consistency
- prevent recurring issues
- support future scaling

---

# Current Architecture Context

Current stack:
- Astro
- Cloudflare Pages / Workers
- SSR (`output: "server"`)
- Dynamic route handling via `Astro.params`
- Public-folder image delivery
- TOK design token system
- Shared ecosystem with The Deck Compass

Build status:
- `npm run build` currently succeeds cleanly
- No production-blocking warnings or errors
- Current Cloudflare warnings are informational

---

# Completed Cleanup

## 2026-05-17 — About Page Evolution
Status: Completed

Summary:
- Rebuilt About page into long-form editorial authority page
- Added semantic section architecture
- Added anchor navigation
- Improved entity clarity for AI/search
- Removed conversion-heavy/funnel-style presentation
- Added JSON-LD improvements
- Improved training authority positioning

Files:
- `src/pages/about.astro`
- `docs/copy/site/about-page-v2.md`

## 2026-05-17 — SSR Route Cleanup
Status: Completed

Summary:
- Removed seven legacy `getStaticPaths()` exports from SSR dynamic routes
- Eliminated Astro router warning noise under `output: "server"`
- Preserved all runtime behaviour using `Astro.params`
- Preserved pagination, filtering, metadata, canonical URLs, and content queries
- Confirmed clean SSR behaviour under Cloudflare adapter

Files updated:
- `src/pages/tags/[slug].astro`
- `src/pages/articles/page/[page].astro`
- `src/pages/series/[slug].astro`
- `src/pages/articles/filter/[series]/index.astro`
- `src/pages/articles/sort/series/page/[page].astro`
- `src/pages/articles/filter/[series]/page/[page].astro`
- `src/pages/articles/sort/oldest/page/[page].astro`

Result:
- All `[router] getStaticPaths() ignored` warnings removed
- Build remains successful
- SSR architecture now better aligned with runtime reality

Notes:
No routing model changes were introduced.
This was a cleanup and architectural consistency pass only.

## 2026-05-17 — Footer Hierarchy Cleanup
Status: Completed

Summary:
- Removed duplicate in-page copyright from the About page
- Refactored footer into utility/contact row and legal/entity meta row
- Grouped copyright and COMPASS attribution into one coherent footer block
- Reduced footer depth and visual weight
- Normalised email typography to lowercase
- Preserved footer navigation, accessibility, and responsive behaviour

Files updated:
- `src/layouts/BaseLayout.astro`
- `src/pages/about.astro`

Result:
- Footer is cleaner, shallower, and more editorial
- About page now ends without copyright duplication
- Build completed successfully

---

# Active Technical Debt / Future Cleanup

## Astro Image Pipeline Review
Priority: Low
Status: Deferred

Context:
Cloudflare adapter warns that sharp is unsupported at runtime.

Current state:
- Site uses standard `<img>` tags from `/public`
- No Astro image optimisation pipeline currently in use
- No runtime image failures observed

Future consideration:
If adopting:
- `<Image />`
- `<Picture />`
- Astro asset optimisation

Then assess:
- `imageService: "cloudflare"`
- `imageService: "compile"`

Do not change unless Astro image components are introduced.

---

## Cloudflare Session Infrastructure
Priority: Low
Status: Deferred

Context:
Cloudflare adapter logs informational SESSION KV messages.

Current state:
- No active Astro session usage
- No auth/session persistence requirements

Future consideration:
If platform evolves toward:
- user accounts
- saved readings
- dashboards
- gated training
- authenticated practice environments

Then:
- configure KV bindings
- document session architecture
- review auth strategy

---

# Editorial / UX Consistency Watchlist

## Em Dash Removal
Priority: Medium
Status: Ongoing

Goal:
Maintain no-em-dash editorial consistency across:
- articles
- field notes
- landing pages
- CTAs
- metadata

Preferred replacement:
- commas
- sentence breaks
- en dashes where appropriate

---

## TOK Editorial Tone Consistency
Priority: Ongoing

Watch for:
- overly abstract language
- excessive spiritual vagueness
- corporate SaaS phrasing
- conversion-heavy UX patterns
- overuse of cards/boxes/UI chrome
- generic AI-generated phrasing

Preferred qualities:
- grounded
- perceptive
- relational
- editorial
- intelligent
- restrained
- lived-in

---

# Future System Reviews

## Content Architecture Review
Potential future review areas:
- article taxonomy consistency
- field note clustering
- internal linking density
- semantic topic clustering
- author entity reinforcement
- canonical hierarchy

---

## Performance & Edge Review
Potential future review areas:
- Cloudflare edge caching
- route-level cache strategy
- image delivery optimisation
- hydration review
- JS payload reduction

---

## Accessibility Review
Potential future review areas:
- heading hierarchy audit
- keyboard navigation
- contrast consistency
- focus state consistency
- screen reader flow

---

# Notes

This document is intentionally cumulative.

Do not aggressively clear items unless:
- completed
- obsolete
- architecturally superseded

The goal is long-term clarity and steady refinement rather than endless optimisation.