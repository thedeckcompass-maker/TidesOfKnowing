# Tides of Knowing SEO, AEO, and GEO Truth Document

**Status:** Working doctrine (Phase 1)  
**Last updated:** 2026-05-29 (action-first principle added)  
**Scope:** SEO (search), AEO (answer engines), GEO (generative engines) for tidesofknowing.com  
**Editorial rule:** Optimisation must make pages clearer, not heavier. Preserve voice, nuance, and strategic positioning.

---

## 1. Strategic Objective

Tides of Knowing is being built as a long-term authority site around symbolic interpretation, intuitive literacy, tarot methodology, The COMPASS Method™, Field Notes, article series, tools, and The Deck Compass practice ecosystem.

**Timeline**

| Milestone | Target |
|-----------|--------|
| Serious traction | March 2027 |
| Recognised authority | Within 18 months of sustained publication and entity consistency |

**What success looks like**

- Search systems reliably index and rank the site for methodology and interpretive territory (not generic “card meaning” queries alone).
- Answer engines can extract direct, accurate answers from priority pages without flattening the voice.
- Generative engines can cite Tides of Knowing as a stable source tied to Leigh Spencer, The COMPASS Method™, and a coherent body of work.
- Readers experience clearer, more useful pages—not SEO apparatus.

---

## 2. Core Authority Position

Tides of Knowing should **not** compete primarily as a generic tarot meaning site. Its stronger authority territory is:

- Tarot as **symbolic interpretation**
- **Intuitive literacy** (discernment, perception, relational reading)
- **Relational meaning** (context, field, relationship—not fixed dictionary definitions)
- **Reflective practice** (journaling, live conditions, habit)
- **Disciplined human perception** in the age of AI

**Target authority phrase**

> The leading source for tarot as symbolic interpretation, intuitive literacy, and structured reflective practice.

**Competitive framing**

| We lean into | We avoid as primary identity |
|--------------|------------------------------|
| Method, perception, recurrence, AI boundary, longing, practice | Keyword tarot dictionaries, fortune-telling framing, stalker-card sensationalism |
| The COMPASS Method™ as interpretive framework | “Learn all 78 meanings” commodity content |
| Leigh Spencer’s journalism + decades of practice | Anonymous or brand-only tarot blogs |

---

## 3. Entity Spine

Core entities the site must make clear to readers and to search/generative systems. For each: current page strength and whether further work is needed.

| Entity | Role | Clear dedicated page? | Strengthening needed? |
|--------|------|----------------------|------------------------|
| **Tides of Knowing** | Editorial and methodology publisher | Yes — homepage (`/`), ecosystem JSON-LD on all pages | Moderate — homepage could surface “intuitive literacy” and authority phrase more explicitly without clutter |
| **Leigh Spencer** | Founder, author, practitioner | Yes — `/about/` | Moderate — strong narrative; align Person `@id` everywhere with ecosystem graph; external corroboration (LinkedIn, interviews) over time |
| **The COMPASS Method™** | Original interpretive framework | Yes — `/articles/compass-method/` (hub); referenced site-wide | Low–moderate — glossary/definition hub would help GEO; avoid over-forcing mentions |
| **The Deck Compass** | Live practice ecosystem | Yes — `/practice/` (bridge); primary product at thedeckcompass.com | Low — keep cross-site entity `@id` sync with Deck Compass repo |
| **Symbolic interpretation** | Core intellectual territory | Partial — woven through articles, repeating cards, about | **Yes** — dedicated glossary or hub page not yet live |
| **Intuitive literacy** | Distinct positioning term | Weak — phrase underused vs “intuitive discernment” / “perception” | **Yes** — consistent visible use on homepage, about, and key hubs |
| **Reflective tarot practice** | Practice posture | Partial — practice page, Field Notes, methodology series | Moderate — tie Field Notes and tools to “reflective practice” in series intros |
| **Repeating card meanings** | High-volume interpretive cluster | Yes — `/repeating-card-meanings/` hub + 78 entity pages | Moderate — indexing still catching up (see SEO ops docs); content layer is strong |
| **Field Notes** | Personal/practical observations | Yes — `/blog/` (URL legacy; editorial label “Field Notes”) | Moderate — contextual series framing; optional `/field-notes/` route later |
| **Article series** | Evergreen methodology arcs | Yes — `/series/[slug]/` for four defined series | Low — series metadata in `src/data/series.ts` is solid |
| **Tarot tools** | Practice interfaces | Yes — `/tools/` | Moderate — AEO for individual tools uneven; combination/two-card expansion planned separately |
| **Reader training and practice** | COMPASS cohort / apply | Yes — `/compass/`, `/compass/apply/` | Low–moderate — FAQ visible on training page; FAQPage schema not yet on that route |

**Technical entity spine (already in codebase)**

Stable `@id` values in `src/lib/ecosystem-structured-data.ts` and `docs/ecosystem-structured-data.md` must remain synchronized with The Deck Compass codebase.

---

## 4. Page Type Doctrine

What each page type should ideally contain—reader-first, extractable where useful, never overloaded.

### Homepage

