# AI Retrieval Guidelines
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 7 — AI Retrieval

---

## Purpose

This document provides operational guidelines for writing and maintaining content that performs well in AI retrieval environments. These guidelines apply to:

- New card content (if 78-card set is ever expanded)
- Card content revisions and updates
- Future pillar page content
- Future combination card content or collection pages

Guidelines are grounded in observed AI retrieval behaviour and the specific structural properties of the Tides of Knowing content system. They are not theoretical; they reflect what actually works given the content structure audited in `ai-retrieval-audit.md`.

---

## Principle 1 — Write for the Query, Not for the Section

Every section should be able to stand alone as an answer to a specific query. Before writing any section, identify the primary search query it would answer.

**Apply this to**:
- All life area sections — the query is "[card] repeating meaning [life area]"
- All temporal sections — the query is "what does it mean when [card] keeps appearing [timeframe]"
- The "Why This Energy Has Not Released Yet" section — the query is "why does [card] keep coming up"
- The "Signs the Pattern Is Beginning to Resolve" section — the query is "how do I know when [card] repeating pattern is resolving"

**Do not apply this to**:
- Reflective Questions (not answers, so not extractable as direct responses)
- Practical Integration Actions (instructional, not query-response format)
- The Shadow Expression (supplementary context, not a primary seeker query)

---

## Principle 2 — Put the Core Claim in the First Sentence

AI extraction systems scan the first sentence of a section to determine if the section answers a query. The core claim of the section should be in the first sentence, not buried in the third paragraph.

**Correct opening pattern**:
```
The Five of Cups repeating in the context of career signals...
```

**Avoid**:
```
When you find yourself in a work situation that feels difficult, or when you are facing...
```

The second pattern requires the AI system to read several sentences before encountering the answer. The first pattern is immediately extractable.

**Exception**: The opening blockquote uses a reflective, evocative opening by design. This section is a brand expression, not a direct-answer section. The `featuredSnippetAnswer` in the metadata layer handles the direct-answer function.

---

## Principle 3 — Complete the Answer Before Adding Depth

Each section should fully answer its query in the first paragraph, then add nuance or depth in subsequent paragraphs. AI systems extract the first complete answer they find; depth that comes before the answer reduces extraction probability.

**For life area sections**:
- Paragraph 1: Direct answer — what the repeating pattern means in this life area
- Paragraph 2 (if present): Nuance — shadow expression or specific variant of the pattern
- Paragraph 3 (if present): Integration direction — what the pattern is asking for

**For temporal sections**:
- Paragraph 1: What this timeframe specifically signals (distinct from other timeframes)
- Paragraph 2: Why the timeframe is significant for this card's pattern

---

## Principle 4 — Avoid Answer Burial

Answer burial is when the most extractable content is surrounded by framing, qualification, or context that prevents AI systems from recognising it as the answer.

**Common forms of answer burial in tarot content**:
- Opening with the seeker's emotional state before stating the card's meaning
- Long qualifying phrases before the core claim ("While it is true that every reading is different and the surrounding cards matter, when the...")
- Ending sections with evocative closings that obscure the main claim

**Detection test**: Read the first two sentences of any section. Can a reader who knows nothing else answer the specific query this section should answer? If not, the answer is buried.

This is not an instruction to strip the Tides of Knowing voice from the content. It is an instruction to ensure that the direct answer is present and reachable in the first one or two sentences before the prose expands.

---

## Principle 5 — Maintain Consistent Entity Language

AI retrieval systems build entity models of each card across all 78 pages. Consistent naming conventions reinforce entity recognition.

**Rules**:
- Always use the full card name as it appears in the H1 on first reference in any section
- Use "The Fool", "Five of Cups", "King of Wands" — not abbreviations, not "the fool card", not "5 of cups"
- On second reference within the same section, the card name alone is sufficient
- Do not vary card names across sections of the same card page

**Applies to**:
- All body copy
- FAQ question phrasing in schema
- `featuredSnippetAnswer` — must begin with the full card name
- Anchor text for internal links (per `internal-linking-map.yaml`)

---

## Principle 6 — Calibrate Section Length to Query Complexity

Optimal section length for AI extraction depends on the query type:

