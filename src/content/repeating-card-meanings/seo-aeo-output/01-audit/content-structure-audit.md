# Content Structure Audit
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 1 — System Audit

---

## Section Ordering — Standard Template (All 78 Cards)

All cards follow this section sequence:

```
1. YAML Frontmatter
2. # [Card Name] Repeating Meaning  (H1)
3. > Opening blockquote  (italic prose, image description + pattern question)
4. ## Core Repeating Message  (400-700 words, 4 pattern descriptions)
5. ---
6. ## When This Card Repeats Weekly
7. ---
8. ## When This Card Repeats Monthly
9. ---
10. ## When This Card Repeats Seasonally
11. ---
12. ## When This Card Repeats Across Years
13. ---
14. # Life Area Interpretations  (H1 section header)
15. ## Love & Relationships
16. ---
17. ## Career & Purpose
18. ---
19. ## Money & Stability
20. ---
21. ## Spiritual Growth
22. ---
23. ## Emotional & Mental Patterns
24. ---
25. ## Family & Generational Dynamics
26. ---
27. ## Health & Energy
28. ---
29. # Advanced Interpretive Sections  (H1 section header)
30. ## The Shadow Expression
31. ---
32. ## The Integrated Expression
33. ---
34. ## Why This Energy Has Not Released Yet
35. ---
36. ## What This Card Wants the Seeker to Understand
37. ---
38. ## Signs the Pattern Is Beginning to Resolve
39. ---
40. ## Reflective Questions  (10 numbered questions)
41. ---
42. ## Practical Integration Actions  (5 bolded subsections)
```

Ordering is consistent across all 78 cards. No section omissions identified in audit sample.

---

## Heading Hierarchy Analysis

### Current Structure
- H1: Used for document title AND two internal section breaks (`# Life Area Interpretations`, `# Advanced Interpretive Sections`)
- H2: Used for all named sections within those groups

### Issue
Using H1 for internal section groupings (`Life Area Interpretations`, `Advanced Interpretive Sections`) creates an irregular heading hierarchy that may confuse crawlers and screen readers. The document has three H1s per page.

### Recommendation
Convert `# Life Area Interpretations` and `# Advanced Interpretive Sections` to H2, and promote their subsections to H3. This creates a clean `H1 > H2 > content` hierarchy.

Human review required: Confirm template change scope and whether existing rendering handles this.

---

## Opening Blockquote Analysis

- Present in all cards
- Length: 60-100 words typically
- Function: image reading + central pattern question ("The question this card keeps returning with is...")
- Tone: reflective, direct, present tense
- SEO/AEO value: HIGH — blockquotes are often extracted by AI overview systems as direct quotes
- Retrieval risk: The phrase "The question this card keeps returning with is" is repeated across all 78 cards. This is intentional structurally but may cause AI systems to treat these as duplicates. The distinct content after this phrase is what differentiates them.
- Recommendation: The opening blockquote is a strong extractable-quote candidate. Mark with schema `quotation` or `description` property in JSON-LD.

---

## Summary Field Analysis

- Present in all cards (frontmatter, not visible on page)
- Length: 60-110 words
- Tone: analytical, pattern-focused
- Structure: typically 2-3 sentences (what the card is + what the pattern marks + what the core tension is)
- SEO value: HIGH — primary source for metaDescription and answerEngineSummary
- Current issue: summary is stored only in frontmatter and is not rendered on the page. This reduces indexable text and AI extraction value. Recommend rendering summary as a visible "In Brief" section or as structured data.

---

## Core Repeating Message — Retrieval Quality

- Length: 400-700 words typically
- Structure: 4-pattern model (Pattern 1: most common / Pattern 2: second form / Pattern 3: third form / Pattern 4: fourth or contextual)
- AI retrieval strength: HIGH — clear paragraph-level chunking maps well to vector retrieval
- The 4-pattern structure creates natural chunking boundaries
- Each pattern is approximately 80-120 words — good chunk size for RAG and AI overview extraction
- Risk: Patterns often begin with "The most common pattern is" / "A second pattern..." — this is useful for AI but slightly formulaic. Not a problem at scale; provides consistent retrieval structure.

---

## Temporal Repetition Sections (Weekly/Monthly/Seasonal/Annual)

- Length: 100-200 words per section
- Structure: 2-3 short paragraphs
- Differentiation quality: HIGH — each temporal framing is genuinely distinct
- AI retrieval value: MEDIUM — useful for voice search queries ("what does it mean when [card] keeps coming up every week")
- Opportunity: These sections are strong candidates for FAQ schema markup (one FAQ per timeframe)

---

## Life Area Sections

