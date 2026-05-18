# Future AI Features
# Tides of Knowing — Repeating Card Meanings
# Generated: 2026-05-18
# Stage: 7 — AI Retrieval

---

## Purpose

This document identifies future AI-powered features that could extend the Tides of Knowing repeating card meanings system beyond static content. These are not implementation plans — they are identified opportunities, each with a brief technical assessment and a readiness rating based on how well the current content system supports them.

Human review required: All items in this document are opportunities, not commitments. Confirm strategic alignment before pursuing any.

---

## Feature 1 — Repeating Card Pattern Identifier

**Description**: A tool that allows a seeker to input 2-5 recent draws and receive an analysis of the repeating patterns across those draws.

**How it would work**:
- User selects cards from a 78-card picker interface
- The system identifies shared themes, seeker states, and cluster membership across the selected cards
- Output: a pattern summary drawn from the card content, cluster data, and taxonomy

**Current system readiness**: HIGH
The `card-taxonomy-map.yaml` provides structured theme, seeker_state, and cluster data for all 78 cards. This data is directly usable for pattern-matching logic. The related-card-map.yaml provides semantic proximity data.

**Data sources required**:
- `card-taxonomy-map.yaml` — theme and seeker_state intersection
- `internal-linking-map.yaml` — cluster membership overlap
- `card-metadata-map.yaml` — answer summaries for each card
- No new content generation required

**Technical complexity**: Medium. Requires a pattern-matching layer on top of the taxonomy data and a UI for card selection. The content system is ready; the application layer is not yet built.

**AI model requirement**: A small retrieval model or rule-based intersection engine would suffice. LLM generation is optional for the output synthesis layer.

---

## Feature 2 — Conversational Repeating Card Interpreter

**Description**: A conversational interface where a seeker describes their repeating card experience in natural language and receives an interpretation drawn from the Tides of Knowing content.

**How it would work**:
- Seeker inputs: "I keep drawing the Five of Cups in my morning readings, especially when I think about work"
- The system retrieves the Five of Cups life area content (Career & Purpose section), the temporal content (Weekly section), and the `answerEngineSummary`
- Response is synthesised from retrieved content, not generated from scratch

**Current system readiness**: HIGH
The `answerEngineSummary`, `featuredSnippetAnswer`, and full section content provide retrieval-ready chunks for all 78 cards. The taxonomy provides intent classification (life area, temporal pattern, seeker state).

**Data sources required**:
- `card-metadata-map.yaml` — answerEngineSummary and featuredSnippetAnswer per card
- Card markdown source files — full section content for RAG retrieval
- `card-taxonomy-map.yaml` — intent classification (life_areas, seeker_states)

**Technical complexity**: Medium-High. Requires:
- A vector embedding of all card sections (approximately 78 x 15 sections = ~1,170 chunks)
- A retrieval layer (RAG or semantic search)
- A synthesis model to compose the response from retrieved chunks
- Natural language card entity recognition (mapping user input "five of cups" to the correct card ID)

**AI model requirement**: Embedding model + retrieval layer + a generation model for synthesis. Claude API (Anthropic) or similar would be suitable for the synthesis layer.

**Brand note**: Output must preserve the Tides of Knowing voice and should cite the source card page. The system should not generate interpretations beyond what is in the source content.

---

## Feature 3 — Automated Content Freshness Monitor

**Description**: A system that monitors whether card content has become misaligned with evolving search intent patterns and flags cards for human review.

**How it would work**:
- Connects to Google Search Console or a keyword tracking tool
- Compares current ranking queries with `primaryKeyword` and `secondaryKeywords` in `card-metadata-map.yaml`
- Flags cards where search queries have drifted from the current keyword targets
- Reports to the content editor as a monthly digest

**Current system readiness**: MEDIUM
The keyword data in `card-metadata-map.yaml` is the baseline. Integration with live search data requires an external tool connection.

**Data sources required**:
- `card-metadata-map.yaml` — current keyword targets
- Google Search Console API or third-party keyword tracker
- No content changes required at this stage

**Technical complexity**: Low-Medium. The comparison logic is simple; the integration with external data sources requires setup but not novel development.

**AI model requirement**: No LLM required. Rule-based comparison with threshold alerting.

---

## Feature 4 — Personalised Card Reading History Tracker

**Description**: A tool that allows registered users to log their tarot draws over time and receive analysis of their personal repeating patterns.

**How it would work**:
- User logs cards drawn (date + card + context)
- System tracks frequency and co-occurrence
- After a threshold of draws (e.g., 10 sessions), the system surfaces which cards have repeated and links to their repeating meaning pages
- Optionally: generates a personal pattern summary from the taxonomy data

