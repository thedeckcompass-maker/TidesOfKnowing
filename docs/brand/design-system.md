# Tides of Knowing design system (implementation)

**Source of truth for values:** `src/styles/tokens.css`  
**Surfaces and body modes:** `src/styles/surfaces.css` (classes `tok-body--reading`, `tok-body--system`, `surface-*`)  
**Global behaviour:** `src/styles/global.css`  
**Typography utilities:** `src/styles/typography.css`  
**Route-level body surface:** `src/layouts/BaseLayout.astro` (documented in that file)

Packaged brand reference: `docs/brand/tok-brand-system-v1.4.html` (read-only artefact; do not edit for site code).

---

## Surfaces

- **Reading (Surface A):** warm paper backgrounds, dark text. Default for long-form, articles, most marketing pages, `/compass/apply`.
- **System (Surface B):** deep blue containment for tools and COMPASS training routes. Body class `tok-body--system` on `/tools/*` and `/compass/*` except apply.

Rule: article main column stays on reading surfaces; blue appears as bands, panels, footer, or CTAs.

---

## Semantic colour aliases (same hex, different roles)

| Token | Same hex as | When to use |
|--------|-------------|-------------|
| `--tok-deep-ocean` | `--tok-surface-system` | Brand chrome: header strip, footer, logo, nav affordances tied to identity. |
| `--tok-surface-system` | `--tok-deep-ocean` | Page-level system mode background (`tok-body--system`). |
| `--tok-water` | `--tok-surface-panel-alt` | Editorial accents: article `h2`, blockquotes, headings in embeds. |
| `--tok-surface-panel-alt` | `--tok-water` | Layered panels on blue routes. |

Do not remove these pairs; the split is semantic, not a duplicate mistake.

---

## Canonical tokens (overview)

**Colours, spacing, layout, motion, shadows:** see `:root` in `tokens.css`.

**Radius:** `--radius-2`, `--radius-3`, `--radius-soft`, `--radius-control`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-promo`, `--radius-pill`.

**Z-index:** `--z-share-mobile`, `--z-header`, `--z-dropdown`, `--z-skip-link`.

**Breakpoints (px, for `@media`):** `--bp-xs` (520), `--bp-sm` (720), `--bp-md` (768), `--bp-blog-sticky` (960), `--bp-nav` (900), `--bp-nav-min` (901), `--bp-lg` (1024).

**Chrome:** `--tok-header-height`, `--site-header-height` (alias), `--tok-sticky-under-header`, `--tok-scroll-anchor-offset`.

**Typography scale:** `--tok-type-ui-button`, `--tok-type-ui-button-arrow`, `--tok-type-label`, `--tok-type-meta`, `--tok-type-ml-cta`, nav/footer sizes, `--tok-letter-upper*`, `--tok-line-body`, `--tok-line-prose`.

**Primitive buttons:** `--tok-ui-btn-pad-y`, `--tok-ui-btn-pad-x`, `--tok-ui-btn-font-weight`, `--tok-ui-btn-letter-spacing`, `--tok-ui-arrow-gap`, `--tok-ui-arrow-gap-hover`.

---

## Typography roles

| Role | Token / family |
|------|----------------|
| Headings | `--font-heading` (Playfair Display) |
| Body and UI | `--font-body` (Inter) |
| Accent / interpretive | `--font-accent` (Cormorant Garamond) |

Use `h1`-`h6` and `.tok-type-heading` / `.tok-type-body` / `.tok-type-accent` from `typography.css` where appropriate.

---

## Component primitives

Located in `src/components/ui/`:

- `Button.astro` (variants + white/blue surface)
- `CardWhite.astro`, `CardBlue.astro`
- `InputWhite.astro`, `InputBlue.astro`
- `SurfaceSection.astro`

These should use TOK tokens only (no ad-hoc hex). Third-party embeds (MailerLite) may use scoped overrides in `global.css` or component styles.

---

## What not to do

- Do not add colours outside `tokens.css`.
- Do not use removed legacy variables (`--paper`, `--ink`, `--gold`, etc.); they are no longer loaded.
- Do not put long article prose on full-page dark blue backgrounds.
- Do not introduce Tailwind for TOK styling; the stack is CSS variables + scoped Astro styles.

---

## Legacy removal

`src/styles/tokens-compat.css` was removed and is no longer imported. All site code uses `--tok-*` and `--font-*` tokens.

---

## AI + Intuition field guide (capture vs delivery)

- **Public acquisition:** `/ai-and-intuition-field-guide/` explains the edition and uses the MailerLite modal CTA only. It does not link to the PDF.
- **Post-signup delivery:** `/ai-and-intuition-field-guide/thank-you/` is `noindex` and is the URL to use in MailerLite delivery emails. It holds the download link to `/downloads/ai-and-intuition-series-field-guide.pdf` (when the file is published).
- **Articles:** The seven AI series articles keep linking to `/ai-and-intuition-field-guide/` for context, not to the thank-you page.
