# Repeating-card entity index monitoring

Operational runbook for the **78 canonical** repeating-card entity pages at `/repeating-card-meanings/{slug}/`. This document is measurement and workflow only — it does not change site architecture, canonicals, sitemaps, or indexation rules.

**Related files**

| File | Purpose |
|------|---------|
| [`repeating-card-index-tracker.csv`](./repeating-card-index-tracker.csv) | Per-entity indexing ledger (78 rows) |
| [`scripts/generate-repeating-card-index-tracker.mjs`](../../scripts/generate-repeating-card-index-tracker.mjs) | Regenerate CSV from ready card content |
| [`scripts/analyze-repeating-card-gsc-export.mjs`](../../scripts/analyze-repeating-card-gsc-export.mjs) | Classify GSC URL exports vs entities |

---

## 1. Purpose of the entity architecture

Tides of Knowing uses a **dual-URL** repeating-card system:

| Surface | URL pattern | Role |
|---------|-------------|------|
| **Canonical entity pages** | `/repeating-card-meanings/{slug}/` | Indexable SEO/AEO authority pages — long-form symbolic interpretation |
| **Tool deep-links** | `/tools/repeating-card-meanings/{suit}/{card}/` | Interactive UX; `rel=canonical` points to the entity URL |
| **Entity hub** | `/repeating-card-meanings/` | Crawl hub + ItemList of all 78 entities |
| **Tool hub** | `/tools/repeating-card-meanings/` | Dropdown selector (not in sitemap as deep-links) |

Google should **index entity URLs** and treat tool URLs as **alternates** consolidated via canonical.

---

## 2. Expected Google behaviour

### Healthy exclusions (not problems)

- **~78 tool deep-links** appearing as “Crawled – currently not indexed” or “Alternate page with proper canonical tag”
- Tool hub in export with low indexing priority
- Tag pages, library pagination, subscribe/thank-you omitted or lightly indexed
- New entity cluster: many pages “Discovered – currently not indexed” for **2–8 weeks** after launch while authority builds

### Problems (investigate)

- **Entity URL** with “Duplicate, Google chose different canonical” where chosen URL is **not** the entity page
- **Entity URL** with `noindex` or blocked by robots (should not happen on production)
- **Entity canonical** in HTML ≠ `https://www.tidesofknowing.com/repeating-card-meanings/{slug}/`
- Entity missing from sitemap for 14+ days after deploy
- **>30% of entities** still “Discovered – currently not indexed” **90+ days** after strengthening pass with no upward trend
- Sudden **drop** in indexed entity count week-over-week without deploy change

---

## 3. GSC status interpretations

| GSC reason (typical label) | On tool deep-link | On entity page |
|----------------------------|-------------------|----------------|
| **Crawled – currently not indexed** | Usually **healthy** (low priority / consolidated) | **Watch** — normal early; concern if persistent 90+ days on P1 cards |
| **Discovered – currently not indexed** | Often healthy | **Watch** — queue; submit P1 if 30+ days unchanged |
| **Alternate page with proper canonical tag** | **Healthy** | N/A (entity is the canonical target) |
| **Duplicate without user-selected canonical** | Investigate canonical tag on tool page | **Problem** — verify HTML canonical and internal links |
| **Duplicate, Google chose different canonical than user** | May be OK if Google chose entity | **Problem** if Google chose tool or unrelated URL |
| **Indexed** (or visible in search results) | Not the goal for tool URL | **Success** for entity |

**Important:** A “not indexed” export is a **snapshot of trouble URLs**, not the full site. Absence from that export does **not** prove indexing; use **URL Inspection** or `site:` checks for spot validation.

---

## 4. What should happen over time

| Horizon | Entity hub + P1 entities | Bulk of 78 entities | Tool deep-links |
|---------|--------------------------|---------------------|-----------------|
| **Weeks 0–4** | Discovered/crawled; some indexed | Mostly discovered/crawled | Mostly crawled-not-indexed or alternate |
| **Weeks 4–12** | Indexed; impressions may be low | Gradual indexed % climb | Stable exclusions |
| **Months 3–6** | Impressions/clicks on long-tail | Majority indexed | Remain non-indexed (healthy) |

