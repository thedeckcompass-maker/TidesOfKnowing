# Community administration view corrections — live

Owner authorised the attention/completed labels, pillar filtering and counts, and a compact Actions menu adjustment. Released 19 November 2026. No content, account, entitlement, task-history, moderation-policy or permission changes.

## Changes

- Prominent **Needs attention** and **Completed** buttons; **Hidden content** and **Moderation history** remain separate. View headings explain that opening is not completion and history is not outstanding work.
- The existing server-side read RPC now filters moderation history by pillar. Pillar counts match the current view and its filters, rather than counting only unread contributions. Counts ignore the selected pillar itself so all eight choices remain informative; the selected list and total use that pillar. Attention includes opened work and open reports. History counts actions; Hidden content counts contributions.
- Existing confirmed actions reload the current view, updating rows and counts. Completion moves tasks to Completed; hiding removes content from the visible attention list without manufacturing completion. Restoring unfinished work returns it to attention. Reports still require explicit Hide or Dismiss with a reason; replying does not resolve them. Scribes create no tasks. No new moderation rules or Reviewed workflow.
- In preserved discussion details, Actions sits .75rem below the contribution heading/text. Preserved hidden text is inside that same menu. The menu opens beside the button on desktop and below on narrow screens. Original questions and nested comments keep separate menus and targets.

Only four application files differ from the immediately preceding accepted retention build: the admin page, its stylesheet, CommunityInboxActions and CommunityInboxThreadItem. No new client script, runtime dependency or deployment configuration.

## Deployment and database

- Production Supabase: `vbdqvjvhjleqdadiiqjx`.
- Migration: `supabase/migrations/20261119091106_dcs_inbox_pillar_views.sql`.
- SQL SHA-256: `98cd249c9dbd44aaee285afc844ac2362f482afcfda41087ad1fd9e8dfe44937`.
- Migration history: `20261119091106 — dcs_inbox_pillar_views`. The CLI-created original is retained in ignored evidence; filename aligned to installed history without changing SQL bytes.
- Only `public.studio_dcs_inbox_read_v1(jsonb)` was replaced. A pre-install definition checksum prevents applying against an unexpected version. Owner postgres, empty search path, SECURITY DEFINER and ACL `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` remain unchanged; the assigned-recipient guard still applies.
- Worker version: `1024b943-e0ec-489a-8a19-0da3a0fd00ca`; deployment `b6aabc41-747c-4344-b8f6-deb2503deec8`.
- Pages Production: `b0127924-9e0d-4b49-927e-b5d953aca620`.
- Worker and Pages config, bindings, domains, all 13 routes, billing/video disabled status and public static assets preserved. Production database identity unchanged; protected Preview untouched.

## Verification

- 24 isolated PostgreSQL test groups pass, including opened outstanding counts, reports, completion/hiding refresh semantics, all eight pillars in all four views, filtered counts, 25-row pagination, permission denial and targeted recovery.
- 11 compiled-page/DOM test groups pass, including clear view labels, hidden-text menu grouping, narrow-screen CSS fallback, guarded reply/moderation submissions and the browser named form.action regression.
- 32 fresh Production read-only role-context checks pass: every pillar/view row belongs to its requested pillar and its total equals the corresponding count. The Visual World history is empty; Foundation history retains 13 actions. No synthetic records or moderation writes were made in Production.
- Pre/post-install and post-deployment fingerprints match for all three discussions, six replies, accounts, stable profile fields, access, grants, reports, moderation actions, tasks, task events, per-admin read state, retention events and RLS policies. Notifications remain zero.
- Daily retention Cron and Keep protections remain unchanged. The preserved test records remain excluded from tasks/counters and protected from cleanup; history remains available.
- Live public-page, canonical URL, editorial asset and route/configuration checks pass. New admin CSS is verified against the packaged hash. Signed-out admin access remains deliberately 404, matching the existing application guard. An initial checker incorrectly expected a login redirect; its assertion was corrected, with no application change.
- Browser automation was not used. Authenticated owner visual acceptance and actual owner moderation remain for the owner; local tests do not claim genuine Production Auth mutation acceptance.

Evidence and authoritative frozen next-build baseline: `.build-temp/dcs-inbox-clarity-20261119/` (`source-association.json`, database/UI tests, install verification, preservation before/after, package receipts, deployment receipts, live verification and admin asset check). Private evidence directory is ignored by Git.

## Recovery

Use the guarded `scripts/dcs-inbox-clarity-production-release.cjs rollback` to restore Pages `d642eaff-b9e9-4d11-b510-070d6e2fd579` and Worker `603aa287-29b3-44e8-a94c-b02526cc85c4`. It checks current deployment identities before rollback. Database filtering remains compatible with that application pair.

If the read-function correction itself must be reverted, the exact previous definition and checksum-guarded recovery are in `supabase/rollbacks/dcs_inbox_pillar_views.sql`. Execute in a transaction after checking the active definition. The recovery was tested locally and preserves content, task records and audit history. Do not run the older broad Inbox recovery packet for this targeted release. Do not stop or alter the unchanged retention job as part of this view-only rollback.

Owner entry: https://www.tidesofknowing.com/ask-leilia/admin/studio-community/ . Reload the signed-in page to load the new views and stylesheet.
