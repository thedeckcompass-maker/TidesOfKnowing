# Phase 3 live-readiness review

**Review date:** 2026-05-29  
**Method:** Source and build review against Phase 3 waves 1–3 changes. Visual QA on staging/production after deploy is still recommended (especially mobile).  
**Scope:** Priority URLs only. No code changes made during this review.

## Summary

| Status | Count |
|--------|------:|
| OK | 12 |
| Needs review | 5 |
| Issue | 0 |

No broken internal links were found in reviewed source paths. No layout bugs requiring immediate fix were identified.

---

## Page assessments

| URL | Status | Reader-first assessment | Action-first assessment | SEO/AEO/GEO support assessment | Recommended follow-up |
|-----|--------|-------------------------|-------------------------|--------------------------------|----------------------|
| `/` | OK | Hero keeps pathways as primary value; authority phrase in support copy does not block routes. | Pathway cards remain above the fold in structure; clear entry to Method, repeating cards, articles. | Entity spine visible; JSON-LD description em dash fixed in wave 2. | Spot-check mobile: hero + first pathway row visible without scroll. |
| `/about/` | needs review | Entity story intact; lede aligns with homepage positioning without feeling like a sales page. | No single CTA (appropriate for About); internal links to Method and Practice are natural. | Meta and lede carry authority terms; Person `@id` via ecosystem graph unchanged. | **Mobile:** hero may feel text-heavy before TOC (photo + three lede paragraphs). Confirm scroll depth on phone. |
| `/practice/` | OK | Practice environment and audience remain clear. | Primary CTA to The Deck Compass stays first; COMPASS links in support line do not displace CTA. | Training vs practice distinction reinforced with light links. | None required before deploy. |
| `/compass/` | needs review | Training page remains conversion-focused; hero note is one short orientation line. | Apply CTA remains primary above the fold. | FAQ JSON-LD still maps from visible FAQ items; method article link present. | **Live check:** hero note vs “Training and practice” section below. Keep note unless it feels visibly repetitive on device (editorial decision already: keep for now). |
| `/articles/compass-method/` | needs review | Method content unchanged; `hideSystemPathway` avoids generic pathway clutter. | Article is the destination; further reading points to practice/training appropriately. | “In brief” + further reading strengthen entity; may overlap excerpt slightly. | After deploy, compare excerpt (listing/meta) vs “In brief” on page. Trim only if visibly redundant. |
| `/articles/what-ai-cant-access/` | OK | Philosophical opening preserved; “In brief” is specific, not generic AI copy. | Series navigation and field-guide aside remain reader-led. | Strong GEO bridge; further reading connects series + COMPASS. | Monitor excerpt vs “In brief” overlap in GSC snippets only. |
| `/articles/pre-verbal-knowing-ai/` | OK | Science/practice tone intact; brief is definitional without flattening voice. | Series flow clear; body links to cornerstone articles. | Cluster mid-point well linked via further reading. | None before deploy. |
| `/articles/tarot-pre-symbolic-interface/` | OK | Advanced tarot argument preserved; brief states interface model clearly. | Tool mention (combination interpreter) is contextual, not a CTA hijack. | Cluster completion article; curated further reading. | None before deploy. |
| `/articles/myth-ai-intuition-simulation/` | OK | Simulation vs sensing distinction sharp; brief avoids “AI is not human” cliché. | Reads as essay first; links support series path. | Citeable for simulation vs intuition queries. | None before deploy. |
| `/articles/why-the-same-tarot-card-keeps-appearing/` | OK | Interpretive nuance preserved; brief states pattern not prediction. | Hub and tool linked in body and further reading without duplicating hub content. | Cluster anchor; strong internal graph. | None before deploy. |
| `/articles/repeating-major-arcana-cards/` | OK | Theme-scale reading clear; brief distinguishes persistence from doom. | Library + tool links at end support next action (lookup). | Supports majors-specific queries. | None before deploy. |
| `/articles/repeating-cards-vs-stalker-cards/` | OK | Grounded language on stalker vs repeating; tone not sensational. | Library/tool links support investigation, not fear. | Cluster capstone for language discipline. | None before deploy. |
| `/articles/meaning-not-in-card/` | OK | Methodology nuance intact; brief is relational/contextual, not generic. | Further reading points to series + COMPASS + practice. | Core methodology cite target. | None before deploy. |
| `/articles/the-flow-problem/` | OK | Practitioner focus preserved; brief names flow vs list problem. | Practice link at end of exercise section supports action. | Deck Compass series piece; links to training path. | None before deploy. |
| `/repeating-card-meanings/` | OK | Hub reads as reference library; card list follows short hero. | Tool link secondary in hero; crawlable card links dominate. | Hub vs tool distinction clear; editorial links in footer. | Continue entity indexing per operations plan; hub Wave 0 if not done. |
| `/tools/repeating-card-meanings/` | OK | Selector-first workspace; library callout is aside, not a wall before the tool. | Choose card → read pattern is immediate; long context below results. | Canonical hub linked; engagement signal preserved. | **Mobile:** confirm two-column workspace stacks with selector before library aside. |
| `/blog/reading-the-grip/` | needs review | Field Note series tone preserved; “In brief” is observational. | Series note list remains primary journey; cheat sheet mention intact. | Series landing extractability improved. | **Mobile:** “In brief” + meta description + series intro may stack; confirm it does not feel like three openings. |

---

## Cross-cutting notes

### “In brief” vs excerpt

Articles with both `excerpt` and `shortAnswer` may show similar ideas in meta/listing and on-page “In brief”. This is acceptable if wording differs; flag only if they read as duplicate paragraphs on live view.

### “Further reading”

Placed after article body, before generic “Continue through the system” pathway (where present). Curated 4-item lists read as cluster navigation, not bibliographies. COMPASS Method hub uses `hideSystemPathway` to reduce footer noise.

### Repeating-card entities

Entity pages use **“Short answer”** label (not “In brief”) when `featuredSnippetAnswer` differs from summary. Not in this URL list; unchanged in Phase 3.

### Post-deploy QA checklist

1. Load each URL on mobile width (~390px).
2. Confirm primary action (pathway, CTA, selector, or article read) within first screen or obvious next scroll.
3. Submit strengthened URLs per `indexing-operations-plan.md` after production deploy.
4. Revisit `/compass/` hero note only if duplication feels visible on device.

---

*Review complete. No source changes from this document.*
