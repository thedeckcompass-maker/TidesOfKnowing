# Discreet Community Report menu — live

Owner authorised this single-component interface change on 19 November 2026. Report is now inside a small, initially collapsed **⋯** menu on each discussion, comment and nested comment. Scribes remain visible outside the menu. Native disclosure controls support keyboard and touch use; narrow-screen positioning stays within the contribution width.

Only application source changed: `src/components/studio/CommunityTargetActions.astro`. The entire Scribe form and Report form are byte-for-byte unchanged; submission scripts, endpoints, target IDs, permissions, moderation/task rules, retention and database contracts are unchanged. No database operations, live reports/Scribes, moderation actions or notifications were submitted. No accounts, content or entitlements were changed by this release.

Worker version: `b21d8f54-fc4a-43ae-9d8d-4d47cc705a38`; deployment `09b2bcd7-b7b3-4144-88a2-3d687956bd42`.
Pages Production: `ed017d79-f2a6-492c-ae0d-aa598f67de82`.

Four compiled-page/client/API test groups pass for questions, comments and nested comments, including menu placement/default closed state, visible Scribes, correct report and Scribe submissions, report replay protection, and origin/feature guards. This used synthetic local fixtures; no browser automation or live creator submissions. Owner visual acceptance remains separate.

Live checks passed for unchanged production bindings, Pages configuration, domains, all 13 Worker routes, existing website/DCS pages and canonical URLs. Community external CSS is verified under both public and scoped asset paths. Astro embeds the small menu CSS in the discussion-page output; its inline content, frozen server manifest and active deployment identity were verified. The first asset assertion incorrectly expected a separate menu CSS file; the checker was corrected without changing the application. Public assets from the preceding release are retained. Billing/video providers remain disabled.

Evidence and next-build baseline: `.build-temp/dcs-report-menu-20261119/` (source association, UI tests, package receipts, deployment receipts, live verification and menu asset hashes). All other source is copied from the accepted Inbox clarity baseline; the packet is excluded from Git.

Guarded rollback: `node scripts/dcs-report-menu-production-release.cjs rollback` restores Pages `b0127924-9e0d-4b49-927e-b5d953aca620` and Worker `1024b943-e0ec-489a-8a19-0da3a0fd00ca` after verifying current identities. No database rollback or retention change is needed.
