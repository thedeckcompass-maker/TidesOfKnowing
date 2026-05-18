# JSON-LD Example Library
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 5 — Schema

---

## Purpose

This document provides complete, implementation-ready JSON-LD examples for each schema type used in the Tides of Knowing repeating card meanings system. Each example uses The Fool as the reference card. The same patterns apply to all 78 cards — replace card-specific values as indicated.

**Confirmed values used throughout this document**:
- Site URL: `https://www.tidesofknowing.com`
- Author: Leigh Spencer (Person)
- Publisher: Tides of Knowing (Organization)
- Language: `en-NZ`
- Image path pattern: `/images/tarot/rws/{card-slug}.jpg`
- metaTitle separator: pipe `|`

**Preferred implementation**: Use the consolidated `@graph` pattern (Example 5). This is cleaner to maintain in Astro than managing separate script tags. Examples 1-3 show individual schema types for reference.

---

## Example 1 — Article Schema

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "The Fool Keeps Appearing in Tarot | Tides of Knowing",
  "name": "The Fool Repeating Meaning",
  "description": "The Fool repeating in tarot readings marks the pattern of standing at a genuine threshold without crossing it — returning to the beginning of the same cycle rather than committing to the departure that would make it real. The core tension is between the felt readiness to begin and the unexamined condition that keeps the seeker at the edge.",
  "url": "https://www.tidesofknowing.com/repeating-card-meanings/the-fool",
  "mainEntityOfPage": "https://www.tidesofknowing.com/repeating-card-meanings/the-fool",
  "image": "https://www.tidesofknowing.com/images/tarot/rws/the-fool.jpg",
  "datePublished": "2026-06-01",
  "dateModified": "2026-06-01",
  "inLanguage": "en-NZ",
  "author": {
    "@type": "Person",
    "name": "Leigh Spencer",
    "url": "https://www.tidesofknowing.com/about/"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Tides of Knowing",
    "url": "https://www.tidesofknowing.com/"
  }
}
</script>
```

**Field substitution guide**:
| Field | Value Source |
|-------|-------------|
| `headline` | `metadata.metaTitle` for the card |
| `name` | `frontmatter.title` |
| `description` | `frontmatter.summary` |
| `url` | Full URL: domain + `metadata.canonicalUrl` |
| `mainEntityOfPage` | Same as `url` |
| `image` | Full URL: domain + `metadata.openGraphImage` |
| `datePublished` | Set at publication — not yet in frontmatter |
| `dateModified` | Set on revision — not yet in frontmatter |

---

## Example 2 — BreadcrumbList Schema

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.tidesofknowing.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Repeating Card Meanings",
      "item": "https://www.tidesofknowing.com/tools/repeating-card-meanings/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "The Fool Repeating Meaning",
      "item": "https://www.tidesofknowing.com/repeating-card-meanings/the-fool"
    }
  ]
}
</script>
```

Note: Position 3 `item` uses the card's `canonicalUrl`. Confirmed: individual card URLs use `/repeating-card-meanings/{slug}/` (not `/tools/repeating-card-meanings/{slug}`).

**Field substitution guide**:
| Field | Value Source |
|-------|-------------|
| Position 3 `name` | `frontmatter.title` |
| Position 3 `item` | Full URL: domain + `metadata.canonicalUrl` |

Positions 1 and 2 are constant across all 78 card pages.

---

## Example 3 — FAQPage Schema (Full Example)

