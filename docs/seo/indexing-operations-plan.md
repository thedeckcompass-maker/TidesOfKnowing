# Indexing operations plan (30 days)

**Created:** 2026-05-29  
**Purpose:** Practical GSC workflow after Phase 3 structural and content alignment.  
**Related:** [`manual-indexing-wave-1.md`](./manual-indexing-wave-1.md), [`repeating-card-index-monitoring.md`](./repeating-card-index-monitoring.md), [`repeating-card-index-tracker.csv`](./repeating-card-index-tracker.csv), [`baselines/gsc-baseline-2026-05-25.md`](./baselines/gsc-baseline-2026-05-25.md)

**Rules for this plan**

- Do **not** modify sitemap or robots.txt as part of daily ops.
- Maximum **5 URL inspection + request indexing** actions per day (manual quota discipline).
- Wait **≥14 days** before re-requesting the same URL unless a site bug was fixed.
- Do **not** submit thin tag pages or tool deep-links (canonicals point to entities).
- Prioritise pages strengthened in Phase 3 and high-authority hubs before bulk entity pages.

---

## 1. Priority URL categories

| Category | Examples | Submit priority |
|----------|----------|-----------------|
| Homepage and core entity pages | `/`, `/about/` | High (after deploy) |
| COMPASS and practice pathway | `/articles/compass-method/`, `/practice/`, `/compass/` | High |
| AI / intuitive literacy cluster | `what-ai-cant-access`, `pre-verbal-knowing-ai`, `myth-ai-intuition-simulation`, `tarot-pre-symbolic-interface` | High |
| Repeating-card cluster articles | `why-the-same-tarot-card-keeps-appearing`, `repeating-major-arcana-cards`, `repeating-cards-vs-stalker-cards` | High |
| Repeating-card hub | `/repeating-card-meanings/` | High (Wave 0 if not done) |
| Methodology cluster | `meaning-not-in-card`, `the-flow-problem` | Medium-high |
| Field Note series | `/blog/reading-the-grip/` | Medium |
| Repeating card entity pages | `/repeating-card-meanings/{slug}/` | Medium (P1 queue first; see wave 1) |
| Tag pages | `/tags/...` | Low / defer |

---

## 2. Daily GSC rhythm

| Step | Action |
|------|--------|
| 1 | Pick up to **5 URLs** from the queue below (or wave 1 entity queue). |
| 2 | **URL Inspection** → record exact GSC bucket before submit. |
| 3 | Confirm user-declared canonical matches intended URL. |
| 4 | **Request indexing** once per URL. |
| 5 | Log submit date in the monitoring table. |
| 6 | Sync entity rows to [`repeating-card-index-tracker.csv`](./repeating-card-index-tracker.csv) when applicable. |

**Recheck schedule (per URL)**

| Checkpoint | When |
|------------|------|
| Recheck 7 days | Submit date + 7 days (status only; no re-request) |
| Recheck 14 days | Submit date + 14 days (status; re-request only if policy allows) |
| Recheck 30 days | Submit date + 30 days (indexed Y/N, impressions, clicks, position) |

---

## 3. Selection rules

1. Submit pages with **highest authority value** first (homepage, About, COMPASS Method, cornerstone articles).
2. Submit **structurally strengthened** Phase 3 URLs before untouched articles.
3. Submit **hub and cluster articles** before deep entity pages unless an entity is strategically critical (P1 majors).
4. Do **not** submit every tag page or tool deep-link.
5. Continue **Wave 1** entity cadence in parallel only where slots remain in the daily 5-URL cap (or dedicate separate days to entities only).

---

## 4. Monitoring table (template)

Copy rows into a spreadsheet or extend this table as submissions proceed.

| URL | category | submitted date | indexed Y/N | GSC status | impressions | clicks | avg position | recheck 7d | recheck 14d | recheck 30d | notes |
|-----|----------|----------------|-------------|------------|-------------|--------|--------------|------------|-------------|-------------|-------|
| | | | | | | | | | | | |

