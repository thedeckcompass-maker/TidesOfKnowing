# AI Retrieval Audit
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 7 — AI Retrieval

---

## Purpose

This document audits the repeating card meanings content system for AI retrieval performance. It assesses how well each content section is positioned for extraction by AI overview systems, large language model retrieval pipelines, and featured snippet selection. It identifies both strengths and gaps, and provides specific recommendations for improving AI discoverability without altering the editorial voice or content quality.

---

## Audit Framework

AI retrieval systems (Google AI Overviews, ChatGPT search, Perplexity, Bing Copilot, and others) extract content through five primary mechanisms:

1. **Semantic proximity** — matching the content meaning to the query intent
2. **Structural clarity** — identifying cleanly bounded sections with clear headings
3. **Answer completeness** — finding sections that answer the query in full without requiring the reader to follow links
4. **Authority signal** — using site trust, internal link density, and structured data to weight content
5. **Direct answer format** — preferring content that begins with the answer rather than context-building

The Tides of Knowing content is evaluated against each mechanism.

---

## Section-Level Retrieval Audit

### Opening Blockquote

**Retrieval mechanism match**: Semantic proximity, direct answer format
**AI retrieval grade**: B+

Strengths:
- Present in all 78 cards
- Describes the card's central image and repeating pattern in 60-100 words
- Ends with the core seeker question — a strong intent signal
- Poetic but not opaque; AI systems can extract the core claim

Risks:
- The repeated phrase "The question this card keeps returning with is..." appears across all 78 cards
- AI systems may de-duplicate this structural phrasing and reduce the distinctiveness signal for individual cards
- The blockquote format (markdown `>`) is rendered as a quote element in HTML — AI systems may not extract it as body content unless schema explicitly marks it

Recommendation:
- The `featuredSnippetAnswer` in `card-metadata-map.yaml` supplements the blockquote for AI extraction
- Consider adding `description` or `abstract` property in Article schema pointing to the blockquote text
- No content changes required — structural risk, not quality risk

---

### Summary (Frontmatter)

**Retrieval mechanism match**: Direct answer format, authority signal
**AI retrieval grade**: A (for structured data use), C (as page content)

Strengths:
- The summary field is analytically precise and directly answers "what is [card]'s repeating pattern"
- Already used as `description` in Article schema (via `schema-field-map.yaml`)
- 60-110 words — ideal length for AI overview extraction

Risks:
- The summary is stored only in frontmatter and is NOT rendered on the page
- AI systems that crawl rendered HTML will not see this text
- Content that is not visible to users is increasingly de-weighted by AI retrieval systems

Recommendation (high priority):
- Render the summary field visibly on each card page, near the top — above the blockquote or below the H1
- Label it "In Brief" or "Core Pattern" to give it a section identity
- This is the single highest-impact improvement for AI retrieval performance

---

### Core Repeating Message

**Retrieval mechanism match**: Semantic proximity, structural clarity, answer completeness
**AI retrieval grade**: A-

Strengths:
- 400-700 words across 4 clearly differentiated pattern descriptions
- Each pattern is a complete, self-contained explanation (80-120 words)
- The 4-pattern structure creates natural retrieval chunks
- Patterns are psychologically specific — not generic tarot descriptions

Risks:
- Patterns often begin with structural phrases ("The most common pattern is...", "A second pattern emerges...") that are not direct answers to a search query
- AI systems looking for a direct answer to "what does [card] mean when it keeps appearing" will land on the first pattern — this should be the strongest and most direct statement

Recommendation:
- Ensure Pattern 1 in every card opens with the card name as the subject and states the core repeating claim in the first sentence
- Current opening pattern: "The most common pattern is..." — consider whether this or the direct claim serves better as the opening

---

### Temporal Repetition Sections (Weekly/Monthly/Seasonal/Annual)

**Retrieval mechanism match**: Semantic proximity (voice search, temporal queries)
**AI retrieval grade**: B

Strengths:
- Each temporal section answers a distinct seeker query
- 100-200 words per section — good length for voice search extraction
- Genuinely differentiated content per timeframe

Risks:
- These sections are strong FAQ candidates but require FAQ schema to signal their question-answer nature to AI systems
- Without FAQ schema, AI retrieval systems may not recognise these as standalone answers
- The heading format ("When This Card Repeats Weekly") is a statement, not a question — AI FAQ matching requires question-format headings or schema

Recommendation (high priority):
- Apply FAQPage schema per `schema-field-map.yaml` — this is the primary mitigation
- FAQ question phrasing should use search-aligned phrasing (e.g., "What does it mean when [card] keeps appearing every week?")

---

### Life Area Sections

**Retrieval mechanism match**: All five mechanisms — highest overall retrieval value
**AI retrieval grade**: A

Strengths:
- 7 sections per card covering distinct life territories
- Each section directly answers the query "[card] repeating meaning [life area]"
- 80-150 words per section — ideal chunk size
- High semantic specificity — sections are card-specific, not generic advice

Risks:
- Requires FAQ schema to maximise extraction probability
- H2 headings use "Love & Relationships" format — not question format
- AI overview systems increasingly favour content that explicitly frames sections as answers

Recommendation:
- FAQPage schema is the primary mitigation (already in `schema-field-map.yaml`)
- No content changes required — structure and quality are strong

---

### Shadow Expression

**Retrieval mechanism match**: Semantic proximity
**AI retrieval grade**: B-

Strengths:
- Psychologically specific and distinct
- 80-120 words — good chunk size
- Covers territory not found in generic tarot sites — differentiation value

