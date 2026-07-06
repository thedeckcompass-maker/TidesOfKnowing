# Client readings — original spread photographs

## Purpose

Store **original photographs of each tarot spread** as first-class editorial assets.

These are the authentic spread layouts photographed at the time of the reading. They are separate from:

- The Word document (`../docx/`) — canonical written source
- The exported PDF (`../pdf/`) — downloadable formatted version
- Published site assets under `public/` — created at import time

Spread images support trust, transparency, and richer reading pages when a reading is published. They are optional: a reading without images imports normally.

## Naming convention

Use the **same base slug as the reading**, with a numeric sequence suffix.

```
{reading-base-slug}-{sequence}.{extension}
```

| Part | Rule |
|------|------|
| `reading-base-slug` | Matches the DOCX filename stem, normalised to lowercase hyphenated form (same slug used for the Markdown entry) |
| `sequence` | `1`, `2`, `3`, … in capture or editorial order |
| `extension` | `.jpg`, `.jpeg`, `.png`, or `.webp` |

### Examples

```
relationship-crossroads-one-question-1.jpg
relationship-crossroads-one-question-2.jpg
relationship-crossroads-one-question-3.jpg

career-transition-1.jpg
career-transition-2.jpg

shelly-wages-owed-reading-1.jpg
```

**Image 1** is the primary spread photograph. Use `1` for the main layout; additional numbers for clarifying spreads, follow-up pulls, or alternate angles.

## What to put here

- Original spread photographs (phone or camera captures)
- Multiple images per reading when the session included more than one layout
- High-resolution sources; import will optimise copies for the web later

## What not to put here

- Edited or watermarked marketing graphics (unless that is the canonical source)
- Images that identify a client when the reading is intended to be anonymised — redact or crop before storage, or keep in `../private/`
- Site-wide brand assets (use `public/` conventions)

## Editorial workflow

1. Complete and save the reading Word document to `../docx/`.
2. Export the PDF to `../pdf/` when ready.
3. Save spread photograph(s) here using the naming convention above.
4. On import, tooling will automatically discover matching images by slug prefix.
5. After publication, move source images to `../processed/` with the DOCX when archiving (see `../processed/README.md`).

## Future import behaviour (not yet implemented)

When import runs, it will:

| Step | Behaviour |
|------|-----------|
| **Discover** | Locate all files in this folder matching `{slug}-*.{jpg,jpeg,png,webp}` for the reading being imported |
| **Featured image** | Use `{slug}-1.*` as the featured/thumbnail image where appropriate |
| **Reading page** | Surface additional images (`-2`, `-3`, …) within the reading page when present |
| **Schema** | Include associated images in JSON-LD (`associatedMedia` / `ImageObject`) |
| **Open Graph** | Use the featured image for `og:image` when a spread photograph exists |
| **Missing images** | Continue import without error; PDF and text-only readings remain valid |

Published web paths will be derived at import time (e.g. under `public/images/client-readings/{slug}/`). This folder holds **originals only**.

## Scale

Designed for thousands of readings. Flat layout with slug-prefixed filenames keeps discovery fast without per-reading subfolders. If volume grows, optional subfolders `{slug}/01.jpg` may be supported later — until then, use the flat `{slug}-{n}` convention.

## Related

- Master workflow: `../../README.md`
- Word source: `../docx/README.md`
- PDF exports: `../pdf/README.md`
- Archive: `../processed/README.md`
