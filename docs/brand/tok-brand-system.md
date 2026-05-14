# TOK Brand System — implementation reference (v1.4)

Authoritative visual source: `tok-brand-system-v1.4.html` (copy of the packaged guide; do not edit that HTML for site code).

**Implementation map:** `docs/brand/design-system.md` (tokens, surfaces, primitives, and what not to do).

Code source of truth for values: `src/styles/tokens.css` (verbatim `:root` from the guide, extended with layout and typography tokens used across the site).

---

## 1. Core brand positioning

- **Tides of Knowing** is positioned as a serious, structured body of work on perception, interpretation, and disciplined intuition (tarot, oracle, Lenormand).
- Visual language balances **editorial credibility** (warm paper, readable type) with **system containment** (deep ocean blue for tools, navigation, and conversion).
- **Gold** signals authority and CTAs; **teal** bridges interactive affordances on both surfaces.

---

## 2. Dual-surface rule: “White reads. Blue contains.”

- **Surface A (reading):** long-form text, learning, articles, Field Notes, about body copy. Default background `--tok-surface-reading`. Body text `--tok-text-dark`.
- **Surface B (system):** tools, interactive flows, symbolic workspaces, primary CTAs, nav, footer. Background `--tok-surface-system` / panels `--tok-surface-panel`. Light text tokens.
- **Article bodies must never sit on dark blue.** Blue may appear on editorial routes only as **bands, panels, footers, or CTAs**, not as the main reading column.

Utility classes: `surface-reading`, `surface-reading-soft`, `surface-system`, `surface-panel`, `surface-panel-alt` in `src/styles/surfaces.css`.

---

## 3. Colour tokens

Defined in `tokens.css`. Groups:

- **Identity:** `--tok-deep-ocean`, `--tok-gold`, `--tok-gold-light`, `--tok-fire`
- **Surface A:** `--tok-surface-reading`, `--tok-surface-reading-soft`, `--tok-text-dark`, `--tok-text-muted`, `--tok-border-light`
- **Surface B:** `--tok-surface-system`, `--tok-surface-panel`, `--tok-surface-panel-alt`, `--tok-text-light`, `--tok-text-light-strong`, `--tok-text-light-soft`, `--tok-border-system`
- **Teal (links / continuity):** `--tok-teal`, `--tok-teal-light`, `--tok-teal-dim`
- **Elemental (semantic):** `--tok-water`, `--tok-air`, `--tok-earth`
- **Neutrals:** `--tok-slate`, `--tok-slate-mid`

Legacy compatibility variables (`--paper`, `--ink`, `--gold`, etc.) were removed from the build. Use `--tok-*` and `--font-*` only. See `docs/brand/design-system.md` for semantic alias pairs that share hex values by design (`--tok-deep-ocean` / `--tok-surface-system`, `--tok-water` / `--tok-surface-panel-alt`).

---

## 4. Typography tokens

- **`--font-heading`:** Playfair Display — page and section titles.
- **`--font-body`:** Inter — body, UI, navigation labels.
- **`--font-accent`:** Cormorant Garamond — italic / poetic / interpretive emphasis (e.g. subtitles, blockquotes).

Base rules and utilities: `src/styles/typography.css`.

---

## 5. Spacing, motion, shadow tokens

- **Spacing:** `--space-xs` through `--space-2xl`
- **Layout:** `--max-width`, `--reading-width`
- **Motion:** `--ease-out`, `--dur-fast`, `--dur-base`, `--dur-slow`
- **Shadows:** `--shadow-sm`, `--shadow-md`, `--shadow-sys-sm`, `--shadow-sys-md`, `--shadow-gold`

---

## 6. Page-by-page surface map (from guide)

| Area | Route pattern | Notes |
|------|----------------|-------|
| Home | `/` | Hybrid: blue hero, white/soft body, blue CTA band, blue footer |
| Articles index | `/articles/` | White primary; restrained blue hero band; blue footer |
| Article | `/articles/.../` | White primary; body never on dark blue |
| COMPASS | `/compass/` | Blue/system dominant; soft paper sections for long credibility copy |
| COMPASS apply | `/compass/apply/` | White primary (forms); blue accents only as needed |
| Tools | `/tools/.../` | Blue primary; white only for long help text |
| Footer | (global) | Blue (`--tok-deep-ocean`) |

---

## 7. Component rules

- **Buttons / inputs:** Reusable primitives in `src/components/ui/` (`Button`, `CardWhite`, `CardBlue`, `InputWhite`, `InputBlue`, `SurfaceSection`). Variants follow the guide: primary, secondary, ghost, arrow; white variants on Surface A, blue variants on Surface B.
- **No ad-hoc colours:** Use tokens only; no inline colour styles in new components.
- **Article audio:** Editorial panel on Surface A only; tokens only (`ArticleAudio.astro`).

---

## 8. Non-negotiables for future development

See `/.cursor/rules/tok-brand-rules.md`.

---

## 9. Transcript note (audio)

Future optional file: `public/audio/articles/[slug]/transcript.md`. No automatic public URL until a route exists; set `audio.transcript` in frontmatter when valid.