This example shows a complete FAQPage block for The Fool, using all question sources defined in `schema-field-map.yaml`. The answers are shortened for brevity in this reference document. In production, the full section text should be used.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Why does The Fool keep appearing in my tarot readings?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Fool keeps appearing when a seeker is standing at a genuine threshold but has not yet crossed it. The repeating pattern marks something that has been prepared for, circled around, or rehearsed — but not yet committed to. The energy is not stalled because the departure is impossible; it returns because the condition that keeps the seeker at the edge has not yet been named or met."
      }
    },
    {
      "@type": "Question",
      "name": "What does The Fool mean for love and relationships when it keeps appearing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Full text of the Love & Relationships section for The Fool — replace this placeholder with the actual section content from the card markdown file.]"
      }
    },
    {
      "@type": "Question",
      "name": "What does The Fool mean for career and purpose when it keeps appearing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Full text of the Career & Purpose section for The Fool — replace this placeholder with the actual section content from the card markdown file.]"
      }
    },
    {
      "@type": "Question",
      "name": "What does The Fool mean for money and stability when it keeps appearing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Full text of the Money & Stability section for The Fool — replace this placeholder with the actual section content from the card markdown file.]"
      }
    },
    {
      "@type": "Question",
      "name": "What does The Fool mean for spiritual growth when it keeps appearing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Full text of the Spiritual Growth section for The Fool — replace this placeholder with the actual section content from the card markdown file.]"
      }
    },
    {
      "@type": "Question",
      "name": "What does The Fool mean for emotional and mental patterns when it keeps appearing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Full text of the Emotional & Mental Patterns section for The Fool — replace this placeholder with the actual section content from the card markdown file.]"
      }
    },
    {
      "@type": "Question",
      "name": "What does The Fool mean for family and generational dynamics when it keeps appearing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Full text of the Family & Generational Dynamics section for The Fool — replace this placeholder with the actual section content from the card markdown file.]"
      }
    },
    {
      "@type": "Question",
      "name": "What does The Fool mean for health and energy when it keeps appearing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Full text of the Health & Energy section for The Fool — replace this placeholder with the actual section content from the card markdown file.]"
      }
    },
    {
      "@type": "Question",
      "name": "What does it mean when The Fool keeps appearing every week?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Full text of the When This Card Repeats Weekly section for The Fool — replace this placeholder with the actual section content from the card markdown file.]"
      }
    },
    {
      "@type": "Question",
      "name": "What does it mean when The Fool keeps appearing every month?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Full text of the When This Card Repeats Monthly section for The Fool — replace this placeholder with the actual section content from the card markdown file.]"
      }
    },
    {
      "@type": "Question",
      "name": "What does it mean when The Fool keeps appearing throughout a season?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Full text of the When This Card Repeats Seasonally section for The Fool — replace this placeholder with the actual section content from the card markdown file.]"
      }
    },
    {
      "@type": "Question",
      "name": "What does it mean when The Fool keeps appearing across a year or more?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Full text of the When This Card Repeats Across Years section for The Fool — replace this placeholder with the actual section content from the card markdown file.]"
      }
    }
  ]
}
</script>
```

---

## Example 4 — Separate Blocks (Alternative Only)

This pattern shows three separate `<script>` tags. Use only if the Astro layout already has a clean multi-block injection mechanism. The `@graph` pattern (Example 5) is preferred.

```html
<head>
  <!-- Article Schema -->
  <script type="application/ld+json">{ ... Article block ... }</script>

  <!-- BreadcrumbList Schema -->
  <script type="application/ld+json">{ ... BreadcrumbList block ... }</script>

  <!-- FAQPage Schema -->
  <script type="application/ld+json">{ ... FAQPage block ... }</script>
</head>
```

---

## Example 5 — Consolidated @graph Pattern (Preferred)

This is the preferred implementation for the Tides of Knowing Astro site. One `<script>` tag, all schema types in a single `@graph` array. Cleaner to maintain than multiple separate blocks.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "The Fool Keeps Appearing in Tarot | Tides of Knowing",
      "name": "The Fool Repeating Meaning",
      "description": "The Fool repeating in tarot readings marks the pattern of standing at a genuine threshold without crossing it...",
      "url": "https://www.tidesofknowing.com/repeating-card-meanings/the-fool",
      "mainEntityOfPage": "https://www.tidesofknowing.com/repeating-card-meanings/the-fool",
      "image": "https://www.tidesofknowing.com/images/tarot/rws/the-fool.jpg",
      "datePublished": "2026-06-01",
      "dateModified": "2026-06-01",
      "inLanguage": "en-NZ",
      "author": {
        "@type": "Person",
        "name": "Leigh Spencer",
        "url": "https://www.tidesofknowing.com/about/"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Tides of Knowing",
        "url": "https://www.tidesofknowing.com/"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.tidesofknowing.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Repeating Card Meanings",
          "item": "https://www.tidesofknowing.com/tools/repeating-card-meanings/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "The Fool Repeating Meaning",
          "item": "https://www.tidesofknowing.com/repeating-card-meanings/the-fool"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Why does The Fool keep appearing in my tarot readings?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Fool keeps appearing when a seeker is standing at a genuine threshold but has not yet crossed it..."
          }
        }
      ]
    }
  ]
}
</script>
```

Note: Position 3 `item` in BreadcrumbList uses the card's `canonicalUrl`. Confirmed: individual card URLs use `/repeating-card-meanings/{slug}/` (not `/tools/repeating-card-meanings/{slug}`).

---

## Implementation Checklist

Before deploying schema to production, confirm:

- [x] Site URL confirmed: `https://www.tidesofknowing.com`
- [x] Author attribution confirmed: Person (Leigh Spencer) / Organization (Tides of Knowing)
- [x] Image file format confirmed: `.jpg`
- [x] Image directory path confirmed: `/images/tarot/rws/`
- [x] Language confirmed: `en-NZ`
- [x] metaTitle separator confirmed: pipe `|`
- [x] @graph as preferred JSON-LD implementation confirmed
- [ ] `datePublished` field added to frontmatter for all 78 cards (add at launch)
- [ ] `dateModified` field handling workflow confirmed (manual update on revision)
- [x] Individual card canonical URL prefix confirmed: `/repeating-card-meanings/{slug}/`
- [ ] Schema validated using Google Rich Results Test before launch
- [ ] BreadcrumbList collection page (`/tools/repeating-card-meanings/`) is crawlable

---

## Schema Validation

Test all schema implementations using:
- Google Rich Results Test (search "rich results test" in Google)
- Schema.org validator (validator.schema.org)
- Run validation on at least 3 representative cards (major arcana, court card, numbered minor) before full deployment.
