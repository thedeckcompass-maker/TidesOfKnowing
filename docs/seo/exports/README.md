# GSC exports (local)

Place Google Search Console **Pages → Not indexed → Export** CSV files here:

```
gsc-not-indexed-YYYY-MM-DD.csv
```

Example:

```bash
node scripts/analyze-repeating-card-gsc-export.mjs docs/seo/exports/gsc-not-indexed-2026-05-25.csv
```

If exactly one dated file exists in this folder, you can omit the path:

```bash
node scripts/analyze-repeating-card-gsc-export.mjs
```

Outputs:

- Console classification summary
- `docs/seo/baselines/gsc-baseline-YYYY-MM-DD.md`
- Optional: `--update-tracker` (updates presence only — review before treating as “indexed”)

CSV files in this folder are gitignored; baseline markdown reports are committed.