**Field sources**

- **GSC status / indexed:** URL Inspection  
- **Impressions, clicks, position:** Performance → filter by exact page URL (28-day window)

---

## 5. Suggested 30-day queue (first pass)

**Assumption:** Production deploy of Phase 2–3 work completed; Wave 0 hub inspection done or scheduled Day 1.

| Day | Date (anchor) | URLs to submit (max 5) | Category mix |
|-----|---------------|------------------------|--------------|
| 1 | _deploy +0_ | `https://www.tidesofknowing.com/` | Core |
| 2 | +1 | `https://www.tidesofknowing.com/about/` | Core |
| 3 | +2 | `https://www.tidesofknowing.com/articles/compass-method/` | COMPASS |
| 4 | +3 | `https://www.tidesofknowing.com/practice/` | Practice |
| 5 | +4 | `https://www.tidesofknowing.com/compass/` | Training |
| 6 | +5 | `https://www.tidesofknowing.com/articles/what-ai-cant-access/` | AI cluster |
| 7 | +6 | `https://www.tidesofknowing.com/articles/myth-ai-intuition-simulation/` | AI cluster |
| 8 | +7 | `https://www.tidesofknowing.com/articles/pre-verbal-knowing-ai/` | AI cluster |
| 9 | +8 | `https://www.tidesofknowing.com/articles/tarot-pre-symbolic-interface/` | AI cluster |
| 10 | +9 | `https://www.tidesofknowing.com/repeating-card-meanings/` | Hub |
| 11 | +10 | `https://www.tidesofknowing.com/articles/why-the-same-tarot-card-keeps-appearing/` | Repeating cluster |
| 12 | +11 | `https://www.tidesofknowing.com/articles/repeating-major-arcana-cards/` | Repeating cluster |
| 13 | +12 | `https://www.tidesofknowing.com/articles/repeating-cards-vs-stalker-cards/` | Repeating cluster |
| 14 | +13 | `https://www.tidesofknowing.com/articles/meaning-not-in-card/` | Methodology |
| 15 | +14 | `https://www.tidesofknowing.com/articles/the-flow-problem/` | Methodology |
| 16 | +15 | `https://www.tidesofknowing.com/blog/reading-the-grip/` | Field Notes |
| 17–20 | +16 to +19 | Wave 1 entities Day 1–4 (see [`manual-indexing-wave-1.md`](./manual-indexing-wave-1.md)) | Entities |
| 21–30 | +20 to +29 | Remaining Wave 1 entities + P1 rechecks at 14d for Days 1–6 | Entities / monitor |

**Wave 1 entity URLs (Days 17–20 alignment)**

- Day 17: the-fool, the-magician, death  
- Day 18: the-tower, the-high-priestess, the-hermit  
- Day 19: the-star, the-moon, the-sun  
- Day 20: the-lovers, wheel-of-fortune, the-chariot (inspect chariot bucket first)

**Tool page:** `/tools/repeating-card-meanings/` — do **not** request indexing; canonical intent is engagement, not index bloat. Hub and entities carry SEO canonicals.

---

## 6. Coordination with existing wave 1

- Entity queue and cadence: [`manual-indexing-wave-1.md`](./manual-indexing-wave-1.md)  
- Tracker CSV: [`repeating-card-index-tracker.csv`](./repeating-card-index-tracker.csv)  
- Baseline: 141 URLs in “Discovered – currently not indexed” bucket (2026-05-25 export)

After Phase 3 pages are submitted, expect 2–4 weeks before meaningful Performance data on those URLs.

---

## 7. Pause conditions

Pause bulk submissions if:

- A deploy introduced canonical or redirect regressions.
- GSC shows widespread “Crawled – currently not indexed” spike on newly submitted URLs.
- Manual requests exceed 5/day (quota noise).

Resume with hub + cornerstone articles first.

---

*Operational doc only. No sitemap or robots changes.*
