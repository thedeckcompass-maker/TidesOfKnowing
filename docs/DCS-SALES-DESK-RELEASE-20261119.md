# Pricing and seven-card Creator's Desk — live

Owner authorised this coordinated Production release on 19 November 2026. Completed and read-only verified at **18:27:32 UTC**.

## Released scope

The pricing/sales changes described in `DCS-SALES-PATHWAYS-CANDIDATE-20261119.md` are now live, including “written review”, `/ 12 months`, incremental Develop benefits, comparison links and the revised section order. Their three presentation source files match the reviewed candidate byte-for-byte.

The Creator's Desk now always includes its seventh **Editorial Support** card at `/studio/editorial-support/`, including for ongoing complimentary Develop workspace access without programme-service records. Previously the `not-included` service state removed that navigation card. Only the navigation condition changed: service reads, service-state calculation, account checks, permissions and allowances are unchanged. No services or entitlement records were invented.

Exactly four application source files differ from the accepted Report-menu baseline:

- `src/data/studio/approved-public/presentation.json`
- `src/data/studio/creator-guidance.mjs`
- `src/styles/dcs-approved-public.css`
- `src/lib/studio/creatorDesk.ts`

All 951 accepted source-file hashes were verified before the isolated build. The separate pending local authentication-message change was excluded. The extensive uncommitted working tree was preserved; no commit, reset or clean.

## Live identifiers

| Item | Released identifier |
| --- | --- |
| Worker | `tidesofknowing-consolidated` |
| Worker version | `f1cfb93f-0c05-41f2-a982-1f6852aeb1fa` |
| Worker deployment | `60b0f010-5467-48c5-90e5-0adecb1cb4b1` |
| Pages project | `tidesofknowing`, Production `main` |
| Pages deployment | `77a00f29-75a1-44b9-a147-76c25d7d1df3` |
| Production Supabase binding | `vbdqvjvhjleqdadiiqjx`, unchanged |

Worker activated first, verified against the preceding compatible Pages package, then matching Pages deployed and verified. There are no API or database contract changes between these versions.

## Verification and safeguards

- Five focused Creator's Desk tests passed, including all seven names/destinations in all four service states, explicit ownership filters, missing-provider behavior and no fabricated services.
- Six compiled pricing/landing/FAQ renders passed, covering anonymous and signed-in destinations, copy, section order and canonical URLs.
- Three compiled authenticated Desk renders passed: empty programme-service records, Develop records and unavailable service lookup. Each renders exactly seven links. Suspended-account denial remains intact. These used local synthetic fixtures with external fetches forbidden.
- Isolated Astro production build and exact-package Wrangler dry run passed.
- Fresh preflight confirmed the expected prior deployments, unchanged Pages configuration, effective Production bindings, billing disabled, video providers absent, existing pages and all 13 route assignments.
- Staged Worker binding and runtime fingerprints matched the preceding live version before activation. Post-release readback confirmed both deployment identities, unchanged Pages configuration/domains, unchanged Worker bindings/runtime and all 13 routes.
- Live HTTP/DOM checks confirmed exact approved pathway-card and Realise markup, all four comparison prices, inheritance, links and updated FAQ wording. Homepage, articles, training, repeating-card example, registration and Studio routing passed. Existing page titles/canonical URLs and published CSS/portrait assets were verified.
- Payments remain disabled. Video, recording and transcription were not activated. No database SQL, accounts, grants, services, content, moderation actions or notifications were created or changed. Protected Preview was untouched.

No Computer Use or Windows browser automation was used. Live owner-authenticated visual acceptance remains for the owner: refresh `/studio/creators-desk/` and inspect all seven cards, then open Editorial Support. No owner cookies/session were borrowed; no live project or form submission was used as a test.

## Evidence and next-build baseline

Use `.build-temp/dcs-sales-desk-20261119/build` as the accepted source baseline for the next build. Packet directory `.build-temp/dcs-sales-desk-20261119` contains source association, scope verification, compiled tests, dry-run receipt, manifests, preflight/staging/deployment receipts and both read-only live-verification reports.

Worker package: `.build-temp/dcs-sales-desk-20261119/worker`; manifest SHA-256 `630f9c8af87a755ebb3835385e4e8a10aa403f43b9f5be841fdfa9e8a52a7326`.

Pages package: `.build-temp/dcs-sales-desk-20261119/pages/public`; manifest SHA-256 `91c4622b8d0a8f2086614388ee6b269e4dcc05000a5e0c111bf84e46cfac7f23`.

The connector repeatedly returned an authentication request after acceptance. The established secure local Wrangler process completed deployment; credential values and raw CLI deployment output were suppressed.

## Guarded rollback

`node scripts/dcs-sales-desk-production-release.cjs rollback`

The procedure verifies current identities and restores Pages `ed017d79-f2a6-492c-ae0d-aa598f67de82`, then Worker version `b21d8f54-fc4a-43ae-9d8d-4d47cc705a38`. Both rollback targets remain recorded and executable independently through the existing Cloudflare Pages rollback and Worker version-deployment APIs. No database rollback is required. Rollback was prepared, not executed.
