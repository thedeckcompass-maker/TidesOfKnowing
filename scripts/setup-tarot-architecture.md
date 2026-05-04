# Tarot architecture setup (Tides of Knowing)

This note describes how the on-site tarot tools are wired so you can add cards, fix slugs, or introduce a new deck without guessing where things live.

## What you are setting up

Three pieces must stay aligned:

1. **Card records** — `src/data/tarotCards.js` exports `tarotCards`, an array of 78 objects (majors defined in `MAJORS`, minors generated in `buildMinorArcana()` from `RANKS`, `SUITS`, `RANK_LAYER`, and `SUIT_LAYER`).
2. **Card art** — static JPEGs under `public/images/tarot/rws/`, one file per card.
3. **Tool UI** — e.g. `src/pages/tools/tarot-combination-interpreter.astro` imports `tarotCards` and builds image URLs as `/images/tarot/rws/` + `slug` + `.jpg`.

If any of those disagree (wrong slug, missing file, typo in `name`), selects or thumbnails break.

## Slug and filename contract

- Each exported card has a **`slug`** used as the image basename.
- On disk the image must be: `public/images/tarot/rws/<slug>.jpg` (lowercase, hyphenated words, e.g. `the-fool.jpg`, `three-of-pentacles.jpg`).
- Minors follow the generator: `rank.toLowerCase()` + `-of-` + `suit.toLowerCase()` (e.g. `ace-of-cups.jpg`).

The combination interpreter constructs URLs exactly that way in client script; changing the path or extension requires updating both the data convention and the page script.

## Majors vs minors

- **Majors** — hand-authored objects in `MAJORS` inside `tarotCards.js` (full interpretive fields, `arcana: "Major Arcana"`, `suit` and `rank` typically `null`).
- **Minors** — produced by `buildMinorArcana()`; copy is composed from shared rank and suit layers. Editing a minor’s tone usually means adjusting `RANK_LAYER`, `SUIT_LAYER`, or the helper that assembles sentences—not only one card object.

## After you change data or assets

From the repository root:

```bash
npm install
npm run dev
```

Open `/tools/tarot-combination-interpreter/` and spot-check:

- Both dropdowns list all 78 names.
- Choosing two cards shows the expected images (no broken thumbnails).
- “Interpret combination” runs without console errors.

For production confidence, also run `npm run build`.

## Adding or replacing images only

1. Export or obtain RWS-style art licensed for site use.
2. Name each file `<slug>.jpg` matching the existing `slug` in `tarotCards.js`.
3. Drop files into `public/images/tarot/rws/` (replacing as needed).
4. Prefer reasonable dimensions and compression so the tool page stays fast on mobile.

Do not rename files without updating the matching `slug` in `tarotCards.js`.

## Adding a second deck (future work)

Today the codebase assumes **one** image directory (`rws`) and a single `tarotCards` export. A second deck would need:

- A parallel image folder (e.g. `public/images/tarot/other-deck/`).
- Either a second data module or a `deck` field on each card plus UI to choose deck.
- Updates wherever image URLs are built (search for `/images/tarot/rws/`).

There is no separate automation script for tarot assets; `scripts/add-article.mjs` is for **articles** only (`content-intake/articles` → `src/content/articles`).

## Quick reference

| Concern | Location |
|--------|----------|
| Card copy, keywords, slugs | `src/data/tarotCards.js` |
| RWS JPEGs | `public/images/tarot/rws/*.jpg` |
| Two-card tool page | `src/pages/tools/tarot-combination-interpreter.astro` |
| Tools hub links | `src/pages/tools/index.astro` |

Keeping the table above in mind is enough to “set up” or extend the tarot architecture without touching unrelated site code.
