# Cursor Implementation Prompts
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 8 — Cursor Implementation

---

## Purpose

This document provides ready-to-use Cursor prompts for each implementation task in `implementation-roadmap.md`. Each prompt is designed to be pasted directly into Cursor's AI input. Prompts include all necessary context so the AI understands the task without prior conversation history.

**Before using any prompt**: Complete the Pre-Implementation Checks in `implementation-roadmap.md`. Confirm Astro version before Phase 1.

**Confirmed values** (pre-filled in all prompts below):
- Site URL: `https://www.tidesofknowing.com`
- Content path: `src/content/repeating-card-meanings/`
- Individual card URL pattern: `/repeating-card-meanings/{slug}/`
- Astro route for card pages: `src/pages/repeating-card-meanings/[...slug].astro`
- Image path pattern: `/images/tarot/rws/{card-slug}.jpg`
- Language: `en-NZ`
- Author: Person — Leigh Spencer
- Publisher: Organization — Tides of Knowing
- JSON-LD: @graph consolidated pattern

---

## Phase 1 — Frontmatter Extension

### Prompt 1A — Inspect a Single Card File

Use this prompt to confirm the current frontmatter structure before running batch updates.

```
I have a tarot card markdown file at [PATH TO CARD FILE]. Please read the file and report:
1. What frontmatter fields are currently present
2. The exact values for: title, slug, arcana, suit, card_number, tier, status, summary
3. Whether any of these fields are missing or have unexpected values

Do not modify the file. Report only.
```

---

### Prompt 1B — Add Frontmatter Fields to a Single Card

Use this prompt to add SEO/AEO fields to one card file. Run on a test card first before batch application.

```
I need to add SEO and AEO metadata fields to a tarot card markdown file.

File path: [PATH TO CARD FILE]
Card collection ID: [e.g., majors/the-fool]

The fields and values to add are drawn from the card-metadata-map.yaml file at:
B:\repeating-cards-working-file\seo-aeo-output\04-metadata\card-metadata-map.yaml

Look up the card using its collection ID as the YAML key. Add the following fields to the
frontmatter of the card file, immediately after the existing `summary` field:

  metaTitle: [value from card-metadata-map.yaml]
  metaDescription: [value from card-metadata-map.yaml]
  primaryKeyword: [value from card-metadata-map.yaml]
  secondaryKeywords:
    - [values from card-metadata-map.yaml]
  featuredSnippetAnswer: [value from card-metadata-map.yaml]
  answerEngineSummary: [value from card-metadata-map.yaml]
  canonicalUrl: [value from card-metadata-map.yaml]
  openGraphImage: [value from card-metadata-map.yaml]

Rules:
- Do not alter any existing frontmatter fields
- Do not alter any body content
- Preserve exact YAML formatting
- Preserve exact string values — do not paraphrase or shorten
- Multi-line string values (featuredSnippetAnswer, answerEngineSummary) should use
  YAML block scalar format (|) if they contain internal line breaks, otherwise use
  double-quoted strings

After making the changes, show me the updated frontmatter block only.
```

---

### Prompt 1C — Batch Frontmatter Extension

Use this prompt to extend frontmatter across all 78 card files. Only run after Prompt 1B has been verified on a test card.

```
I need to add SEO/AEO metadata fields to all 78 tarot card markdown files in this Astro project.

The metadata values for each card are stored in:
B:\repeating-cards-working-file\seo-aeo-output\04-metadata\card-metadata-map.yaml

The YAML key for each card is its collection ID in the format: majors/the-fool, cups/five-of-cups, etc.

The 78 card markdown files are located at: src/content/repeating-card-meanings/
Suit subfolders: majors/, cups/, swords/, wands/, pentacles/

Note: Major Arcana cards have suit: "n/a" in their frontmatter. Their collection IDs use the majors/ prefix.

For each card file:
1. Identify the card's collection ID from its existing frontmatter (slug field or filename)
2. Look up the card's values in card-metadata-map.yaml
3. Add the following fields to the frontmatter, after the existing `summary` field:
   metaTitle, metaDescription, primaryKeyword, secondaryKeywords, featuredSnippetAnswer,
   answerEngineSummary, canonicalUrl, openGraphImage

Rules:
- Do not alter any existing frontmatter fields
- Do not alter any body content
- Preserve exact string values from the YAML source
- If a card's collection ID cannot be matched in card-metadata-map.yaml, report it and skip
- Report a summary of: cards updated / cards skipped / any errors

Process the cards in this order: Major Arcana first (22 cards), then Cups (14), Swords (14),
Wands (14), Pentacles (14).
```

