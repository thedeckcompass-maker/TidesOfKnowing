# Client readings — private (never publish)

## Purpose

Store readings and source material that **must never be published** on the public Tides of Knowing site.

Contents here are editorial or archival only. They must not be referenced by:

- `src/content/recent-client-readings/`
- Public PDF download links
- Sitemaps, navigation, or knowledge-graph relationships on the live site

## What to put here

- Client readings withheld for consent, legal, or editorial reasons
- Draft or sample material not cleared for anonymised publication
- Any `.docx`, PDF, or spread photographs that must stay off the website permanently

## What not to put here

- Readings intended for public release (use `../docx/` and the normal workflow)
- Already-published readings (use `../processed/` after import)

## Workflow

1. Save private source files here instead of `../docx/` when publication is ruled out.
2. Do not import from this folder into `src/content/recent-client-readings/` unless status changes and files are moved to the public workflow with explicit approval.
3. Keep access to this directory restricted at the repository or filesystem level if the repo is shared.

## Security

Treat this folder as **confidential editorial storage**. Never wire import scripts to ingest from `private/` by default.
