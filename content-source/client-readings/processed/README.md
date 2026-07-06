# Client readings — processed / archived source

## Purpose

Archive for readings whose source material has **already been imported** into the Astro content collection.

Moving files here signals:

- The reading has been converted to Markdown under `src/content/recent-client-readings/`
- The source should **not** be imported again (avoids duplicate imports)
- Editorial history is preserved without cluttering the active `docx/` queue

## What to put here

After a reading is published on the site, move from the active workflow:

- The original `.docx` from `../docx/`
- The original spread photograph(s) from `../images/` (e.g. `{slug}-1.jpg`, `{slug}-2.jpg`)
- Any other reading-specific source assets no longer needed in the active queue
- Optionally, copies of PDFs or import logs if your workflow keeps a full archive per slug

Organize by slug or date subfolders if the volume grows (e.g. `processed/2026/relationship-crossroads-one-question/`).

## What not to put here

- Work-in-progress readings not yet imported (keep in `../docx/`)
- Never-published confidential readings (belongs in `../private/`, not here, unless you are archiving a deliberate non-publish decision)

## Workflow

1. Confirm the Markdown entry exists and `publicationStatus` is set as intended in `src/content/recent-client-readings/`.
2. Move the source `.docx` (and related local assets) from `docx/` and `images/` into this folder.
3. Do not re-run import on files in `processed/` without an explicit editorial decision to re-import.

## Scale

This folder will grow with the library. Consistent slug-based naming and optional year/month subfolders keep thousands of archived readings manageable.