**Current system readiness**: MEDIUM
The 78-card taxonomy provides the pattern vocabulary for personal summaries. The repeating card meaning pages provide the content destination. A user account and draw-logging system are not yet built.

**Data sources required**:
- `card-taxonomy-map.yaml` — pattern vocabulary for personal summaries
- `card-metadata-map.yaml` — answer summaries for each card
- User draw history (requires user account system)

**Technical complexity**: High. Requires user authentication, persistent data storage, and a draw analysis layer. The content system is ready; the product infrastructure is not.

**AI model requirement**: Pattern analysis can be rule-based. Natural language summary generation would benefit from an LLM.

---

## Feature 5 — AI-Generated Pillar Page Summaries

**Description**: Automated generation of cluster pillar page content that aggregates and synthesises information from the 11 cluster card groups.

**How it would work**:
- A generation job runs when a new pillar page is needed
- The system ingests the card content for all cards in the cluster
- An LLM generates a pillar page that: introduces the cluster theme, summarises each card's repeating pattern in 2-3 sentences, and links to each card page
- Human editor reviews and approves before publication

**Current system readiness**: HIGH
The cluster definitions in `high-authority-clusters.md`, the per-card `answerEngineSummary` fields in `card-metadata-map.yaml`, and the linking structure in `topic-cluster-map.md` provide all the raw material needed.

**Data sources required**:
- `high-authority-clusters.md` — cluster definitions and pillar page themes
- `card-metadata-map.yaml` — answerEngineSummary for each card in the cluster
- `topic-cluster-map.md` — linking and sub-cluster structure

**Technical complexity**: Low-Medium. The generation job is straightforward given the structured source data. The main complexity is in maintaining consistent voice across generated pillar pages.

**AI model requirement**: LLM for generation (Claude API or similar). The source data is structured; generation can be tightly templated to maintain the Tides of Knowing voice.

**Brand caution**: Human review is required for all generated pillar content before publication. The LLM should generate from the structured source data, not freely interpret card meanings.

---

## Feature 6 — Semantic Search Across the 78 Cards

**Description**: A site-level semantic search that allows seekers to search by pattern, emotional state, or situation rather than by card name.

**How it would work**:
- Seeker inputs: "cards about feeling stuck" or "what card keeps appearing when I can't let go"
- The system maps the input to seeker_state and theme terms in `card-taxonomy-map.yaml`
- Returns the most semantically relevant card pages, ranked by taxonomy match

**Current system readiness**: HIGH
The `card-taxonomy-map.yaml` provides the vocabulary for semantic matching. The `seeker_states`, `themes`, and `emotional_patterns` fields are directly usable for search.

**Data sources required**:
- `card-taxonomy-map.yaml` — all vocabulary fields
- `card-metadata-map.yaml` — featuredSnippetAnswer as the result card preview text

**Technical complexity**: Low-Medium. Can be implemented as keyword-to-taxonomy mapping with no LLM, or as vector search for better fuzzy matching.

**AI model requirement**: Optional. A well-indexed taxonomy search (Elasticsearch or similar) can work without an LLM. Vector embeddings of the taxonomy would improve match quality for natural language queries.

---

## Readiness Summary

| Feature | Readiness | Complexity | Priority Recommendation |
|---------|-----------|------------|------------------------|
| Repeating Card Pattern Identifier | High | Medium | High — leverages existing taxonomy directly |
| Conversational Interpreter | High | Medium-High | Medium — high value but requires RAG infrastructure |
| Content Freshness Monitor | Medium | Low-Medium | Low — useful but not urgent at launch |
| Personal Draw History Tracker | Medium | High | Low — requires product infrastructure first |
| AI Pillar Page Generation | High | Low-Medium | High — accelerates pillar page creation |
| Semantic Search | High | Low-Medium | High — immediately improves seeker navigation |

---

## Data Readiness Assessment

The current content system provides the following AI-ready data assets:

| Asset | File | AI Use Case |
|-------|------|-------------|
| Structured taxonomy per card | card-taxonomy-map.yaml | Pattern matching, semantic search, clustering |
| Featured snippet answers | card-metadata-map.yaml | RAG retrieval, direct answer synthesis |
| Answer engine summaries | card-metadata-map.yaml | LLM context provision, pillar page generation |
| Related card relationships | related-card-map.yaml | Recommendation, navigation |
| Cluster memberships | internal-linking-map.yaml | Thematic grouping, pattern similarity |
| Full card content | source markdown files | RAG corpus, full context retrieval |

The content system is well-prepared for AI feature development. The primary investment needed is infrastructure (retrieval systems, embedding models, user interfaces), not content.
