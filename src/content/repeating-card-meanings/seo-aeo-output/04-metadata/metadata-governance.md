# Metadata Governance
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 4 — Metadata

---

## Purpose

This document defines the rules for generating, maintaining, and extending the SEO and AEO metadata fields for all 78 repeating card meaning pages. All fields defined here are documented in `card-metadata-map.yaml`.

---

## Metadata Fields

### metaTitle

**Format**: `{Card Name} Keeps Appearing in Tarot | Tides of Knowing`
**Character limit**: 50-60 characters (Google's displayed title cutoff)
**Rules**:
- Always include the card name first
- Use "Keeps Appearing in Tarot" as the action phrase — this matches the dominant seeker search intent
- Append brand name with a pipe separator
- Do not use "Repeating Meaning" in the metaTitle — reserve that phrasing for H1 and internal use
- Do not use "What It Means When" — too long for the character limit

**Examples**:
- `The Fool Keeps Appearing in Tarot | Tides of Knowing`
- `Five of Cups Keeps Appearing in Tarot | Tides of Knowing`

---

### metaDescription

**Format**: Direct answer to the implied search question, followed by value proposition
**Character limit**: 150-160 characters
**Rules**:
- Open with the seeker-facing question pattern: "When the [Card Name] keeps appearing..."
- Include the card's primary pattern in one phrase
- Close with a call to understanding (not a call to action)
- Do not repeat the metaTitle verbatim
- Do not use generic tarot descriptions — must be specific to this card's repeating pattern

**Example**:
`When the Five of Cups keeps appearing, it marks unresolved grief or loss that has become a persistent frame. Discover what this pattern is asking from you.`

---

### primaryKeyword

**Format**: Lowercase phrase, no quotes
**Rules**:
- One phrase only
- Reflects the most common natural language search for this card's repeating pattern
- Pattern: `[card name] keeps appearing in tarot` or `[card name] repeating tarot meaning`
- For cards with common search variants, use the dominant form
- Do not use "upright" or "reversed" — this system does not address positional meanings

---

### secondaryKeywords

**Format**: YAML array of 3-5 lowercase phrases
**Rules**:
- Include at least one life-area variant: `[card name] keeps coming up career` or similar
- Include at least one temporal variant: `[card name] appearing every week` or similar
- Include the psychological pattern variant: `[card name] pattern in tarot`
- Include the seeker-question variant: `why does [card name] keep showing up`
- Avoid keyword cannibalisation across secondaryKeywords (each phrase should have distinct search intent)

---

### featuredSnippetAnswer

**Format**: 40-70 word direct answer, third-person or impersonal, factual tone
**Rules**:
- Written to be extracted by AI systems as a direct answer to "what does it mean when [card] keeps appearing"
- Must begin with the card name or "The [Card Name]"
- Describes the core repeating pattern in plain, direct language
- Does not use metaphor or poetic language
- Does not begin with "I" or "You"
- Does not reference the site or brand
- Ends with a complete sentence (not a fragment)

---

### answerEngineSummary

**Format**: 2-3 sentences, slightly more expansive than featuredSnippetAnswer
**Rules**:
- May reference the seeker explicitly ("a seeker who sees this card repeatedly")
- Includes the core pattern, the shadow expression territory, and the integration direction
- Used as the AI overview response candidate — must be self-contained and answer-complete
- Do not use the word "journey" (too generic in tarot contexts)
- Do not use the word "explore" as a verb directed at the seeker (too generic)

---

### canonicalUrl

**Format**: `/repeating-card-meanings/{card-slug}/`
**Rules**:
- Uses the card filename slug (not the collection id with suit folder)
- No domain prefix in frontmatter (domain is set in site config)
- **Trailing slash required** (matches Astro URL helpers and sitemap convention)
- Lowercase only
- Full URL example: `https://www.tidesofknowing.com/repeating-card-meanings/the-fool/`

---

### openGraphImage

**Format**: `/images/tarot/rws/{card-slug}.jpg`
**Rules**:
- Uses the same slug pattern as canonicalUrl
- Confirmed `.jpg` format
- Confirmed image directory: `public/images/tarot/rws/`
- Full URL pattern: `https://www.tidesofknowing.com/images/tarot/rws/{card-slug}.jpg`
- Note: Wheel of Fortune uses `the-wheel-of-fortune.jpg`
- Note: Existing card images are card art assets. Dedicated 1200x630px OG images should be created for social sharing if needed. Existing card images serve as an interim fallback.

---

## Field Priority for AI Retrieval

| Field | AI Retrieval Function | Priority |
|-------|----------------------|---------|
| `featuredSnippetAnswer` | Direct answer extraction | Highest |
| `answerEngineSummary` | AI overview / summary extraction | High |
| `metaDescription` | Search result snippet | High |
| `metaTitle` | Result title | Medium |
| `primaryKeyword` | Query matching | Medium |
| `secondaryKeywords` | Long-tail query matching | Medium |

---

## Metadata Lifecycle

1. All 78 cards receive metadata at Stage 4
2. Metadata is generated from card content (summary, opening blockquote, Core Repeating Message)
3. Metadata is reviewed by a human editor before production deployment
4. `featuredSnippetAnswer` fields should be revisited when card content is significantly updated
5. `primaryKeyword` and `secondaryKeywords` should be audited against actual search data after 6 months of live performance

Confirmed: metaTitle uses the pipe character `|` as brand separator. All 78 metaTitle values in `card-metadata-map.yaml` have been updated accordingly.
