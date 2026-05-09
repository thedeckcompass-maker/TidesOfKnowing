# Field Notes vs `/blog/` routes

**Public name:** Field Notes (navigation, headings, descriptions, and in-prose references).

**Technical routes (unchanged for compatibility):**

- Listing: `/blog/`
- Post: `/blog/<slug>/`
- Category: `/blog/category/<slug>/`

**Code:** Astro content collection id `blog`, markdown under `src/content/blog/`, layouts and components may still use `blog` in file or class names.

Schema.org on listing pages uses types `Blog` and `BlogPosting` where appropriate; the visible `name` fields use “Field Notes”, not the word “blog”.
