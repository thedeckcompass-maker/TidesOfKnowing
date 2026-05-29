# Manual indexing — Wave 1 (P1 entity queue)

Controlled GSC **Request indexing** log for twelve canonical entity pages. Does not change site architecture, canonicals, sitemap, routing, or `noindex`.

| Field | Value |
|-------|--------|
| **Wave** | 1 (P1 priority entities) |
| **Document created** | 2026-05-25 |
| **Baseline source** | `docs/seo/exports/gsc-discovered-not-indexed-urls-2026-05-25.csv`, `docs/seo/repeating-card-index-tracker.csv` |
| **Prerequisite** | Wave 0 complete (hub inspect + request indexing; sitemap resubmitted) — see operator notes below |
| **Runbook** | [`repeating-card-index-monitoring.md`](./repeating-card-index-monitoring.md) §6 |
| **Tracker sync** | After each submit, set `manually_requested=Y`, `last_checked`, and `gsc_status` in [`repeating-card-index-tracker.csv`](./repeating-card-index-tracker.csv) |

## Scope

- **Submit:** canonical URLs only (`/repeating-card-meanings/{slug}/`).
- **Do not submit:** tool deep-links (`/tools/repeating-card-meanings/...`), hub (Wave 0), or bulk remaining 66 entities in this wave.
- **Re-request rule:** wait **≥14 days** on the same URL before a second manual request.

## Recommended submission cadence

Spread requests across four days (three URLs per day) to avoid quota noise.