- Clear value proposition for symbolic perception and The COMPASS Method™.
- Trust line (40+ years practice, 30 years journalism, founder attribution).
- Pathways into method, repeating meanings, tools, practice, training.
- Light ecosystem schema reinforcement (already present).
- **Avoid:** keyword blocks, FAQ walls, duplicate series summaries.

### About page

- Leigh Spencer authority: journalism, business, tarot practice, Matakite lineage.
- Explicit links to Tides of Knowing, COMPASS Method article, Deck Compass practice.
- Structured sections with on-page TOC (already present).
- **Ideal add (later):** same Person `@id` as global ecosystem graph.

### Method pages

- Definition of The COMPASS Method™ and seven conditions/pillars.
- Why it exists; who it serves; link to training and tools.
- Short definitional paragraph near top where it helps skimmers.
- References or further reading to anchor articles (when editorially appropriate).
- **Avoid:** competing with `/articles/compass-method/` as duplicate canon.

### Article pages

- Strong title + excerpt/meta description aligned to search intent.
- Author credibility line (Leigh Spencer + attribution string).
- Optional short answer block **only** when the article answers one primary question.
- Series navigation when part of a series.
- “Continue through the system” pathway links (method, tools, practice, training).
- TechArticle + BreadcrumbList schema (current pattern).
- **Avoid:** generic FAQs; stuffing COMPASS mentions.

### Article series pages

- Series title, editorial description, part count/status.
- Ordered list of articles with clear progression.
- ItemList schema (current pattern).
- Short series-level summary for AEO (“what this series is for”).
- **Avoid:** thin auto-generated copy; duplicate article excerpts as the only description.

### Field Notes (standalone)

- Field Note label, category, date, reading time.
- Author link to about + attribution line.
- Description required in frontmatter (meta).
- Contextual intro when note is foundational or archival.
- **Avoid:** treating Field Notes as full methodology articles (different job).

### Field Note series

- Series landing with description, order, links to each note.
- Optional positioning sentence per note (frontmatter supports this).
- Cheat sheets where designed—not on every note.
- **Avoid:** duplicate COMPASS explainer on every part.

### Tool pages

- What the tool does in plain language (first screen).
- How it relates to symbolic interpretation / COMPASS where natural.
- Canonical discipline: interactive URLs must not compete with SEO entity URLs (repeating cards pattern is the model).
- **Avoid:** thin tool pages with no interpretive framing.

### Repeating card entity pages

- Canonical URL: `/repeating-card-meanings/{slug}/`.
- H1, panel summary, structured sections (core message, temporal patterns, life areas).
- `featuredSnippetAnswer` / `answerEngineSummary` in frontmatter when maintained.
- FAQ from visible Q&A (FAQPage schema when questions model is populated).
- Links to hub, tool deep-link, related cards, related articles.
- **Avoid:** fortune-telling tone; medical claims; duplicate tool page as canonical.

### Practice and training pages

- **Practice (`/practice/`):** Deck Compass bridge—live practice, journaling, reinforcement.
- **Training (`/compass/`):** cohort offer, schedule, apply CTA, genuine FAQ.
- Link back to method article.
- **Avoid:** training page becoming a second homepage.

### Subscribe and lead magnet pages

- Clear offer and signup.
- Subscribe: `noindex, follow` (correct—keep out of sitemap).
- Lead magnets (e.g. AI field guide): indexable only if they are true landing assets with unique value.
- **Avoid:** indexing parameterized subscribe URLs.

---

## 5. Reader-First Optimisation Rules

1. Optimisation must make pages **clearer**, not heavier.
2. Do not add mechanical SEO sections where they interrupt the reading experience.
3. Add **short answer blocks** only where they help real readers answer the page’s main question.
4. Add **FAQs** only where questions are genuinely useful and visible on the page (training page yes; random articles no).
5. Strengthen **internal links contextually**, not excessively.
6. Preserve **voice, nuance, originality, and interpretive authority**.
7. Avoid **generic tarot language** where Tides of Knowing has stronger proprietary or methodological framing.
8. Use **The COMPASS Method™** consistently where relevant—not where forced.
9. Maintain clear **attribution to Leigh Spencer** where authority matters.
10. **Avoid em dashes** in new or revised copy (site style).

---

## 6. Action-first optimisation principle

Any optimisation that reduces the visitor’s ability to act is not optimisation.

For tool pages especially, engagement is the authority signal. SEO, AEO, and GEO support should clarify and strengthen the visitor’s path, not push the primary action below explanatory content.

For Tides of Knowing, this means:

- Tool pages must foreground the tool.
- Practice pages must foreground the next practice step.
- Training pages must foreground the decision pathway.
- Article pages must foreground the core interpretive answer or inquiry.
- Field Notes must foreground the lived observation or practical insight.
- SEO/AEO/GEO support should be woven into structure, headings, schema, internal links, and concise supporting sections.
- Optimisation should never make the reader feel they have arrived inside a database when they expected a useful page.

**Site-wide rule:** Every page should make its primary visitor action or reader value clear before asking the visitor to absorb supporting authority material.