Track **indexed entity count / 78** monthly, not total GSC “not indexed” count (inflated by 78 tool alternates).

---

## 5. Monitoring cadence

| Activity | Frequency | Owner action |
|----------|-----------|--------------|
| Update tracker CSV (`indexed`, `gsc_status`, `last_checked`) | **Biweekly** (1st & 15th) | URL Inspection sample or GSC export |
| Full GSC export classify | **Monthly** | Run `analyze-repeating-card-gsc-export.mjs` |
| Manual index request batch | **Monthly max**; only P1/P2 when justified | See §6 |
| Canonical drift check | **After each deploy** touching RCM routes | Spot-check 3 URLs (Fool, Tower, Ace of Cups) |
| Sitemap spot-check | **Monthly** | Confirm hub `0.88`, entities `0.78` on live `/sitemap.xml` |

---

## 6. Manual indexing request framework

### When manual submission is justified

Submit **only** when all are true:

1. URL is a **canonical entity** (not tool)
2. Live page returns **200**, self-canonical correct, **not** `noindex`
3. URL is in **sitemap**
4. Status unchanged **≥21 days** (Discovered or Crawled – not indexed)
5. Page is **P1 or P2** (below), or P3 with clear search demand signal

**Do not** mass-submit all 78 URLs in one day — Google treats that as noise.

### Priority waves (submit in order)

**Wave 0 — once per quarter**

- `https://www.tidesofknowing.com/repeating-card-meanings/` (hub; not in tracker CSV)

**Wave 1 — P1 (submit first; ~12 cards)**

High semantic weight, anchor-article links, strong internal links:

- `the-fool`, `the-tower`, `death`, `the-high-priestess`, `the-devil`, `the-moon`
- `nine-of-swords`, `ten-of-swords`, `ace-of-cups`, `three-of-swords`
- `the-empress`, `the-lovers`, `judgement`

**Wave 2 — P2 (~22 cards)**

Remaining **Major Arcana** not in P1, plus cups/swords cards named in editorial series:

- `the-magician`, `the-emperor`, `the-hierophant`, `the-chariot`, `strength`, `the-hermit`, `wheel-of-fortune`, `justice`, `temperance`, `the-star`, `the-sun`, `the-world`, `the-hanged-man`
- `two-of-cups`, `four-of-cups`, `five-of-cups`, `six-of-cups`, `seven-of-cups`, `eight-of-cups`, `king-of-cups`, `queen-of-cups`

**Wave 3 — P3 (remaining entities)**

All other ready minors — submit only if still not indexed after Waves 1–2 have had **30+ days** each.

### Request procedure (GSC)

1. Search Console → **URL inspection** → paste entity URL
2. Confirm “User-declared canonical” = entity URL
3. **Request indexing** (record date in tracker `manually_requested` = `Y`, note in `notes`)
4. Wait **≥14 days** before re-requesting the same URL

### Thresholds indicating a real site issue

| Signal | Threshold | Action |
|--------|-----------|--------|
| P1 entities not indexed | **0/12 indexed** after **60 days** | Audit canonical HTML, robots, Cloudflare; do not change architecture without evidence |
| Wrong canonical chosen | **Any** P1 entity | Inspect internal links pointing to tool URL as primary |
| Indexed count drops | **>10 entities** week-over-week | Compare deploy log + GSC; check accidental `noindex` |
| Tool URLs indexed **instead of** entity | **>5** cards | Verify tool `ogUrl`/canonical still points to entity |

---

## 7. Tracker CSV usage

File: [`repeating-card-index-tracker.csv`](./repeating-card-index-tracker.csv)

