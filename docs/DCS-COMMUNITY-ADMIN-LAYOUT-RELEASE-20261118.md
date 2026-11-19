# Community administrator layout — live

Released 18 November 2026, approximately 11:02 p.m. Mérida (Pages completed 2026-11-19T05:02:17.489Z). Owner authorised only the Community administration layout correction and its live deployment. Earlier instruction to hide three discussions remains a separate supported administrator action; this release did not execute it.

## Changes

Five source files only, compared with the previously accepted onboarding source snapshot:

- src/pages/ask-leilia/admin/studio-community.astro: side-by-side audience/pillar filters; eight desktop pillar buttons, one selected pillar displayed; visible item-level moderation; reports and audit tables with target navigation and compact expandable detail.
- src/components/studio/CommunityModeration.astro: visible Hide/Restore/Lock/Unlock buttons as permitted by existing state; reason/report/explicit confirmation panel opens after choosing an action. No delete option or privilege expansion.
- src/scripts/studioCommunityAdminLayout.ts: pillar/report filtering, target reveal, existing moderation endpoint payload, receipt and authorised readback verification, no automatic retries. Saved or uncertain forms remain blocked until refresh. No automatic hide, email or notification request.
- src/scripts/studioCommunityAdminReply.ts: retain existing moderation forms and unsent reasons after saving a reply; newly saved comments provide a refresh link for their actions. This script is used only on this page.
- src/styles/dcs-community-admin.css: styles scoped under the admin page ID; dark text on warm paper/white, contrasting controls/focus; eight desktop pillars, four/two on narrower screens; scrollable tables.

Pillar numbers are explicitly **open reports needing review**, filtered by audience. No unread-comment state exists in the supplied contract; counts do not invent one. Each pillar also shows discussion count. Reports default to open, with all/actioned/dismissed filters; history remains read-only. Report links reveal the target pillar and item, including reply-only reports.

The current data has zero open reports, three published discussions and six published comments. All remain stored and published after this deployment. Accounts are never treated as disposable because they authored tests. Moderation reasons, existing RPC permissions, state checks and restoration/audit semantics remain unchanged.

## Deployment and rollback

- Worker version: b88436e4-b10a-46cd-82fe-3aae7ca00977.
- Worker deployment: 23194c80-db42-475d-baf7-05703f2f7aae.
- Pages Production: d37de523-7af6-4be2-b501-a090962fa637.
- Worker manifest SHA-256: 9fd81c6a4c24c00d70568f968d2454688f0e1a28e79973d7b8c5f3993282cde5.
- Pages manifest SHA-256: d02404de99941ddf4ee2293a1d29ed4cb855bb3dc5fb89facfaec3bb36acd317.

Evidence/packages: .build-temp/dcs-community-admin-layout-20261118-v2. Existing static assets are preserved byte-for-byte, new hashed assets added, existing scoped adapter unchanged. Production Supabase, encrypted secrets, runtime settings, Pages configuration/domains and all thirteen routes are unchanged. Billing/video/recording/transcription remain inactive. No database SQL writes, migration, entitlement grant, account creation or notification send occurred.

Guarded rollback command: node scripts/dcs-community-admin-production-release-v2.cjs rollback. It verifies the current release IDs, restores Pages 0ad24b32-d1a0-4a83-831d-c9f7970520cc then Worker cdb9c852-fb30-46f1-9a2a-733acb982d98, preserving Production bindings. No database restoration is involved.

An earlier layout-only candidate 6908bf99-e8f2-4bce-88eb-e0bf67da32a2 was staged but never activated. It was superseded before activation to retain controls after saving a staff reply. Old packets and versions were not deleted.

## Verification and limits

layout-tests.json: seven passing groups using the actual compiled admin page with synthetic authorised/unauthorised locals and DOM-only interaction tests. Covers eight pillars, direct comment actions, reply-report counts/target navigation, explicit confirmation, unchanged moderation payload/readback, repeat-submit blocking and preservation of existing controls on staff reply save. No real sessions, browser automation, external requests or real mutations.

compiled-tests.json: existing seven Worker/Pages compatibility checks passed with synthetic bindings and external requests blocked. The compiled route manifest includes the new admin stylesheet. Numerical contrast tests pass for body, links, controls and disabled text. This is not a claim of authenticated browser visual acceptance.

live-admin-assets.json: exact CSS/JavaScript live byte hashes match the accepted package; anonymous admin page returns 404 without Community content. live-verification.json: production identities/configuration/routes and public DCS/Auth/non-DCS pages pass. repeating-card-live.json: all 157 pages retain text, links, headings, metadata, canonical URLs and structured data, with zero semantic differences.

data-preservation.json: all post/reply row hashes, existing audit/report hashes, account identity/confirmation/creation digest, entitlement/access digests and notification count match the immediately preceding baseline. Full profile digest changed during signed-in administrator activity: current Leilia profile last_seen_at/updated_at advanced at 05:02:25Z, consistent with the unchanged ensureCommunityProfile upsert. One active admin and eight active member roles remain; full profile byte equality is not claimed. No connector profile write was made.

Owner next action: reload https://www.tidesofknowing.com/ask-leilia/admin/studio-community/ and inspect the new layout. Choose Spark or Foundation to find the three test discussions. Use Hide discussion, then supply reason and confirm, for each approved target. Hiding comments individually is unnecessary when hiding their entire discussion. Owner visual/real-session action confirmation remains outstanding.
