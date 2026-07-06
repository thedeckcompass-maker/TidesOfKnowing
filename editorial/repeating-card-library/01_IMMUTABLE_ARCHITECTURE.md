# Immutable Architecture — Repeating Card Meanings Editorial Project

**Effective:** 2026-07-06  
**Status:** Permanent project constraint  
**Applies to:** All 78 cards in the Symbolic Reference Library (Repeating Card Meanings)

**Reinsertion governed by:** [`03_EDITORIAL_REINSERTION_CONTRACT.md`](03_EDITORIAL_REINSERTION_CONTRACT.md)

---

## Core principle

This is an **in-place editorial replacement only**.

The Repeating Card Meanings library architecture is **immutable** for the duration of this project. The site must remain byte-for-byte identical wherever structure, routing, or rendering are concerned.

**Editable areas (only):**

1. Body copy beneath existing headings
2. Frontmatter values explicitly declared in the per-card contract (`contracts/{suit}/{slug}.yaml`)

---

## What may change

| Editable | Condition |
|----------|-----------|
| Paragraph text under existing headings | Always |
| Blockquote text | Always |
| List item text | Always |
| Inline emphasis within prose | Always |
| Frontmatter values | Only fields listed in `allowed_frontmatter_edits` for that card |

---

## What must never change (without separate explicit approval)

| Category | Examples |
|----------|----------|
| Slugs and identifiers | `collection_id`, `url_slug`, file path, `card_number` |
| URLs and routing | `canonicalUrl`, entity URL, tool deep-link URL |
| Headings | H1 text, every H2 text, heading hierarchy, heading count |
| Section names and order | All section titles and their sequence |
| Anchors and IDs | Scoped anchor IDs, `panelDomId`, DOM ids |
| Frontmatter structure | Field names, key order, unapproved values |
| Schema | `repeatingCardMeaningsSchema`, Zod types, collection config |
| JSON-LD | Schema generation, structured data shape |
| Breadcrumbs | Labels, paths, hierarchy |
| Internal links | Related cards map, editorial cross-links |
| Navigation | Section nav, hub index, tool selector |
| Components and rendering | All RCM Astro components and lib files |
| CSS classes | All `rcm-*` classes and layout styles |
| Data model | TypeScript types, related-card map, taxonomy maps |
| Images | Image paths, filenames, alt-text generation logic |
| Structural markdown | `---` horizontal rules, list numbering, section count |

---

## Reinsertion gate

Before every reinsertion:

1. Per-card contract must exist at `contracts/{suit}/{slug}.yaml`
2. Run `scripts/validate-rcm-editorial-reinsertion.mjs --contract ...`
3. If **any** difference exists outside approved editable fields, **stop and report**. Do not reinsert.

---

## Files that must not be modified during this project

```
src/content/config.ts
src/content.config.ts
src/lib/repeatingCard*.ts
src/lib/rcmHeadingIds.ts
src/lib/tarotCardImage.ts
src/components/RepeatingCard*.astro
src/pages/repeating-card-meanings/**
src/pages/tools/repeating-card-meanings/**
src/data/repeating-card-related-map.ts
public/images/tarot/rws/**
```

The **only** production path that may receive editorial changes:

```
src/content/repeating-card-meanings/{suit}/{slug}.md
```

Within that file, only contract-approved edits as defined above.