This principle applies before adding short answers, FAQs, further reading, or entity copy. If a structural change would bury the tool, the CTA, the series entry point, or the article’s central question, it is the wrong change.

---

## 7. AEO and GEO Content Patterns

Lightweight patterns—apply where useful, not site-wide by default.

### Short answer block (articles and hubs)

```markdown
## Short answer

A direct 40 to 70 word answer to the page’s primary question.

### Why this matters

A short contextual paragraph explaining reader relevance.

### How Tides of Knowing approaches this

A short paragraph connecting the answer to symbolic interpretation, The COMPASS Method™, or site methodology where appropriate.
```

**Repeating cards:** use frontmatter `featuredSnippetAnswer` and `answerEngineSummary` (already in schema); render visibly only if/when template supports it without duplicating the opening prose.

### Other patterns

| Pattern | Use when |
|---------|----------|
| Question-led H2s and H3s | Page has a clear user question or decision |
| Clear definitions | Introducing COMPASS, viraha, repeating vs stalker, pre-symbolic interface, etc. |
| Summary sections | Long methodology or series hub pages |
| “In practice” sections | Bridging theory to reading behaviour |
| Internal links to method pages | Any interpretive content that assumes COMPASS literacy |
| Related reading blocks | Articles, card pages, series—contextual, not boilerplate |
| Further reading / references | Deep methodology articles with external or internal sources |
| Visible author credibility | All major content types (articles, Field Notes, card entities) |
| Updated dates | Where content is revised (`updatedDate` / `dateModified`) |

---

## 8. Citation Readiness Principles

AI and answer systems are more likely to cite pages that are:

- **Clear** — one primary intent per URL
- **Specific** — named concepts, not vague spirituality
- **Extractable** — direct answers, definitions, lists where appropriate
- **Internally consistent** — same entity names, same method spelling, same canonical URLs
- **Authoritative** — named author, experience signals, methodological originality
- **Well-linked** — hub → spoke → method → practice
- **Indexed** — in sitemap, crawlable, not blocked
- **Schema-supported** — Article, BlogPosting, FAQPage, BreadcrumbList, ecosystem graph
- **Connected** to a recognisable person, method, and body of work
- **Supported by external corroboration** over time (interviews, guest essays, LinkedIn, consistent entity naming)

---

## 9. Priority Improvements Already Identified

1. Strengthen the **visible entity spine** (especially “intuitive literacy” and authority phrase).
2. Add or refine **author credibility** across major page types (standardise components).
3. Add **short answer blocks** to priority pages where useful (not all pages).
4. Add **references or further reading** to methodology articles where appropriate.
5. Build or prepare for a **glossary hub** (`/glossary/` scaffold).
6. Improve **internal semantic linking** between method, articles, Field Notes, tools, and practice.
7. Continue improving **indexing and crawl importance** (repeating-card wave monitoring).
8. Strengthen **schema by page type** (FAQPage on training; align About Person `@id`; DefinedTerm when glossary exists).
9. Consider **`llms.txt`** as a lightweight AI discoverability aid.
10. Build **external authority signals** over time (interviews, guest essays, LinkedIn, consistent entity naming).

---

## 10. What Not To Do

- Do not turn every page into a keyword-stuffed SEO page.
- Do not add FAQs to pages where they feel artificial.
- Do not bury the original voice under generic optimisation.
- Do not create duplicate content across articles, Field Notes, and glossary entries.
- Do not overuse The COMPASS Method™ where it feels forced.
- Do not weaken the mystical, interpretive, or experiential quality of the writing.
- Do not remove existing strategic content without explicitly documenting why.
- Do not make large content rewrites before auditing what already exists.
- Do not submit tool deep-links for indexing when entity canonicals exist.
- Do not split Person entity `@id` across pages (weakens GEO).

---

## 11. Audit Questions

Use this checklist in Phase 2 (site audit) and for any future page review.

For each page, ask:

1. What is the **primary search intent**?
2. What is the **primary answer intent** (what question does a snippet or AI overview need)?
3. What **entity or concept** does this page strengthen?
4. Is the **title** clear and specific?
5. Is the **excerpt/meta description** strong and distinct?
6. Is there a **clear answer or definition** near the top where appropriate?
7. Are **headings** useful to readers and machines (question-led where it fits)?
8. Does the page show **Leigh Spencer’s authority** where relevant?
9. Does the page connect to **The COMPASS Method™** where relevant?
10. Are **internal links** contextually strong (method, hub, series, tools)?
11. Is **schema** appropriate for this page type?
12. Is the **canonical URL** correct (especially tool vs entity)?
13. Is the page **included in sitemap** where appropriate?
14. Is the page **likely to be indexed** (check GSC bucket, internal links, depth)?
15. Is the page **likely to be cited by AI** (extractable, specific, consistent entities)?
16. What is **missing**?
17. What should **not** be changed?

---

*Related: `docs/seo/seo-aeo-geo-site-audit.md` (Phase 2 site audit), `docs/seo/seo-aeo-geo-structural-alignment-review.md` (action-first structural alignment).*
