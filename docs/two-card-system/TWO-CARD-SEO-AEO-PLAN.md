# Two-Card SEO / AEO Plan

**Product:** When Two Cards Meet — Major Arcana upright ordered pairs  
**Entity count at launch:** 462 indexable pairing pages + hub + tool  
**Reference pattern:** Repeating Card Meanings (`/repeating-card-meanings/` + `/tools/repeating-card-meanings/`)

---

## 1. URL and naming strategy

### Recommended public routes (mirror repeating-card split)

| Page type | Path | Role |
|-----------|------|------|
| **Tool (interactive)** | `/tools/two-card-tarot-reading/` | Card selection, draw, read-at-home — **retain** |
| **SEO/AEO cluster hub** | `/two-card-tarot-meanings/` | Framework, order-matters explainer, browse by first card |
| **Pairing entity** | `/two-card-tarot-meanings/{first}-and-{second}/` | Canonical authored meaning |

**Slug pattern:** `{first-card-slug}-and-{second-card-slug}`

Examples:

- `/two-card-tarot-meanings/the-fool-and-the-tower/`
- `/two-card-tarot-meanings/the-tower-and-the-fool/` (distinct entity)
- `/two-card-tarot-meanings/wheel-of-fortune-and-justice/`

**Card slug table (majors):** Reuse repeating-card major slugs where they exist (`the-fool`, `wheel-of-fortune`, `judgement`, etc.).

### Why `two-card-tarot-meanings` over `when-two-cards-meet`

| Option | Pros | Cons |
|--------|------|------|
| **`/two-card-tarot-meanings/`** | Matches search intent (“two card tarot meaning”); parallel to `/repeating-card-meanings/`; clear entity type | Slightly less brand-poetic |
| **`/when-two-cards-meet/`** | Matches tool H1 and brand voice | Weaker keyword match; less obvious cluster for sitemaps/internal links |

**Recommendation:** Use **`/two-card-tarot-meanings/`** for the indexable cluster. Use *“When Two Cards Meet”* as **H1/subtitle/brand** on hub and tool, not as the primary URL segment.

### Tool → canonical flow

After the user selects two majors and clicks **Read Your Cards**:

1. Tool shows a **short teaser** (relational one-liner + CTA).
2. Primary CTA: **Read the full pairing** → canonical URL with query params optional (`?from=tool` for analytics).
3. Tool does **not** render the full 1,600-word reading inline (avoids duplicate content).

---

## 2. Title tags

**Pairing page formula:**

```text
{First Card} and {Second Card} Tarot Meaning: When These Two Cards Meet | Tides of Knowing
```

Examples:

- `The Fool and The Tower Tarot Meaning: When These Two Cards Meet | Tides of Knowing`
- `Wheel of Fortune and Justice Tarot Meaning: When These Two Cards Meet | Tides of Knowing`

**Hub:**

```text
Two-Card Tarot Meanings: When Two Major Arcana Cards Meet | Tides of Knowing
```

**Tool (unchanged intent, tighten if needed):**

```text
Two Card Tarot Reading — When Two Cards Meet | Tides of Knowing
```

**Rules:**

- First card **always** named first (matches draw order).
- Avoid “vs” (implies interchangeable).
- Keep under ~60 characters where possible; allow longer for long card names.

---

## 3. Meta descriptions

**Pairing page template (~155–160 chars):**

```text
Explore what happens when {First Card} meets {Second Card} in a two-card tarot reading. A relational interpretation of the tension, movement, and meaning between these Major Arcana cards—in draw order.
```

**Required semantic elements:**

- Both card names
- “Two-card” / “tarot reading”
- **Order matters** (draw order, not reversed orientation)
- Major Arcana scope (until minors exist)

**Hub meta:**

```text
Browse 462 Major Arcana two-card combinations in draw order. Each pairing is a full relational reading—how the first card shapes the field when the second arrives.
```

---

## 4. On-page structure (H1–H3)

### Pairing page

| Element | Content |
|---------|---------|
| **H1** | `{First Card} and {Second Card}: When These Two Cards Meet` |
| **Order callout** (above fold) | Short paragraph: *Card 1 is the room; Card 2 is what enters. A Fool → Tower reading is not the same as Tower → Fool.* |
| **Featured snippet paragraph** | 40–55 words: Dynamic Recap + directional one-liner |
| **Answer-engine summary** | 2–3 sentences plain-language (mirror repeating-card `answerEngineSummary`) |
| **Body** | Render authored sections in template order |
| **FAQ** | 5–7 questions (from “The Questions” + 2 structural FAQs below) |
| **Related pairings** | Same first card (20 links) + inverse pair (1) + 2–3 thematic neighbours |
| **Card links** | Link each card name to `/repeating-card-meanings/{slug}/` when `status: ready` |
| **Tool CTA** | Link to `/tools/two-card-tarot-reading/` with pre-filled cards if feasible |

**Structural FAQ additions (every pairing):**

1. *Does card order matter in a two-card reading?*
2. *Is this the same as {Second} and {First}?* → No, link to inverse pairing.

### Hub page

- H1: **Two-Card Tarot Meanings**
- H2: How ordered pairs work
- H2: Browse by first card (22 anchors)
- H2: Use the interactive tool
- Optional H2: Relationship to Repeating Card Meanings

