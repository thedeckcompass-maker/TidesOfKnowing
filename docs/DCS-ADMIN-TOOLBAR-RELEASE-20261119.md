# Community admin toolbar alignment — live

Owner requested Attention view, Show audience and Show pillar in one desktop row, plus a distinct confidential editorial button to the right of Discussions, Reports and Moderation history, visible only for the owner login.

Two application files changed against the deployed Administration-navigation snapshot:

- src/pages/ask-leilia/admin/studio-community.astro: all three existing selects placed in one grid, preserving their IDs and handlers. Removed the duplicate editorial header link. Fourth navigation button appears only after the existing communityAdminStore assigned-staff identity check succeeds; this uses the verified active assigned Leilia administrator, not an email/display-name guess or a broad admin role alone.
- src/styles/dcs-community-admin.css: three equal desktop filter columns; four navigation columns with extra space for the confidential link; modest responsive font sizing with a .875rem floor; plum/white confidential button; narrower-screen wrapping/stacking. Styles remain scoped to this page.

The existing /studio/editorial/ destination independently checks the signed-in active administrator and store.isStaff. That route, staff assignment, backend permissions, filters, hierarchy and moderation logic remain unchanged. No database operation, account grant, configuration change, moderation, deletion or notification send was performed.

## Release

- Worker version: a475afb8-94bc-4109-b24a-f665626d0a84.
- Worker deployment: 158518f8-2380-44d7-80b7-4e804a67ff98.
- Pages Production: dd8d459b-40e2-42c8-9b13-aac8aeea9b33; completed 2026-11-19T06:19:30.117Z.
- Worker manifest SHA-256: 284402b62b1949fc31b23fbe5596595873b998b059b22a65e4e7cfdcd1f97195.
- Pages manifest SHA-256: 55001bc2c8de560f2d320118369bbd228280a8979173af6df0fa857441f808bd.

Evidence packet: .build-temp/dcs-admin-toolbar-20261119. Source association confirms exactly two changed files. Existing public asset bytes and scoped adapter preserved. Guarded release verifies existing Pages settings, Worker bindings/runtime and thirteen route assignments.

toolbar-tests.json: five passing groups against compiled SSR. Verifies left-to-right filter structure/IDs, fourth confidential button/no duplicate link, absence for an unrelated administrator and non-admin denial, desktop/mobile rules and 9.82:1 confidential button text contrast, plus unchanged identity guard, destination permissions and filter/moderation source. No real sessions, external requests, browser automation or production mutations.

live-toolbar-assets.json verifies exact stylesheet bytes and anonymous admin denial. live-verification.json verifies serving identities/configuration/routes, public-page continuity and inactive billing/video/schedules. Actual owner visual acceptance remains the owner's signed-in reload; numerical contrast/SSR checks are not browser visual acceptance.

Guarded rollback: node scripts/dcs-admin-toolbar-production-release.cjs rollback. Restore Pages 4fb2025e-d9fc-40b8-ae6e-48e2d724097b then Worker 4655b843-09c9-41b9-90da-a2146b6445b8 under exact current-ID checks. No database rollback applies.

Owner next action: reload https://www.tidesofknowing.com/ask-leilia/admin/studio-community/ using the existing assigned Leilia administrator login.