---

## Phase 2 — Astro Schema Update

### Prompt 2A — Update Content Collection Schema

```
I need to update the Astro content collection schema to accept new SEO/AEO frontmatter fields.

The content collection config file is at: [PATH — e.g., src/content/config.ts]

Please read the file and add the following optional fields to the card content collection schema:

  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  primaryKeyword: z.string().optional(),
  secondaryKeywords: z.array(z.string()).optional(),
  featuredSnippetAnswer: z.string().optional(),
  answerEngineSummary: z.string().optional(),
  canonicalUrl: z.string().optional(),
  openGraphImage: z.string().optional(),
  datePublished: z.string().optional(),
  dateModified: z.string().optional(),

Add these fields after the existing `summary` field in the schema definition.
Do not alter any existing fields.
Show me the updated schema block after making the changes.
```

---

## Phase 3 — JSON-LD Schema Injection

### Prompt 3A — Create CardSchema Astro Component (@graph — preferred)

```
I need to create an Astro component that renders JSON-LD structured data for tarot card pages
using the consolidated @graph pattern (one script tag, all schema types).

Create a new file at: src/components/CardSchema.astro

The component should accept the following props (sourced from a card's frontmatter):
- title: string (frontmatter.title — H1 title)
- metaTitle: string (frontmatter.metaTitle)
- summary: string (frontmatter.summary — used as Article description)
- canonicalUrl: string (frontmatter.canonicalUrl)
- openGraphImage: string (frontmatter.openGraphImage)
- datePublished: string (frontmatter.datePublished, optional)
- dateModified: string (frontmatter.dateModified, optional)
- faqItems: Array of { question: string; answer: string } (from FAQ extraction)

Site URL: https://www.tidesofknowing.com

The component should render a single JSON-LD script block using @graph:

{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": [metaTitle prop],
      "name": [title prop],
      "description": [summary prop],
      "url": "https://www.tidesofknowing.com" + canonicalUrl,
      "mainEntityOfPage": "https://www.tidesofknowing.com" + canonicalUrl,
      "image": "https://www.tidesofknowing.com" + openGraphImage,
      "datePublished": [datePublished prop, if present],
      "dateModified": [dateModified prop, if present],
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
        { "@type": "ListItem", "position": 1, "name": "Home",
          "item": "https://www.tidesofknowing.com" },
        { "@type": "ListItem", "position": 2, "name": "Repeating Card Meanings",
          "item": "https://www.tidesofknowing.com/tools/repeating-card-meanings/" },
        { "@type": "ListItem", "position": 3, "name": [title prop],
          "item": "https://www.tidesofknowing.com" + canonicalUrl }
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": faqItems.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": { "@type": "Answer", "text": item.answer }
      }))
    }
  ]
}

Use Astro's set:html or Fragment to render the JSON-LD safely.
Omit fields with undefined or empty values rather than rendering null or "undefined" strings.
Only include the FAQPage node if faqItems has at least one entry.
```

---

### Prompt 3B — Create FAQPage Schema Component

```
I need to create an Astro component that renders FAQPage JSON-LD for tarot card pages.

Create a new file at: src/components/CardFAQSchema.astro

The FAQ question-answer pairs come from specific sections of the card's markdown body content.

The component should accept an array of question-answer pairs:
type FAQItem = { question: string; answer: string }
Props: faqItems: FAQItem[]

It should render:
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqItems.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer
    }
  }))
}

The question-answer pairs for each card are generated by the card page using the section
extraction pattern described in the card's parent component. Confirm the section extraction
approach separately — this component only needs to receive and render the pairs.
```

---

### Prompt 3C — Section Content Extraction Helper