---

## 5. Canonical URLs

- Each pairing page: `rel="canonical"` → `https://www.tidesofknowing.com/two-card-tarot-meanings/{slug}/`
- Tool page: canonical to itself; **not** a duplicate of pairing content.
- If query params on tool (`?card1=&card2=`): canonical still tool URL; pairing pages remain separate entities.

---

## 6. Open Graph

| Field | Pairing | Hub |
|-------|---------|-----|
| `og:type` | `article` | `website` |
| `og:title` | Same as title tag (or shortened) | Hub title |
| `og:description` | Meta description | Hub meta |
| `og:url` | Canonical pairing URL | Hub URL |
| `og:image` | Composite or first-card RWS image `/images/tarot/rws/{slug}.jpg` | Custom hub image later |

---

## 7. JSON-LD

### Pairing page graph

```text
WebPage
  └── BreadcrumbList (Home → Two-Card Meanings → Pairing)
  └── Article (or WebPage + Speakable)
        about: [TarotCard, TarotCard]
  └── FAQPage (FAQ section)
```

**`about` entities:** Use `Thing` or `CreativeWork` with `name` for each card; link `@id` to repeating-card canonical URL when live.

**Speakable / AEO:** Mark `featuredSnippetAnswer` and `answerEngineSummary` blocks with stable CSS selectors (same approach as repeating-card pages).

### Hub

- `CollectionPage` or `WebPage` + `ItemList` of 22 first-card groups (not all 462 URLs in one list — use paginated child lists or sitemap as primary discovery).

### Tool

- `WebApplication` optional; lower priority than pairing Article schema.

---

## 8. Sitemap

Add when pages are `ready`:

- Hub: priority `0.8`, monthly
- Each pairing: priority `0.68–0.72`, monthly (slightly below repeating-card entities if desired)
- Tool hub entry: already under `/tools/` — ensure `two-card-tarot-reading` listed

**Do not** add 462 URLs until content passes validator (`status: ready` gate — same pattern as repeating cards).

---

## 9. Internal linking

### Inbound to pairings

- Hub: 22 “first card” index pages or accordion linking to 21 children each
- Tool: CTA after selection
- Repeating-card pages: optional “Pairings with this card” module (majors only, phased)
- Articles: contextual links where editorially relevant

### Outbound from pairings

- Both cards → repeating-card meaning (if ready)
- Inverse pairing → prominent inline link
- Tool → footer CTA
- Hub → breadcrumb parent

### Anchor text

- Prefer: *“Fool and Tower meaning (Fool first)”* vs generic *“click here”*
- Always signal order in link text when linking to ordered pair

---

## 10. Avoiding thin / duplicate content

| Risk | Mitigation |
|------|------------|
| 462 similar pages | Each page is **unique authored prose**; no template-only generation |
| Tool vs canonical duplication | Tool shows summary only; full text only on canonical |
| Inverse pair cannibalisation | Distinct URLs, titles, H1s; cross-link explicitly; separate primary keywords |
| Hub vs pairing | Hub is navigational + methodology, not full readings |
| “Reversal” confusion | Remove tarot-reversal language; explain **order** only |
| Keyword overlap with repeating cards | Pairing pages target “{A} and {B} tarot meaning”; repeating pages target “{A} keeps appearing” |

---

## 11. Scaling 462 pages without cannibalisation

1. **Topic cluster:** One hub + 22 first-card sub-hubs (optional phase 2) + 462 leaves.
2. **Unique primary intent per URL:** Ordered pair phrase in title/H1.
3. **Noindex** until `status: ready` (draft gate).
4. **Gradual sitemap rollout** if needed (all ready at once is fine if content is truly unique).
5. **Related links** keep PageRank flowing within cluster, not competing with site root.
6. **Monitor** Search Console for query overlap between inverse pairs; adjust titles if needed.

---

## 12. Breadcrumbs

```text
Home → Two-Card Tarot Meanings → The Fool and The Tower
```

JSON-LD `BreadcrumbList` with absolute URLs.

---

## 13. Content frontmatter (generated)

Align with repeating-card metadata standards:

```yaml
title: "The Fool and The Tower: When These Two Cards Meet"
slug: two-card-tarot-meanings/the-fool-and-the-tower
firstCard: the-fool
secondCard: the-tower
firstCardName: The Fool
secondCardName: The Tower
primaryKeyword: fool and tower tarot meaning
secondaryKeywords: []
summary: "" # Dynamic Recap excerpt
featuredSnippetAnswer: ""
answerEngineSummary: ""
canonicalUrl: /two-card-tarot-meanings/the-fool-and-the-tower/
openGraphImage: /images/tarot/rws/the-fool.jpg # or composite
status: draft | ready
tier: major-majors
arcanaScope: major-upright-ordered
```

---

## 14. Leigh decisions (SEO)

1. Approve URL cluster `/two-card-tarot-meanings/` vs brand URL.
2. Approve title/H1 formulas.
3. Minimum word count for `ready` (recommend ≥1,200 words main body).
4. Whether to build 22 first-card sub-hub pages in v1 or v2.
5. og:image strategy: single card vs composite pairing image.