| Query Type | Optimal Length | Rationale |
|------------|----------------|-----------|
| Direct definition ("what does X mean") | 50-120 words | Featured snippet window |
| Life area query ("X for career") | 80-150 words | FAQ answer window |
| Temporal query ("X every week") | 100-200 words | FAQ answer window |
| Why/how query ("why does X keep appearing") | 100-175 words | Comprehensive but bounded |
| Shadow/integration (supplementary) | 80-150 words | Context, not primary extraction target |

Sections significantly over these ranges are not penalised, but the extractable content should still be front-loaded. The extra depth is for human readers, not extraction targets.

---

## Principle 7 — Use Schema as the Extraction Signal Layer

Schema markup is the primary mechanism for telling AI systems which sections to extract for which queries. Without schema, AI systems infer extraction candidates from content structure alone.

**Schema signals in this system** (from `schema-field-map.yaml`):
- `featuredSnippetAnswer` is the direct extraction candidate for "what does [card] mean when it repeats"
- FAQPage schema maps life area sections to life area queries
- FAQPage schema maps temporal sections to temporal queries
- FAQPage schema maps "Why Not Released" to the "why does [card] keep appearing" query
- Article `description` provides the card's top-level summary for AI overview contexts

Schema does not replace content quality — it amplifies it. A poorly written section with schema will not extract well. A well-written section without schema is under-signalled.

---

## Principle 8 — Preserve the Tides of Knowing Voice

AI retrieval does not require generic or flat language. The Tides of Knowing tone — psychologically precise, reflective, direct — is an asset, not a liability.

**What to preserve**:
- The specificity of the psychological pattern language (threshold-paralysis, performing-departure, etc.)
- The seeker-facing address that is direct without being prescriptive
- The shadow/integration frame that distinguishes Tides of Knowing from generic tarot sites
- The structural precision of the 4-pattern Core Repeating Message

**What to avoid** (specifically because it reduces extraction probability):
- Poetic closings at the end of sections that do not contain factual claims
- Long qualifying frames before the core claim ("It is important to understand that tarot is...")
- Generic phrases that appear on many tarot sites ("The cards are asking you to...")
- Passive constructions that bury the card as the subject ("In readings where this card appears repeatedly, seekers often find..." vs. "The Five of Cups repeating in readings signals...")

The voice is preserved by the substance of the pattern language. The extraction probability is improved by front-loading that substance.

---

## Principle 9 — New Content Checklist

Use this checklist when writing any new card page, pillar page, or collection page:

- [ ] H1 contains the card name and the phrase "Repeating Meaning" or equivalent
- [ ] Summary field is written and renders visibly on the page near the top
- [ ] Core Repeating Message Pattern 1 opens with the card name as subject
- [ ] Each life area section opens with a direct, query-answerable first sentence
- [ ] Each temporal section directly states what the timeframe signals in the first sentence
- [ ] "Why This Energy Has Not Released Yet" section directly answers the "why" query in the first sentence
- [ ] FAQ schema has been mapped for all life area sections and temporal sections
- [ ] Article schema is populated with headline, description, and datePublished
- [ ] BreadcrumbList schema is populated with the card's canonical URL
- [ ] `featuredSnippetAnswer` is written (40-70 words, starts with card name, no metaphor)
- [ ] `answerEngineSummary` is written (2-3 sentences, covers pattern + shadow + integration)
- [ ] Related cards are assigned (3-5 cards from `related-card-map.yaml` pattern)
- [ ] Cluster membership is assigned in `internal-linking-map.yaml`

---

## Principle 10 — Monitoring and Iteration

AI retrieval performance changes as AI systems update their extraction models. The following should be monitored after launch:

**Check every 6 months**:
- Which card queries trigger AI Overview appearances for Tides of Knowing?
- Which sections are being extracted (inspect AI overview citations)?
- Are any cards not appearing in AI overview despite strong content? (Investigate schema issues)

**Check after major AI system updates**:
- Has the `featuredSnippetAnswer` format requirement changed?
- Are FAQPage results displaying differently in search?
- Are there new schema types that apply to tarot interpretation content?

**Content-level checks**:
- `primaryKeyword` and `secondaryKeywords` should be audited against actual search data after 6 months (from `metadata-governance.md` Lifecycle section)
- If a card page is ranking but not appearing in AI overview, review whether the first sentence of its most relevant section is extractable

Human review required: Assign responsibility for the 6-month AI retrieval monitoring review before launch. This is an ongoing operational task, not a one-time setup.