Risks:
- Not a direct answer to a common search query
- Shadow terminology may not match seeker language ("shadow expression" vs. "negative meaning" or "warning meaning")
- Less likely to be extracted as a direct answer; more likely to be cited as supporting context

Recommendation:
- No structural changes required
- Could include FAQ schema for high-confidence shadow answers (e.g., "What is the shadow meaning of [card] repeating?")
- The `featuredSnippetAnswer` already covers the primary query; shadow content is supplementary

---

### "Why This Energy Has Not Released Yet"

**Retrieval mechanism match**: Direct answer format, answer completeness, semantic proximity
**AI retrieval grade**: A

Strengths:
- Directly answers the primary seeker intent: "Why does [card] keep coming up?"
- 100-150 words — ideal length
- Written in accessible, direct language
- This is the highest retrieval-value section after the Core Repeating Message

Risks:
- The heading "Why This Energy Has Not Released Yet" is content-language, not query-language
- AI systems use heading text as a retrieval signal — query-aligned headings extract better
- Risk: AI overview may not correctly attribute this section as the answer to "why does [card] keep appearing"

Recommendation (high priority):
- Apply FAQ schema with question "Why does [card] keep appearing in my tarot readings?" mapped to this section's content
- Alternative consideration: render the heading with a subtitle or add schema markup that maps this section to the search query form

---

### "What This Card Wants the Seeker to Understand"

**Retrieval mechanism match**: Direct answer format, semantic proximity
**AI retrieval grade**: B+

Strengths:
- Functions as the closing thesis statement for each card
- 100-150 words — good length
- Synthesises the card's core message in accessible language
- Often contains the most extractable summary statement in the whole card

Risks:
- The phrase "what the card wants" may not match AI query matching for "what does [card] mean"
- Some closing statements are more evocative than factual — reduces extraction confidence

Recommendation:
- No structural changes required
- The `featuredSnippetAnswer` and `answerEngineSummary` in the metadata layer already cover this territory as structured data

---

### Signs the Pattern Is Beginning to Resolve

**Retrieval mechanism match**: Semantic proximity, answer completeness
**AI retrieval grade**: B+

Strengths:
- Forward-looking content not commonly found on other tarot sites — differentiation value
- Directly answers: "How do I know when [card] pattern is resolving?"
- 80-120 words — good chunk size

Risks:
- Not yet covered by FAQ schema
- Lower priority than life area and temporal sections for schema implementation

Recommendation:
- Consider FAQ schema for this section in a second implementation phase

---

### Reflective Questions

**Retrieval mechanism match**: Semantic proximity (PAA — People Also Ask)
**AI retrieval grade**: C+

Strengths:
- 10 specific, card-relevant questions per card
- High semantic variety — covers most sub-territories of the card's pattern

Risks:
- Questions are invitations to reflect, not factual answers — FAQPage schema would misrepresent them
- AI systems looking for answers will not extract unanswered questions as useful content
- Do not wrap in FAQPage schema (confirmed in `schema-strategy.md`)

Recommendation:
- These sections provide PAA (People Also Ask) signal but should not be schema-marked as FAQ
- The questions can inform future content expansion — if a question recurs across many cards, it may warrant a dedicated page

---

### Practical Integration Actions

**Retrieval mechanism match**: Semantic proximity, answer completeness
**AI retrieval grade**: B

Strengths:
- 5 actionable sections per card
- "How to work with [card] pattern" queries
- Bolded headers give structural clarity

Risks:
- Not currently covered by any schema type
- HowTo schema would be appropriate if a dedicated integration-actions page were created
- At the card-page level, these sections are supplementary

Recommendation:
- No immediate schema action required
- Future consideration: HowTo schema for a consolidated "Working With Repeating Card Patterns" page

---

## Overall AI Retrieval Readiness Summary

| Content Layer | AI Grade | Primary Gap | Action Required |
|--------------|----------|-------------|-----------------|
| featuredSnippetAnswer (metadata) | A | None | None — already structured |
| answerEngineSummary (metadata) | A | None | None — already structured |
| Life area sections | A | FAQ schema not yet applied | Apply FAQPage schema |
| "Why Not Released" section | A | FAQ schema not yet applied | Apply FAQPage schema |
| Core Repeating Message | A- | First pattern opening | Minor content review |
| "What Card Wants" section | B+ | Query-language alignment | None critical |
| Opening blockquote | B+ | Blockquote extraction | Schema description property |
| Temporal sections | B | FAQ schema not applied | Apply FAQPage schema |
| Signs Resolving section | B+ | FAQ schema phase 2 | Phase 2 schema |
| Shadow Expression | B- | Query language mismatch | Optional FAQ schema |
| Reflective Questions | C+ | Not FAQ candidates | No action |
| Practical Integration | B | No schema type applied | No immediate action |
| Summary field (frontmatter) | C (rendered) | Not visible on page | Render as visible block |

---

## Top Recommendations

1. **Render the frontmatter `summary` field** as a visible "In Brief" or "Core Pattern" block near the top of each card page. This is the highest-impact single change for AI retrieval performance.

2. **Apply FAQPage schema** to life area sections, temporal sections, and "Why This Energy Has Not Released Yet" per `schema-field-map.yaml`. This is the second-highest-impact change.

3. **Apply Article schema** to all 78 card pages, populating `description` from the `summary` field. This is the foundation AI signal for all card pages.

4. **Confirm first-sentence quality** in each card's Core Repeating Message — Pattern 1 should open with the card name as subject and a direct claim about the repeating pattern.

5. **Monitor AI overview extraction** after launch. Track which queries trigger AI Overview appearances for the site and which cards are extracted. Use this data to prioritise future schema expansion.
