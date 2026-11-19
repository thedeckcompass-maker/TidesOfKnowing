# Production onboarding repair — deployed, email dashboard work pending

Recorded 19 November 2026 UTC (18 November in Mérida). Authoritative workspace: D:\Projects\Tides-of-Knowing\workspace. Owner authorised targeted registration/authentication repair and controlled deployment. No account, entitlement, database schema, commercial term or provider activation changes were performed.

## Demonstrated causes and corrections

The deployed simplified account generation had replaced the previously approved comprehensive form. Recovered the approved first name, last name, email, independent Community username, password, confirmation and remember-me fields from the preserved 10 November registration reconciliation packet. New signup private Auth metadata retains first_name/last_name/display_name and requested username. Password sign-in is primary; optional email-link sign-in cannot create accounts. Confirmed active identities claim public usernames through the existing user-scoped RPC. Session/30-day persistence, validation, confirmation and password recovery are restored without weakening identity checks.

Account-only high-specificity styles replace pale auth text/controls with the approved paper/gold/dark teal palette. Numerical contrast checks passed (ordinary body 11.32:1; headings/links 6.41:1). HTTP/DOM/CSS checks are not owner visual acceptance.

The owner identified the affected existing email button as `utzcmbidotxgmulguzxo.supabase.co/auth/v1/verify`: the protected Preview project, not Production. This establishes that email's issuing project; its query, exact historical redirect and original signup page were not captured. Do not claim a broad Production Access misconfiguration. Current anonymous Production auth pages are public, while the private Preview still redirects to Cloudflare Access. No Access policy changed.

Production Auth producers now pin the public Production callback at `https://www.tidesofknowing.com/auth/callback/?redirectTo=...` when using Production Supabase. The owner confirmed Production's Magic Link template already uses `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email` in button and fallback. The ampersand is correct following the supplied query. Actual callback code accepts and verifies type=email and recovery; PKCE remains supported. Never substitute ConfirmationURL merely by assumption.

## Exact live pair

- Worker version: `cdb9c852-fb30-46f1-9a2a-733acb982d98`; deployment `e77388af-2e24-4d35-8b3e-ea797eb1ca7a`.
- Pages Production: `0ad24b32-d1a0-4a83-831d-c9f7970520cc`, completed 2026-11-19T02:15:09Z.
- Worker package: `.build-temp/dcs-onboarding-repair-20261118/worker`; manifest SHA-256 `2c86ec2ef4d1dc17b24e558f1c0eb9a53faa65d0d3b0fac29b032c3c0f7b9125`.
- Pages package: `.build-temp/dcs-onboarding-repair-20261118/pages/public`; manifest SHA-256 `e74b419e9fba24fbfed892a8521bc724e980aa3dbc3fded3d7d9def4e5f1d1e7`.

Sixteen source files changed; scoped release adapter dispatches eight public auth endpoints consistently. Earlier frozen candidates remain intact. Production Supabase remains vbdqvjvhjleqdadiiqjx. Thirteen routes, Worker bindings/runtime, Pages configuration and domain assignments are preserved. Billing is disabled and video/recording/transcription remain inactive.

## Verification and preservation

Evidence directory: `.build-temp/dcs-onboarding-repair-20261118` (Git ignored).

- focused-tests.json: eight passing focused groups; callback-tests.json: six cases; compiled-tests.json: seven passing checks using synthetic provider ports, no external egress/accounts/emails.
- live-verification.json and public-journey.json: published identities, homepage/articles/COMPASS/DCS landing/pricing/FAQ, comprehensive registration, login, confirmation/recovery boundaries, malformed callback and private Preview protection pass. GET only; no email requests or account creation.
- repeating-card-live.json: all 157 pages compared; zero title/metadata/canonical/structured-data/heading/link/text differences. Byte differences exist in served HTML; semantic identity is what was checked.
- data-preservation.json: nine-account identity/confirmation/creation fingerprint and all 29 checked table counts/digests unchanged from immediately before repair activation, including profiles, ownership, entitlements and Storage metadata. This does not claim full equality of Auth secrets or sessions.

Rollback is executable through `node scripts/dcs-onboarding-production-release.cjs rollback`: guards exact current identities, restores Pages `26c7b2d5-c223-48b4-af34-bf06c7f96e4d`, then Worker `1cffb084-8f75-4e5f-a4e4-83155d1d29a9`. Preserve the verified Production Supabase binding pair; do not restore unknown masked configuration values. No database rollback is part of this repair.

## Outstanding live email / owner acceptance

The available Supabase connector cannot manage Auth templates/configuration and there is no authenticated Management CLI session. No live template or Auth URL setting was edited. Prepared drafts and exact dashboard steps are in `docs/dcs-auth-email-templates-20261118/INSTALLATION.md`. The confirmed active Magic Link is already Tides-branded, with typo `Leiia Spencer`; correct to `Leilia Spencer` without changing its token flow. Confirmation/recovery active templates and non-DCS callers require targeted inspection before project-wide replacement. Site URL and full allowed redirect URLs have not been supplied; the read-only invalid-token probe accepted the public callback and defaulted to the public www homepage, which is not a full settings readback.

hello@thedeckcompass.com already exists in Production and was unconfirmed with no prior sign-in at inspection. Do not create it again or grant Develop access automatically. The presence of a password hash does not establish that the owner knows the password. After the dashboard template correction, the owner can deliberately request confirmation at `https://www.tidesofknowing.com/auth/confirm-email/`, then sign in or request password setup if needed. No message was sent by this repair. Real email delivery, successful owner confirmation/sign-in, visual acceptance and authenticated Studio use remain owner verification items. Develop entitlement is a separate action; ongoing-until-revoked preference remains recorded.