- Length: 80-150 words per section (abbreviated tier)
- Count: 7 sections per card
- Differentiation quality: Generally HIGH — most life area sections are genuinely card-specific
- Risk areas: Health and Energy section is sometimes the weakest (bodily/physical metaphor can feel stretched for some cards)
- AI retrieval value: HIGH — life area sections directly answer common seeker questions ("what does [card] mean for career?")
- Recommendation: These sections are strong candidates for structured FAQ schema

---

## Advanced Interpretive Sections

### Shadow Expression
- Length: 80-120 words
- Quality: HIGH — shadow expressions are generally distinct and psychologically specific

### Integrated Expression
- Length: 80-120 words
- Quality: HIGH — integration descriptions are specific and resolution-oriented

### Why This Energy Has Not Released Yet
- Length: 100-150 words
- Quality: HIGH — this section directly answers a likely AI query ("why does [card] keep appearing?")
- AI retrieval value: VERY HIGH — answers the core seeker question directly

### What This Card Wants the Seeker to Understand
- Length: 100-150 words
- Quality: HIGH — functions as a closing thesis statement
- AI retrieval value: HIGH — extractable as a featured-snippet type answer

### Signs the Pattern Is Beginning to Resolve
- Length: 80-120 words
- Quality: HIGH — offers forward-looking, resolution-oriented content
- Search intent match: HIGH — seekers ask "how do I know [card] pattern is resolving?"

---

## Reflective Questions

- Count: 10 per card (confirmed, editorial rule enforced)
- Format: Numbered list
- Length: 20-60 words per question
- Quality: HIGH — questions are specific to the card's pattern, not generic
- AI retrieval value: MEDIUM — questions may surface in "people also ask" type contexts
- FAQ schema opportunity: YES — all 10 questions could be wrapped in FAQPage schema, though this may be excessive. Recommend selecting 3-5 highest-retrieval questions per card for FAQ schema.

---

## Practical Integration Actions

- Count: 5 per card (confirmed, editorial rule enforced)
- Format: Bold heading + paragraph
- Length: 60-100 words per action
- Quality: HIGH — actions are specific and genuinely practical
- AI retrieval value: MEDIUM-HIGH — "how to work with [card] pattern" queries
- Search intent match: HIGH for seekers in resolution-seeking mode

---

## Semantic Density Assessment

| Section | Semantic Density | AI Retrieval Value | Featured Snippet Fit |
|---------|-----------------|-------------------|---------------------|
| Opening blockquote | High | High | Yes |
| Summary (frontmatter) | Very High | Very High | Yes |
| Core Repeating Message | High | High | Partial (per pattern) |
| Weekly/Monthly/Seasonal/Annual | Medium-High | Medium | Yes (FAQ) |
| Life Area sections | High | High | Yes (FAQ) |
| Shadow Expression | High | Medium-High | No |
| Integrated Expression | High | Medium-High | No |
| Why Not Released | Very High | Very High | Yes |
| What Card Wants | High | High | Yes |
| Signs Resolving | High | High | Yes |
| Reflective Questions | Medium | Medium | FAQ potential |
| Practical Integration | Medium-High | Medium-High | No |

---

## Over-Poetic Risk Assessment

- Risk level: LOW-MEDIUM overall
- The Tides of Knowing tone is deliberately reflective and psychologically nuanced, not conventionally "SEO-friendly"
- This is a brand asset, not a deficit — do not flatten the prose into keyword-stuffed alternatives
- Specific risk: some blockquotes and section endings use poetic/evocative closings that will not extract cleanly as featured snippets
- Mitigation: ensure every card has at least 3-5 short, direct, extractable statements within the body that can serve as retrieval anchors

---

## Answer Extraction Quality

Overall: STRONG

The content is unusually well-structured for answer extraction because:
1. Each major section has a clear thematic frame
2. The 4-pattern structure in the Core section provides distinct retrievable chunks
3. The "Why Not Released" section directly answers the primary search intent
4. Life area sections provide targeted topical answers

Weaknesses:
1. No FAQ markup currently applied
2. Summary is not rendered on-page (buried in frontmatter)
3. Some H1 heading misuse may confuse crawler section boundaries
4. No structured "Quick Answer" or "In Brief" block near top of page

---

## Recommendations Summary

| Priority | Action |
|----------|--------|
| High | Fix H1/H2 hierarchy (demote internal section headers to H2) |
| High | Render `summary` field visibly near top of page (or use as structured data) |
| High | Apply FAQ schema to life area sections and temporal sections |
| Medium | Add JSON-LD Article and BreadcrumbList schema to every card |
| Medium | Mark opening blockquote as extractable quote in JSON-LD |
| Medium | Implement "In Brief" summary block rendered at page top |
| Low | Audit Health & Energy sections for semantic stretch cases |
| Low | Apply FAQPage schema to top 5 reflective questions per card |
