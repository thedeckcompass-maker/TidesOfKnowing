# Content intake (editorial inbox)

This tree is **not** wired to Astro content collections. Nothing here is built or deployed until you copy or run the publisher into production paths (`src/content/…`, `public/images/…`).

Use it as the **single place** to drop raw editorial work before it is publish-ready.

## Layout

| Path | Purpose |
|------|---------|
| `blog/` | Weekly (or ad hoc) blog drafts: `.md`, notes, exports. |
| `articles/` | Long-form / series article drafts and co-located hero images for `npm run publish-article`. |
| `images/` | Shared or in-progress assets (exports, alternates, batches) before they are named and placed for publish. |
| `processed/blog/` · `processed/articles/` | **Archive only** — move (or copy) material here **after** it has been published and verified, so the inbox stays clear. Add dated subfolders under these as you like. |

## Production targets (do not edit “live” copies in intake)

| Content type | Source after publish | Site location |
|--------------|----------------------|---------------|
| Blog posts | `src/content/blog/*.md` | Astro `blog` collection |
| Articles | `src/content/articles/*.md` | Astro `articles` collection |
| Blog images | `public/images/blog/<post-slug>/` | Referenced from markdown |
| Article images | `public/images/articles/<article-slug>/` | `heroImage` + body in frontmatter |

Schemas live in `src/content/config.ts` — match frontmatter there before copying into `src/content/`.

---

## Workflow

### a) Raw blog drafts

1. Add files under `content-intake/blog/` (any naming you like while drafting).
2. When ready to publish: create or update `src/content/blog/<slug>.md` with valid frontmatter (`title`, `description`, `date`, `tags`, optional `category`, etc.).
3. Put final images in `public/images/blog/<slug>/` and reference them from the markdown.
4. **After** the post is live and correct: move the draft folder/file from `blog/` into `processed/blog/` (e.g. `processed/blog/2026-04-12-my-post/`) so `blog/` stays a clean inbox.

There is **no** automated blog publisher yet; intake keeps drafts out of `src/content` until you deliberately promote them.

### b) Raw article drafts (series / long-form)

1. Save the markdown as `content-intake/articles/<slug>.md` (filename = article `slug` in frontmatter).
2. Optionally place images in the **same** folder, named `<slug>-something.jpg` (or `.jpeg`, `.png`, `.webp`). The publisher picks up `slug-*` files next to the `.md`.
3. Run:

   ```bash
   npm run publish-article
   ```

   This **copies** (does not move) the `.md` into `src/content/articles/` and images into `public/images/articles/<slug>/`.
4. Review in dev/build; fix frontmatter in `src/content/articles/<slug>.md` if needed.
5. **After** publication: archive the intake copies under `processed/articles/` (e.g. `processed/articles/<slug>/` or a dated bundle), then delete the originals from `articles/` if you only keep archive under `processed/`.

### c) Images

- **Article pipeline:** prefer `content-intake/articles/` co-located `slug-*` files for `publish-article`, or stage large sets under `content-intake/images/` until renamed.
- **Blog:** organise under `content-intake/images/` while editing, then copy finals into `public/images/blog/<slug>/` when publishing.
- **Do not** put intake paths in frontmatter — production URLs must stay under `/images/...` in `public/`.

### d) After publication (processed/)

`processed/` is not automated. Use it to:

- Preserve the exact files you shipped (for audit or re-edits).
- Free `blog/` and `articles/` for the next week’s drops.

Suggested pattern:

- `processed/blog/YYYY-MM-DD-<short-title>/`
- `processed/articles/<slug>/` (mirror of what you had in intake before delete)

---

## Weekly rhythm (suggested)

1. **Monday–Thursday:** drop drafts and assets into `blog/`, `articles/`, and/or `images/`.
2. **When a piece is ready:** promote to `src/content/…` + `public/images/…` (and run `publish-article` for articles).
3. **After go-live:** move intake leftovers to `processed/…`.

---

## Relationship to Astro

- `src/content/blog` and `src/content/articles` are the **only** markdown roots the site loads (`src/content.config.ts`).
- This folder is intentionally outside `src/` so git, backups, and editors can treat “inbox vs live” separately.
