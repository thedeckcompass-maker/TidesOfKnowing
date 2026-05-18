# Extraction Register: Workflow Notes

## Generating a new extraction

1. Identify the Field Note or series in `src/content/blog/`. Read the series index, every note, and any cheat sheet or companion component.
2. Copy `template.md` to `entries/<slug>.md` where `<slug>` matches `seriesSlug` or the primary post slug.
3. Fill metadata from frontmatter (`date`, `title`, tags). Use production URLs: `/blog/<slug>/` for standalone posts, `/blog/<seriesSlug>/` for series hubs, `/blog/<seriesSlug>/<fieldNoteSlug>/` for series notes.
4. Draft each section in one pass, then refine terminology against [the COMPASS Method article](/articles/compass-method/) and existing Field Note voice.
5. Update `index.md` with a new table row and link to the entry file.

## Suggested Cursor workflow

1. Open the target markdown under `src/content/blog/` and any related `.astro` companion (e.g. cheat sheet layouts).
2. Prompt: duplicate `docs/editorial/extraction-register/template.md`, complete an extraction for [title], align with COMPASS language, no em dashes, no unsupported claims.
3. Review the extraction for product sections and internal links.
4. Run a quick search for em dash characters (Unicode U+2014) in the new file before commit.

## Naming conventions

| Item | Convention | Example |
|------|------------|---------|
| Entry file | kebab-case, matches `seriesSlug` | `reading-the-grip.md` |
| Section headings | Match `template.md` exactly | `## Core Interpretive Problem` |
| COMPASS pillars | Title case in lists: Center, Open, Map, Perceive, Align, Sense, Seal | |
| Reader types | Seeker, Reader, Creator, Mixed (checkbox style in template) | |
| Status values | `Placeholder`, `Extracted`, `In review`, `Published asset` | |

## Markdown standards

- Use `-` for unordered lists; `|` tables only in `index.md`.
- Prefer commas, colons, or hyphenated compounds over em dashes.
- Link to on-site paths with leading slash (e.g. `/blog/reading-the-grip/`).
- Author default for Field Notes: Leigh Spencer unless frontmatter states otherwise.
- Do not duplicate full article body text; extract and synthesise.

## Future automation (optional evolution)

- **Frontmatter sync:** Script to pull `title`, `date`, `tags`, `seriesSlug`, and `description` from content collections into extraction metadata blocks.
- **Entity export:** Parse `## Key Terminology & Semantic Entities` into JSON for semantic search or internal RAG.
- **Index generation:** Regenerate the master table from entry file YAML frontmatter if structured fields are added later.
- **Link graph:** Cross-reference `## Internal Linking Opportunities` to build a topical map or recommendation weights for related Field Notes and tools.
- **Status dashboard:** Simple CI check that every published Field Note series with `cheatSheetAvailable: true` has a matching `entries/<slug>.md`.

Keep automation out of scope until at least five manual extractions prove the template.