| Column | Meaning |
|--------|---------|
| `entity_url` | Canonical absolute URL |
| `card_slug` | Path segment (`the-fool`, etc.) |
| `suit` | Content folder (`majors`, `cups`, …) |
| `indexed` | `Y` / `N` / blank — your field verification |
| `last_checked` | ISO date `YYYY-MM-DD` |
| `gsc_status` | Paste GSC reason or `in_export` / `not_in_export` after script run |
| `canonical_correct` | Expect `Y`; set `N` if drift found |
| `sitemap_present` | Expect `Y`; set `N` if missing from live sitemap |
| `manually_requested` | `Y` / `N` |
| `notes` | Free text (wave, inspection id, etc.) |

Regenerate rows after new cards ship:

```bash
node scripts/generate-repeating-card-index-tracker.mjs
```

(Preserve manual columns by backing up CSV first, or merge — regeneration resets status columns.)

---

## 8. GSC export regex classification guide

Use in spreadsheets (Excel / Google Sheets) on a **normalized URL** column (`https://www.tidesofknowing.com/.../` with trailing slash).

### Normalise first

```
=LOWER(TRIM(SUBSTITUTE(A2,"http://","https://")))
```

Ensure path ends with `/` before matching.

### Classification formulas (conceptual)

| Bucket | Regex (path after host) | Notes |
|--------|-------------------------|-------|
| **Entity canonical** | `^/repeating-card-meanings/[^/]+/$` | **Important — track in CSV** |
| **Entity hub** | `^/repeating-card-meanings/$` | Hub; Wave 0 requests |
| **Tool deep-link** | `^/tools/repeating-card-meanings/.+` | **Healthy alternate** (~78) |
| **Tool hub** | `^/tools/repeating-card-meanings/$` | Interactive hub |
| **Tag** | `^/tags/[^/]+/$` | Often crawled-not-indexed |
| **Library pagination** | `^/articles/(page/\|oldest/\|series/)` | Low priority |
| **Article** | `^/articles/[^/]+/$` | Editorial |
| **Blog / Field Notes** | `^/blog/` | |
| **Utility** | `^/(subscribe\|contact\|privacy\|terms\|media\|compass\|practice)/` | Mixed intent |
| **Other tools** | `^/tools/` | Excluding repeating matcher above |

### JavaScript (script) equivalents

The repo script [`scripts/analyze-repeating-card-gsc-export.mjs`](../../scripts/analyze-repeating-card-gsc-export.mjs) implements the same buckets for batch analysis.

```bash
node scripts/analyze-repeating-card-gsc-export.mjs path/to/gsc-pages.csv
node scripts/analyze-repeating-card-gsc-export.mjs path/to/gsc-pages.csv --update-tracker
```

**Export tip:** In GSC, use **Pages** → filter **Not indexed** (or per-reason) → **Export**. Name files with date: `gsc-not-indexed-YYYY-MM-DD.csv`.

---

## 9. Canonical drift check (post-deploy)

Spot-check these three URLs in production view-source:

1. `https://www.tidesofknowing.com/repeating-card-meanings/the-fool/`
2. `https://www.tidesofknowing.com/repeating-card-meanings/the-tower/`
3. `https://www.tidesofknowing.com/tools/repeating-card-meanings/majors/the-fool/`

| Page | Expected `rel=canonical` |
|------|--------------------------|
| Entity | Self: `…/repeating-card-meanings/{slug}/` |
| Tool | Entity URL (not tool URL) |

Also confirm hub link in header/footer still points to `/repeating-card-meanings/`.

---

## 10. Quick reference — architecture frozen

Do **not** in this monitoring phase:

- `noindex` tool pages
- Change canonical targets
- Remove entity or tool routes
- Rebalance sitemap without a measured regression

**Do** document anomalies in tracker `notes` and escalate only with evidence from §6 thresholds.

---

## Revision log

| Date | Change |
|------|--------|
| 2026-05-25 | Initial monitoring workflow (post indexing-strengthening deploy `3cd0ead`) |
