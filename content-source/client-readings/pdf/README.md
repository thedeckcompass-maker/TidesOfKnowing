# Client readings — public PDFs

## Purpose

Store **downloadable public PDFs** for client readings.

These are professionally formatted exports intended for visitors who use the “Download Complete PDF” option on published reading pages. The site links to these files via frontmatter (e.g. `pdfDownload`) once a reading is live.

## What to put here

- Print-ready or web-ready PDF exports from the master Word document
- One PDF per reading, aligned with the same slug as the `.docx` (e.g. `relationship-crossroads-one-question.pdf`)

## What not to put here

- Word source files (belongs in `../docx/`)
- Draft or private material (belongs in `../private/`)
- Unpublished readings that are not yet cleared for the public site

## Workflow

1. Export the PDF from the master Word document after editorial sign-off.
2. Save the PDF here before or during site publication (same base slug as the `.docx`).
3. Ensure spread photographs, if any, are saved to `../images/` with the same slug prefix.
4. Reference the published URL/path in the Markdown entry when the download should be available.
5. After import is complete and the reading is published, move source-related files to `../processed/` as part of the archive step (PDF may remain here if it is still the live download asset — team convention: either keep the serving copy in `pdf/` or document the public path in `src/content/` only).

## Note

PDFs in this folder are meant for **public** distribution. Do not store confidential or never-to-be-published material here.