```
I need a helper function that extracts the text content of specific markdown sections
from a rendered card page.

The card pages are markdown files with sections identified by H2 headings (## heading text).

Write a TypeScript utility function:

extractSection(markdownContent: string, headingText: string): string | null

The function should:
1. Accept the full markdown string of a card file
2. Find the section with the specified H2 heading (exact match or case-insensitive match)
3. Return all content between that heading and the next heading of equal or higher level
4. Strip markdown formatting from the returned text (convert to plain text)
5. Return null if the heading is not found

This function will be used to extract life area sections, temporal sections, and the
"Why This Energy Has Not Released Yet" section for FAQPage schema generation.

Target sections (exact heading text from card files):
- "Love & Relationships"
- "Career & Purpose"
- "Money & Stability"
- "Spiritual Growth"
- "Emotional & Mental Patterns"
- "Family & Generational Dynamics"
- "Health & Energy"
- "When This Card Repeats Weekly"
- "When This Card Repeats Monthly"
- "When This Card Repeats Seasonally"
- "When This Card Repeats Across Years"
- "Why This Energy Has Not Released Yet"

Note: The card markdown files use H2 (##) for these section headings.
```

---

### Prompt 3D — Assemble FAQ Items in Card Page

```
In the card page template (at: src/pages/tools/repeating-card-meanings.astro or the
relevant card rendering template), I need to build the FAQ item array for the
CardSchema component.

The card's raw markdown content is available as entry.body (confirm the exact Astro
API for raw markdown access in this project — it may be entry.body, rawContent(), or
accessed via the content collection render function).

Using the extractSection utility, build an array of FAQItem objects with these natural
seeker-language questions:
(Replace {cardName} with the actual card name from entry.data.title)

Why FAQ (highest priority — put this first):
- Q: "Why does {cardName} keep appearing in my tarot readings?"
  A: extractSection(content, "Why This Energy Has Not Released Yet")

Life area FAQs:
- Q: "What does {cardName} mean when it keeps showing up in love readings?"
  A: extractSection(content, "Love & Relationships")

- Q: "What does {cardName} mean when it keeps appearing around work or purpose?"
  A: extractSection(content, "Career & Purpose")

- Q: "What does {cardName} mean when it keeps appearing around money or stability?"
  A: extractSection(content, "Money & Stability")

- Q: "What does {cardName} mean when it keeps appearing in spiritual readings?"
  A: extractSection(content, "Spiritual Growth")

- Q: "What does {cardName} mean when it keeps appearing around emotional patterns?"
  A: extractSection(content, "Emotional & Mental Patterns")

- Q: "What does {cardName} mean when it keeps appearing around family or generational themes?"
  A: extractSection(content, "Family & Generational Dynamics")

- Q: "What does {cardName} mean when it keeps appearing around health and energy?"
  A: extractSection(content, "Health & Energy")

Temporal FAQs:
- Q: "What does it mean when {cardName} repeats every week?"
  A: extractSection(content, "When This Card Repeats Weekly")

- Q: "Why might {cardName} keep appearing over weeks or months?"
  A: extractSection(content, "When This Card Repeats Monthly")

- Q: "What lesson is {cardName} asking me to integrate?"
  A: extractSection(content, "When This Card Repeats Seasonally")

- Q: "What does it mean when {cardName} keeps appearing across a year or more?"
  A: extractSection(content, "When This Card Repeats Across Years")

Filter out any FAQ items where the answer is null (section not found).
Pass the resulting array as the faqItems prop to the <CardSchema> component.
```

---

## Phase 4 — Summary Field Rendering

### Prompt 4A — Add Core Pattern Block to Card Template

```
In the card page template (at: src/pages/tools/repeating-card-meanings.astro or the
relevant card rendering template), I need to add a visible "Core Pattern" section that
renders the frontmatter `summary` field.

Add a styled block immediately after the H1 heading and before the opening blockquote.

The block should:
- Display the text from entry.data.summary
- Use a visually distinct style: consider a light background, subtle border, or indented style
  that clearly distinguishes it from the main body content
- Be labelled "Core Pattern"
- Not interfere with existing page layout

The purpose of this block is to make the card's summary text visible in rendered HTML
so that search engines and AI systems can extract it as page content. Currently the summary
is only in frontmatter and is not visible on the page.

Show me the updated template section after adding the block.
```

---

## Phase 5 — Status Field Update

### Prompt 5A — Update Status on Launch