| Day | Submit these URLs (GSC URL Inspection → Request indexing) |
|-----|-------------------------------------------------------------|
| **Day 1** | [the-fool](https://www.tidesofknowing.com/repeating-card-meanings/the-fool/), [the-magician](https://www.tidesofknowing.com/repeating-card-meanings/the-magician/), [death](https://www.tidesofknowing.com/repeating-card-meanings/death/) |
| **Day 2** | [the-tower](https://www.tidesofknowing.com/repeating-card-meanings/the-tower/), [the-high-priestess](https://www.tidesofknowing.com/repeating-card-meanings/the-high-priestess/), [the-hermit](https://www.tidesofknowing.com/repeating-card-meanings/the-hermit/) |
| **Day 3** | [the-star](https://www.tidesofknowing.com/repeating-card-meanings/the-star/), [the-moon](https://www.tidesofknowing.com/repeating-card-meanings/the-moon/), [the-sun](https://www.tidesofknowing.com/repeating-card-meanings/the-sun/) |
| **Day 4** | [the-lovers](https://www.tidesofknowing.com/repeating-card-meanings/the-lovers/), [wheel-of-fortune](https://www.tidesofknowing.com/repeating-card-meanings/wheel-of-fortune/), [the-chariot](https://www.tidesofknowing.com/repeating-card-meanings/the-chariot/) |

**Suggested calendar anchors** (adjust to actual Wave 0 completion date):

| Cadence day | Planned submit date | First recheck (URL Inspection) | Second recheck (optional) |
|-------------|---------------------|--------------------------------|---------------------------|
| Day 1 | 2026-05-25 | 2026-06-08 | 2026-06-24 |
| Day 2 | _earliest 2026-05-26 (≥24h after Day 1)_ | submit + 14 days | submit + 30 days |
| Day 3 | _YYYY-MM-DD_ | submit + 14 days | submit + 30 days |
| Day 4 | _YYYY-MM-DD_ | submit + 14 days | submit + 30 days |

## Wave 1 Day 1 execution (2026-05-25)

**Scope today:** three URLs only — fool, magician, death. **Day 2 earliest:** 2026-05-26 (wait ≥24 hours). Monitor GSC only until then; no extra manual requests.

> **Agent note:** Search Console actions (URL Inspection, Request indexing) require your logged-in Google account. This environment cannot execute GSC. Complete the checklist below in GSC, then paste per-URL “status before submit” + submit times back to finalize the main queue table (or fill submit columns yourself).

### Day 1 checklist (GSC)

For each URL in order:

1. URL Inspection → paste URL → wait for report.
2. Record **exact** coverage line → “Status before submit” below (do not assume baseline if Inspection differs).
3. Confirm user-declared canonical = same entity URL.
4. **Request indexing** once.
5. Copy submit date/time into the main queue table (rows 1–3) and set **Manually requested** = `Y`.
6. Optionally sync [`repeating-card-index-tracker.csv`](./repeating-card-index-tracker.csv): `manually_requested=Y`, `last_checked=2026-05-25`.

| Order | URL | Status before submit (live Inspection) | Submit date | Submit time (local) | Request indexing clicked | Manually requested |
|-------|-----|----------------------------------------|-------------|---------------------|--------------------------|-------------------|
| 1 | https://www.tidesofknowing.com/repeating-card-meanings/the-fool/ | _paste from GSC_ (baseline: Discovered – currently not indexed) | | | | N |
| 2 | https://www.tidesofknowing.com/repeating-card-meanings/the-magician/ | _paste from GSC_ (baseline: Discovered – currently not indexed) | | | | N |
| 3 | https://www.tidesofknowing.com/repeating-card-meanings/death/ | _paste from GSC_ (baseline: Discovered – currently not indexed) | | | | N |

**Day 1 completion:** 0 / 3 submitted (update count when done).

## Wave 1 priority queue (monitoring log)

Fill **submit date/time** and post-submit fields in GSC after each URL. **Performance** columns (impressions, clicks, position) come from GSC **Performance** filtered to the exact URL (often low until indexed).

| # | URL | Card slug | Cadence day | GSC status before submit (2026-05-25 baseline) | Submit date | Submit time (local) | Recheck 1 (≥14d) | Recheck 2 (~30d) | Indexed | Impressions | Clicks | Avg position | Current GSC bucket | Manually requested | Notes |
|---|-----|-----------|-------------|-----------------------------------------------|-------------|---------------------|------------------|------------------|---------|-------------|--------|--------------|-------------------|--------------------|-------|
| 1 | https://www.tidesofknowing.com/repeating-card-meanings/the-fool/ | the-fool | Day 1 | Discovered – currently not indexed | | | | | | | | | | N | In Discovered export 2026-05-25 |
| 2 | https://www.tidesofknowing.com/repeating-card-meanings/the-magician/ | the-magician | Day 1 | Discovered – currently not indexed | | | | | | | | | | N | In Discovered export 2026-05-25 |
| 3 | https://www.tidesofknowing.com/repeating-card-meanings/death/ | death | Day 1 | Discovered – currently not indexed | | | | | | | | | | N | In Discovered export 2026-05-25 |
| 4 | https://www.tidesofknowing.com/repeating-card-meanings/the-tower/ | the-tower | Day 2 | Discovered – currently not indexed | | | | | | | | | | N | In Discovered export 2026-05-25 |
| 5 | https://www.tidesofknowing.com/repeating-card-meanings/the-high-priestess/ | the-high-priestess | Day 2 | Discovered – currently not indexed | | | | | | | | | | N | In Discovered export 2026-05-25 |
| 6 | https://www.tidesofknowing.com/repeating-card-meanings/the-hermit/ | the-hermit | Day 2 | Discovered – currently not indexed | | | | | | | | | | N | In Discovered export 2026-05-25 |
| 7 | https://www.tidesofknowing.com/repeating-card-meanings/the-star/ | the-star | Day 3 | Discovered – currently not indexed | | | | | | | | | | N | In Discovered export 2026-05-25 |
| 8 | https://www.tidesofknowing.com/repeating-card-meanings/the-moon/ | the-moon | Day 3 | Discovered – currently not indexed | | | | | | | | | | N | In Discovered export 2026-05-25 |
| 9 | https://www.tidesofknowing.com/repeating-card-meanings/the-sun/ | the-sun | Day 3 | Discovered – currently not indexed | | | | | | | | | | N | In Discovered export 2026-05-25 |
| 10 | https://www.tidesofknowing.com/repeating-card-meanings/the-lovers/ | the-lovers | Day 4 | Discovered – currently not indexed | | | | | | | | | | N | In Discovered export 2026-05-25 |
| 11 | https://www.tidesofknowing.com/repeating-card-meanings/wheel-of-fortune/ | wheel-of-fortune | Day 4 | Discovered – currently not indexed | | | | | | | | | | N | In Discovered export 2026-05-25 |
| 12 | https://www.tidesofknowing.com/repeating-card-meanings/the-chariot/ | the-chariot | Day 4 | **Verify in URL Inspection** (absent from Discovered export 2026-05-25; may be Indexed or other bucket) | | | | | | | | | | N | Run Inspection before Day 4 submit; paste exact bucket into “Current GSC bucket” |

### Monitoring field definitions

| Field | Source / how to fill |
|-------|----------------------|
| **Indexed** | URL Inspection: “URL is on Google” → `Y`; otherwise `N` |
| **Impressions** | GSC Performance → filter Page = exact entity URL → date range (e.g. 28d) |
| **Clicks** | Same Performance view |
| **Average position** | Same Performance view (blank if no data) |
| **Current GSC bucket** | URL Inspection primary reason (e.g. Indexed, Discovered – currently not indexed, Crawled – currently not indexed, Unknown) |
| **Manually requested** | `Y` after Request indexing clicked; else `N` |

## GSC procedure (per URL)

1. Search Console → **URL inspection** → paste entity URL.
2. Confirm **User-declared canonical** = same entity URL.
3. Record **Current GSC bucket** (before submit if not already logged).
4. **Request indexing** once.
5. Log submit date/time in the table above; set **Manually requested** = `Y`.
6. On recheck dates, re-inspect only — do not re-request before 14 days unless status regresses with evidence of a site bug.

## Wave 0 operator notes (hub)

Record Wave 0 outcomes here for traceability (does not replace a separate Wave 0 log if you create one later):

| Item | Value |
|------|--------|
| Hub URL | https://www.tidesofknowing.com/repeating-card-meanings/ |
| Hub GSC status (pre/post Wave 0) | _paste from URL Inspection_ |
| Hub request indexing | _Y / N / date_ |
| Sitemap resubmitted | _Y / N — https://www.tidesofknowing.com/sitemap.xml_ |
| Chariot inspection-only (Wave 0) | https://www.tidesofknowing.com/repeating-card-meanings/the-chariot/ — status: _paste_ (no request indexing in Wave 0) |

## URLs submitted (rollup)

_Update after each cadence day._

| Submit date | URLs submitted (count) |
|-------------|--------------------------|
| Day 1 (2026-05-25) | _pending — fool, magician, death_ |
| Day 2 | |
| Day 3 | |
| Day 4 | |

**Total Wave 1 queue:** 12 URLs · **Submitted so far:** 0 / 12 · **Day 1 today:** 0 / 3

## Completion criteria

- All 12 rows have submit date/time and **Manually requested** = `Y`.
- Recheck 1 completed for each URL (≥14 days after its submit).
- Tracker CSV aligned with final **Current GSC bucket** and **Indexed** per row.
- No architecture, canonical, sitemap, or routing changes made as part of this wave.
