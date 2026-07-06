# Client readings — Word source (`.docx`)

## Purpose

Store the **original Word documents** exactly as written.

These files are the **master editorial source** for anonymised client readings. Every published reading on the site should trace back to a document saved here (until it is moved to `processed/` after import).

## What to put here

- Final or near-final `.docx` files as authored in Microsoft Word
- One primary document per reading (use a stable slug in the filename, e.g. `relationship-crossroads-one-question.docx`)

## What not to put here

- Published Markdown (belongs in `src/content/recent-client-readings/`)
- Public PDFs (belongs in `../pdf/`)
- Readings that must **never** be published (belongs in `../private/`)

## Workflow

1. Complete the reading in Word.
2. Save the `.docx` here before export or import.
3. Save matching spread photograph(s) to `../images/` using `{slug}-1.jpg`, `{slug}-2.jpg`, etc.
4. After the reading is successfully published to the Astro content collection, move the `.docx` (and matching assets) to `../processed/`.

## Scale

Designed for a large library over time. Keep filenames consistent and unique so future import tooling can match `docx` → Markdown slug without manual reconciliation.
