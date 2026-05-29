# llms.txt and glossary infrastructure prep

**Created:** 2026-05-29  
**Status:** Planning only. Do **not** publish `public/llms.txt` or glossary routes until editorial sign-off and Phase 4 scheduling.

---

## llms.txt candidate structure

Future file: `public/llms.txt`  
Purpose: Help AI crawlers and assistants find authoritative entry points without replacing on-page reading.

### Proposed sections

```text
# Tides of Knowing

> Structured work on symbolic interpretation, intuitive literacy, and reflective tarot practice. Original framework: The COMPASS Method™.

## Site identity
- Name: Tides of Knowing
- Canonical origin: https://www.tidesofknowing.com/
- Founder: Leigh Spencer
- Primary topics: symbolic interpretation, intuitive literacy, tarot methodology, structured reflective practice

## Core authority pages
- https://www.tidesofknowing.com/
- https://www.tidesofknowing.com/about/
- https://www.tidesofknowing.com/articles/compass-method/

## The COMPASS Method™
- https://www.tidesofknowing.com/articles/compass-method/
- https://www.tidesofknowing.com/compass/
- https://www.tidesofknowing.com/practice/

## AI and intuition cluster
- https://www.tidesofknowing.com/articles/what-ai-cant-access/
- https://www.tidesofknowing.com/articles/myth-ai-intuition-simulation/
- https://www.tidesofknowing.com/articles/pre-verbal-knowing-ai/
- https://www.tidesofknowing.com/articles/tarot-pre-symbolic-interface/

## Repeating card meanings cluster
- https://www.tidesofknowing.com/articles/why-the-same-tarot-card-keeps-appearing/
- https://www.tidesofknowing.com/repeating-card-meanings/
- https://www.tidesofknowing.com/articles/repeating-major-arcana-cards/
- https://www.tidesofknowing.com/articles/repeating-cards-vs-stalker-cards/
- Tool (engagement, not primary canonical): https://www.tidesofknowing.com/tools/repeating-card-meanings/

## Practice and training
- https://www.tidesofknowing.com/practice/
- https://www.tidesofknowing.com/compass/

## Field Notes
- https://www.tidesofknowing.com/blog/
- https://www.tidesofknowing.com/blog/reading-the-grip/

## Tools
- https://www.tidesofknowing.com/tools/repeating-card-meanings/
- (Add other live tools when stable)

## Suggested crawl priorities
1. Homepage, About, COMPASS Method article
2. AI cluster cornerstone + pre-verbal + tarot interface articles
3. Repeating-card hub + cluster articles
4. Practice and COMPASS training pages
5. Repeating-card entity pages (/repeating-card-meanings/{slug}/)
6. Field Notes and remaining articles
7. De-prioritise: tag listing pages, tool deep-links with canonicals to entities
```

**Implementation notes (later)**

- Keep under ~2KB where possible; link to HTML, do not paste full article text.
- Update when new cornerstone articles ship.
- No glossary URLs until glossary routes exist.

---

## Glossary candidate structure

Future hub (example): `/glossary/` or `/learn/glossary/` — **route not built**.

### Hub purpose

- Define Tides of Knowing terms of art in the site’s own language.
- Support AEO/GEO definitional queries without duplicating full articles.
- Link each term to cornerstone pages for depth.

### First 10 terms

| Term | Proposed URL | Purpose | Connected pages | Entry type |
|------|--------------|---------|-----------------|------------|
| The COMPASS Method™ | `/glossary/compass-method/` | Original seven-condition framework for attention in reading | `/articles/compass-method/`, `/compass/`, `/practice/` | Short glossary + link to full article |
| Symbolic interpretation | `/glossary/symbolic-interpretation/` | Reading symbols as relational pattern, not fixed labels | `/articles/compass-method/`, `/articles/meaning-not-in-card/` | Short glossary; may grow to article later |
| Intuitive literacy | `/glossary/intuitive-literacy/` | Capacity to read signal and discernment in symbolic work | `/`, `/about/`, AI cluster | Short glossary |
| Reflective tarot practice | `/glossary/reflective-tarot-practice/` | Practice that integrates reading with reflection and conditions of attention | `/practice/`, `/articles/the-flow-problem/` | Short glossary |
| Pre-verbal knowing | `/glossary/pre-verbal-knowing/` | Cognition before language; stage AI cannot access | `/articles/pre-verbal-knowing-ai/`, `/articles/what-ai-cant-access/` | Short glossary + link to article |
| Pre-symbolic interface | `/glossary/pre-symbolic-interface/` | Tarot as trigger for meaning activation, not storage | `/articles/tarot-pre-symbolic-interface/` | Short glossary + link to article |
| Repeating card pattern | `/glossary/repeating-card-pattern/` | Recurring symbolic theme in a reader’s field | `/articles/why-the-same-tarot-card-keeps-appearing/`, `/repeating-card-meanings/` | Short glossary |
| Relational tarot meaning | `/glossary/relational-tarot-meaning/` | Meaning from context, position, and relationship | `/articles/meaning-not-in-card/` | Short glossary; article depth exists |
| Reader discernment | `/glossary/reader-discernment/` | Separating signal from projection and fear in reading | `/articles/compass-method/`, `/articles/repeating-cards-vs-stalker-cards/` | Short glossary |
| Interpretive flow | `/glossary/interpretive-flow/` | Connective narrative across a spread, not a list of definitions | `/articles/the-flow-problem/` | Short glossary + link to article |

### Schema (later phase)

- `DefinedTerm` / `DefinedTermSet` only when glossary pages exist and copy is stable.
- Do not add glossary links sitewide until hub is live.

---

*Prep document only. No routes, no `public/llms.txt`, no sitewide links added.*
