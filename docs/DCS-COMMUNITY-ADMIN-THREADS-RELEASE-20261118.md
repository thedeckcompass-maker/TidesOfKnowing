# Community hierarchy and attention views — deployed

Owner authorised the thread hierarchy, attention filters, updated moderation controls, narrow staff-read extension and live release. Reviewed/needs-response tracking remains deferred. No content moderation, deletion, account grant or notifications were performed by this operation.

## Result

The admin page separates Original question, Comment and Nested reply, with public usernames, timestamps, parent context and visibility. Nested replies are indented beneath their parent. Hidden text is collapsed into an expandable preserved-text row; staff retain controls on every authorised descendant even when the question or parent is hidden. Hide entire discussion has an explicit whole-thread warning; Hide this comment explains its narrower scope.

Views: All conversations, Reported (open reports), @Leilia mentions, Scribed contributions and Hidden items. The selected view is remembered locally per staff identity. There is no unread, Reviewed or answered-state inference. Pillar bracket counts are matching questions/comments, not raw report totals or unread messages. Multiple reports on one comment count as one matching item, with its report total shown separately. Parent context is retained for matching nested replies; unrelated general comments are omitted from attention views, with Open full discussion available. Hidden view retains descendants as context for managing hidden parents.

Successful moderation verifies its receipt against the authorised current feed/audit, then refreshes timestamps, fresh command keys, Hide/Restore choices, states, attention counts and reports/history without a reload. Concurrent submits are blocked. Uncertain or saved-but-unverified outcomes remain blocked from replay. Other drafts/reasons and content are preserved. Newly saved staff replies retain existing controls and update counts; their link loads full comment actions.

Eight application source files changed against the accepted submission-fix snapshot: CommunityAdminItem.astro, CommunityModeration.astro, communityAdminView.ts, hostedSupportProvider.ts, studio-community.astro, studioCommunityAdminLayout.ts, studioCommunityAdminReply.ts and dcs-community-admin.css. Existing shared member write paths, route adapter and public static assets remain unchanged.

## Database

Production: vbdqvjvhjleqdadiiqjx. Installed history: **20261119055404 — dcs_community_admin_threads**.

Canonical SQL: supabase/migrations/20261119055404_dcs_community_admin_threads.sql.
SHA-256: **811d0fcf610a03f5a3aa28b89dbd9ba82acb93c8f344013560e4a3637f9187a1**.

The official CLI generated the local migration; its filename was aligned to the connector's actual installed history version. The original CLI-generated SQL is preserved in the ignored database evidence packet. No second installation occurred.

Only public.studio_dcs_community_admin_read_v1() was replaced, adding contract_version=2, parent_reply_id, public author names, question timestamps, mention booleans and per-item open-report/Scribe counts. Counts cover all linked reports rather than only the latest-100 display window. No tables, row content, RLS, roles, grants or write functions changed.

Pre-install definition MD5: 825b8b709beebe53617eee993af886d1.
Installed definition MD5: 61f9781dc10229e981b2a09fdad0f11f.
Function owner remains postgres, search_path empty and ACL `{postgres=X/postgres,authenticated=X/postgres}`. Assigned active administrator and existing room/QA predicates are preserved. Full checked public/studio_private table-grant and RLS fingerprints match; moderation/report/Scribe definition and ACL fingerprints also match.

Database evidence: .build-temp/dcs-community-admin-threads-20261118. The isolated database test uses schema-only synthetic records and the unchanged Production function definitions. Six groups pass: guarded install/ACL, anonymous/member/unrelated-admin denial, hierarchy/public authors/mentions and totals beyond 100, Scribe give/withdraw/replay/self-denial, nested-reply reporting/replay and content-preserving read-function rollback/reinstall. These are isolated Postgres role/claim tests, not genuine Production Auth sessions. A local missing statement terminator was caught and corrected before any Production installation.

## Live application pair

- Worker version: c6795241-1903-406d-b4d4-67b2b37ddbff.
- Worker deployment: 0cfaf284-63b1-4bb9-8cbb-2149e383dc07.
- Pages Production: f93d03a7-42d6-486f-bef8-3c021d928b7f; completed 2026-11-19T05:59:06.348Z.
- Worker manifest SHA-256: dfb9fed31d92b0fa9e50551da948ad91638855cc09d04d8a78400e472f0b5045.
- Pages manifest SHA-256: be0899270a3ea80d833544697fe01b96c97422bf0517d68d4b5bf56e3e8a96c2.

Final application evidence: .build-temp/dcs-community-admin-threads-20261118-v2. The earlier candidate e4f0374f-90d7-49ae-98a1-925232054d6a was staged only, never activated; the final candidate adds the selective-view refinement for tagged questions.

layout-tests-final.json has eight passing groups against the compiled page and DOM-only interactions: access denial; original/parent/nested hierarchy; attention filters/counts/preferences; hidden-parent management and navigation; immediate verified Hide/Restore; fresh revision/key; whole-question hide warning with descendant controls retained; uncertain-result blocking. Browser named action-field override remains modelled, and moderation posts to the fixed endpoint. No browser automation or real mutations.

live-admin-assets.json verifies exact live CSS/JavaScript hashes and anonymous admin denial. live-verification.json records production pair/configuration/routes, representative public DCS/Auth/non-DCS pages and disabled billing/video/scheduled operations. Existing static assets, including all repeating-card HTML, are preserved byte-for-byte in the package. Owner visual and real-session moderation verification remain separate; the release did not exercise live hide/report/Scribe writes.

data-preservation.json matches the immediate pre-install baseline exactly for post/reply hashes, account identity/confirmation/creation digest, profile digest, access/grant digests, existing report/audit hashes and notification count. Owner changes made before the baseline (one hidden discussion and one hidden comment) remain preserved. The operation did not change any item's state.

## Recovery and next action

Guarded application rollback: `node scripts/dcs-community-admin-threads-final-production-release.cjs rollback`, restoring Pages b11bb4a0-2424-4889-898a-0b646f943acc then Worker ba241bac-c40f-4f95-8f80-4a8ee7017181, with exact current-ID guards and preserved bindings.

The additive read extension is compatible with the previous application and can remain during application rollback. If its restoration is separately required, docs/DCS-COMMUNITY-ADMIN-THREADS-RECOVERY-20261118.sql guards the current definition and restores only the original function. Restore the application first; restoring the feed first would make the new version-2 provider unavailable. No content/database dump restore is needed. Function restoration/reinstall was rehearsed only in isolation; no Production recovery was executed.

Owner next action: reload https://www.tidesofknowing.com/ask-leilia/admin/studio-community/ and review All conversations, then switch attention views as desired. No Reviewed workflow or automatic notifications were introduced.
