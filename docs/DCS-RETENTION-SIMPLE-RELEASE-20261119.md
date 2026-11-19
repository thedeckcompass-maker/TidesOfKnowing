# Studio Community daily cleanup — enabled

Owner approved the simplified installation and activation on 19 November 2026, after declining the earlier uninstalled design. The overbuilt local version was archived; it was never installed in Production.

## What is live

One daily Supabase Cron job and a **Keep this discussion** button in the existing Community administration Actions menu. No new dashboard, case-management workflow or set of retention clocks was added. One private event table records Keep/release decisions and completed erasures.

- Hidden or withdrawn Studio Community content: 12 calendar months from its recorded hide/withdrawal date.
- Reported hidden content: both the hidden period and 24 months after the latest report resolution must have ended. Open/reopened reports block cleanup of the discussion and its context.
- Dismissed reports on published contributions: remove expired report details, preserve the published contribution.
- **Keep this discussion** blocks the whole discussion, its comments and reports until explicitly released. Use it for disputes, legal holds and other preservation needs. Releasing it does not restart the retention clock.
- The existing three test discussions and six comments remain protected by their explicit preservation exclusions; this release does not clear them.
- Unknown dates and unmanaged attachments are skipped. Other Tides communities, private projects, cards, accounts and entitlements are outside the cleanup scope.

Expired text, selections, report notes and copied content payloads are erased. Minimal structural rows remain so reply relationships, moderation decisions and task history continue to make sense. Completed tasks keep their original handler and completion time; removed text has a retention-removal label. Stale notification records tied to erased contributions are removed without sending notifications.

## Production result

Supabase Production: `vbdqvjvhjleqdadiiqjx`.

| Installation | Recorded version |
| --- | --- |
| Simplified retention support | `20261119084458_dcs_community_retention_simple.sql` |
| Daily schedule | `20261119084942_dcs_community_retention_schedule.sql` |

The support migration SHA-256 is `1e4d525d023869ab619d9243f12be830f4a773c34f3cd69e50cb1174cb972dab`. CLI-created files were aligned to the actual migration-history versions without changing their SQL bytes; originals are retained in ignored local evidence.

Cron job: `dcs-community-retention-daily`, job ID **1**, active, **03:17 UTC daily**, running `studio_private.community_retention_cleanup_v1()` as postgres. Each run handles at most 100 eligible records; concurrent work is skipped safely and the next run continues the backlog. The first scheduled slot after activation is **20 November 2026, 03:17 UTC**.

The initial production dry run found **0 eligible records**. An immediate verification invocation completed with **0 records erased**. All three discussions, six comments, existing accounts, stable profile fields, access/grants, reports, moderation records and notification counts matched their pre-install fingerprints. The new retention event table remained empty.

The cleanup function's execution ACL is postgres only. Anonymous users, members and the existing service executor cannot invoke it or modify its private event table. Existing owner identity checks guard Keep/release.

Worker version: `603aa287-29b3-44e8-a94c-b02526cc85c4`; deployment `1411e3cf-2247-4755-acca-4112946b6b35`.

Pages Production: `d642eaff-b9e9-4d11-b510-070d6e2fd579`.

All 13 Worker routes, bindings, domains and Pages configuration were preserved. All previous public static assets were preserved. No billing, video, account or entitlement changes occurred. The privacy page now describes active retention processing and clarifies that published contributions survive dismissal of a report.

## Checks and evidence

Seven focused isolated database scenarios passed, covering deadlines, preserved history, Keep/release, open/reopened reports, published contributions, later re-hides, unknown dates, access denial and transaction rollback on failure. These use synthetic local data; no production test accounts or contributions were created. Separate compiled-page/DOM checks covered the single menu control and matching policy wording, without browser automation.

Live checks verified the application pair, existing public pages/SEO, signed-out route protections, policy text and exact Keep-control client asset. No authenticated production Keep/release action was simulated. SQL locking is implemented; the isolated tests do not claim a separate multi-connection production concurrency trial.

Evidence: `.build-temp/dcs-community-retention-20261119/simple-database-checks.json` and `.build-temp/dcs-community-retention-20261119-simple/` (`ui-checks.json`, `database-install-verification.json`, deployment receipts, `live-verification.json`, `retention-live-check.json`, `enabled-receipt.json`). Both directories are excluded from Git and build publication.

## Stop and recovery

To stop future automatic cleanup, disable `dcs-community-retention-daily` in Supabase → Integrations → Cron, or execute only:

```sql
SELECT cron.unschedule('dcs-community-retention-daily');
```

Do not drop pg_cron or affect other jobs. Stopping a job does not reverse an already committed erasure.

If the application must be rolled back, stop this job first, then use `node scripts/dcs-retention-simple-production-release.cjs rollback`. The guarded rollback targets Worker `3ab57fa1-f92b-4207-8bc3-a07955a73de8` and Pages `739487a0-ca3c-4bb7-b45e-b8f594677385`. Retain the private retention events and existing moderation/task records. No rollback was required.

Backups have their own lifecycle. Before resuming cleanup after any database restore, reconcile the latest Keep decisions and erasure records so an older snapshot does not resurrect deleted content or lose a legal hold. There is no restore-erased-content button in this feature.
