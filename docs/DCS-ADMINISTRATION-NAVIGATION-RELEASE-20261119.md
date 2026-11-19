# Administration dropdown — live

Owner requested access to DCS administration from the logged-in account header instead of a single Administration link leading only to Reading Requests.

One application component changed: src/components/community/MemberWorkspaceHeader.astro. Administrator-only native details/summary disclosure now offers:

- Tides administration — Reading requests: /ask-leilia/admin/.
- DCS administration — Community discussions and moderation: /ask-leilia/admin/studio-community/.

The current destination is marked. Escape closes the disclosure and returns focus; outside click closes it. Destination selection retains normal navigation and closes the existing mobile drawer. Mobile panel is inline within that drawer. Styles are scoped to the header, with readable dark text, focus outlines and touch-friendly destinations. Existing role guards, account routes and logout are unchanged. No new hub, backend route, permission, database operation or account/content mutation.

## Deployment

- Worker version: 4655b843-09c9-41b9-90da-a2146b6445b8.
- Worker deployment: d7aa859c-2d08-4838-9049-7daea5d76e22.
- Pages Production: 4fb2025e-d9fc-40b8-ae6e-48e2d724097b; completed 2026-11-19T06:09:25.305Z.
- Worker manifest SHA-256: f4c247a3f28e1059cfbc4c703febb8a9ae9c4c7f1bc9fbf5bc6554b47dc83a5c.
- Pages manifest SHA-256: b08528831a55e98931e8934dc0007fb2be6dbe62475ac666d0216fd5266f6af9.

Packet: .build-temp/dcs-administration-navigation-20261119. Source association confirms exactly one changed component against the deployed Community hierarchy snapshot. Existing public assets preserved byte-for-byte; scoped route adapter unchanged.

navigation-tests.json: six passing groups against compiled SSR account pages and DOM-only interactions: destinations/native disclosure markup; admin-only visibility and anonymous redirect; active-route marker; Escape/focus/mobile behaviour; outside/destination click; responsive contrasting styles. Native summary keyboard activation relies on standard browser details behaviour. No browser automation or authenticated owner-session navigation was performed.

live-navigation-assets.json verifies stylesheet bytes and identifies the compiled inline header script. live-verification.json records current pair, preserved Pages settings, Worker bindings/runtime, thirteen routes, public page continuity and inactive billing/video/schedules. No SQL or Supabase configuration call was used for this navigation change. Authenticated visual/real-navigation acceptance remains owner verification.

Guarded rollback: `node scripts/dcs-administration-navigation-production-release.cjs rollback`, restoring Pages f93d03a7-42d6-486f-bef8-3c021d928b7f then Worker c6795241-1903-406d-b4d4-67b2b37ddbff with exact current-ID checks. No database rollback applies.

Owner next action: reload the signed-in account page, open Administration, then choose DCS administration. Tides administration continues to open Reading Requests. Community hierarchy/filter work and its database contracts remain unchanged.
