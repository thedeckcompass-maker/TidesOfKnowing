# Tides of Knowing — Editorial Content Source

This directory holds **editorial source material** for Tides of Knowing. It is separate from published website content under `src/content/`.

## Principle

| Layer | Role |
|-------|------|
| **Word documents** (`.docx`) | Canonical master source — written and maintained in Microsoft Word |
| **Spread photographs** (images) | Original tarot spread photos — first-class assets tied to each reading |
| **Markdown** (`src/content/recent-client-readings/`) | Published website content — transformed from source at import time |
| **PDFs** | Downloadable visitor-facing versions — exported from Word, linked from the site when ready |

Nothing in this tree is served directly by the Astro build. The public site reads only from `src/content/` and optimised assets under `public/` (created at import time).

## Client readings

All client reading source material lives under:

```
content-source/client-readings/
├── docx/       ← original Word documents
├── pdf/        ← downloadable PDF exports
├── images/     ← original spread photographs
├── processed/  ← archived source after import
└── private/    ← never-publish material
```

See the README in each subfolder for its specific role.

## Intended publishing workflow

1. **Write** the reading in Microsoft Word.
2. **Save** the original `.docx` into:
   ```
   content-source/client-readings/docx/
   ```
3. **Export** a professionally formatted PDF into:
   ```
   content-source/client-readings/pdf/
   ```
4. **Photograph** the spread(s) and save original images into:
   ```
   content-source/client-readings/images/
   ```
   Use `{reading-slug}-1.jpg`, `{reading-slug}-2.jpg`, etc. (see `client-readings/images/README.md`).
5. **Import** — Cursor (or a future import script) transforms the source into a Markdown entry.
6. **Publish** — the Markdown entry is created in:
   ```
   src/content/recent-client-readings/
   ```
7. **Metadata** — at import time, extract and validate frontmatter including:
   - reading type
   - question
   - cards
   - suits
   - spread
   - life areas
   - archetypal themes
   - tags
   - reader notes
   - schema
   - related content
   - spread images (when present)
8. **Archive source** — once published, move the original source files into:
   ```
   content-source/client-readings/processed/
   ```
   This marks the reading as imported and prevents duplicate imports.

## Spread images (future import)

Spread photographs are **optional**. When images exist for a reading, future import will:

- Automatically locate files matching `{slug}-*.{jpg,jpeg,png,webp}` in `client-readings/images/`
- Use **image 1** as the featured/thumbnail and Open Graph image
- Display **additional images** on the reading page when `-2`, `-3`, etc. exist
- Include images in structured data (`associatedMedia` / `ImageObject`)
- Complete successfully when **no images** are present

Details: `client-readings/images/README.md`

## Scale

This layout is designed to hold **thousands of readings** over time. Use consistent file naming:

- `{slug}.docx` / `{slug}.pdf`
- `{slug}-1.jpg`, `{slug}-2.jpg`, …

…so imports can match written source, PDF, and photographs without manual reconciliation.

## What does not belong here

- Published Markdown (use `src/content/recent-client-readings/`)
- Build configuration, routes, or Astro collection definitions
- Readings that must never be published — use `client-readings/private/` instead of `docx/` when appropriate

## Status

**Preparation only.** Spread image discovery and web publishing are documented but not yet wired into import or the site build. This structure establishes the permanent editorial workflow for Tides of Knowing.