```
I need to update the `status` frontmatter field from "draft" to "published" in all 78
tarot card markdown files.

The files are located at: src/content/repeating-card-meanings/
(Suit subfolders: majors/, cups/, swords/, wands/, pentacles/)

Before making any changes:
1. Confirm that all 78 files currently have status: "draft"
2. Report any files that have a different status value

After confirming:
3. Update status: "draft" to status: "published" in all files
4. Do not alter any other fields
5. Report the count of files updated
```

---

## Phase 6 — Related Cards Component

### Prompt 6A — Add Related Card IDs to Frontmatter

```
I need to add a `related_cards` array to the frontmatter of each tarot card markdown file.

The related card IDs for each card are stored in:
B:\repeating-cards-working-file\seo-aeo-output\03-related-cards\related-card-map.yaml

The YAML key for each card is its collection ID (e.g., majors/the-fool).
The related cards are listed under the `related` key, each with a `card` field.

The card markdown files are at: src/content/repeating-card-meanings/
(Suit subfolders: majors/, cups/, swords/, wands/, pentacles/)

For each of the 78 card markdown files:
1. Look up the card in related-card-map.yaml using its collection ID
2. Extract the `card` values from the `related` array (these are the related card IDs)
3. Add a `related_cards` field to the frontmatter with the array of related card IDs

Example output for The Fool:
related_cards:
  - majors/the-world
  - majors/the-magician
  - wands/ace-of-wands
  - cups/ace-of-cups
  - cups/eight-of-cups

Do not alter any existing frontmatter fields.
```

---

### Prompt 6B — Create RelatedCards Component

```
I need to create an Astro component that renders a list of related card links.

Create a new file at: src/components/RelatedCards.astro

The component accepts:
- relatedCardIds: string[] (e.g., ["majors/the-fool", "cups/five-of-cups"])
- currentCardId: string (to exclude the current card if it appears in the list)

For each related card ID, the component should:
1. Look up the card from the Astro content collection
2. Render a link to the card's canonical URL using the metaTitle as the link text
   (fallback to title if metaTitle is not present)
3. Skip any card IDs that cannot be resolved

The component should render as an unordered list of links styled as a bottom-of-page grid.
Inline links may be added later where editorially natural.

The card's canonical URL uses the pattern from entry.data.canonicalUrl (stored in frontmatter).
Confirmed URL pattern: `/repeating-card-meanings/{slug}/` (not `/tools/repeating-card-meanings/{slug}`).
```

---

## Troubleshooting Prompts

### Prompt T1 — Diagnose Frontmatter Parse Errors

```
The Astro build is throwing a frontmatter parse error for a card file.
File: [PATH TO FILE]
Error message: [PASTE ERROR]

Please read the file and identify:
1. Which frontmatter field is causing the parse error
2. Whether the error is a YAML formatting issue (indentation, quoting, special characters)
3. The specific fix required

The valid frontmatter field set is defined in:
B:\repeating-cards-working-file\seo-aeo-output\01-audit\frontmatter-field-map.md

Do not alter any body content. Only fix the frontmatter field identified as the source
of the parse error.
```

---

### Prompt T2 — Validate Schema Output

```
I need to check the JSON-LD output on a card page.

Please read the rendered HTML source of [CARD PAGE URL] and extract all
<script type="application/ld+json"> blocks.

For each block:
1. Report the schema @type
2. Report whether required fields are present and non-empty
3. Flag any fields with "undefined" or null values

Required fields per schema type:

Article: headline, name, description, url, mainEntityOfPage, image, author, publisher
BreadcrumbList: all three itemListElement entries with name and item
FAQPage: at least 5 mainEntity Question entries, each with name and acceptedAnswer.text
```

---

### Prompt T3 — Check for Missing Cards in Metadata

```
I need to verify that card-metadata-map.yaml contains entries for all 78 tarot cards.

Read the file at:
B:\repeating-cards-working-file\seo-aeo-output\04-metadata\card-metadata-map.yaml

Report:
1. How many card entries are present (should be 78)
2. List any cards from the standard 78-card tarot deck that are missing
3. Check for duplicate entries (same collection ID appearing twice)

The expected cards are:
Major Arcana (22): the-fool through the-world
Wands (14): ace-of-wands through king-of-wands
Cups (14): ace-of-cups through king-of-cups
Swords (14): ace-of-swords through king-of-swords
Pentacles (14): ace-of-pentacles through king-of-pentacles
```
