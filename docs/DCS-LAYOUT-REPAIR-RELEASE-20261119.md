# Project creation and DCS layout corrections — live

Owner authorised implementation, testing and deployment of the three corrections in `C:\Users\DELL 7410\Downloads\Layout changes DCS 19-11.docx`. Its text and four embedded screenshots were inspected; the original document was not changed. Production release completed and read-only verified at **19:17:55 UTC on 19 November 2026**.

## Corrections

1. **Project creation:** the generic native-form draft saver and the project-specific JSON handler both attached to the same form. A regression fixture using the preceding deployed source reproduced two POST requests and a false `beforeunload` warning when the JSON handler navigated before the other handler finished. The generic saver now explicitly excludes this owned form. Its dedicated handler uses the existing shared unsaved-work guard, acknowledges only the submitted snapshot after a successful matching project response, then navigates. Unsaved, pending, failed, interrupted and newer edits remain protected. The same creation request ID is retained; no endpoint, account check or database contract changed. Recovery now includes planned card count and the existing project/task context fields.
2. **Field layout:** the new-project optional fields have spacing between adjacent field wrappers, clearance for the existing gold focus outline, and aligned label/help rows. Help controls explicitly identify their field and retain the existing field-to-help-panel ARIA associations. Keyboard-visible focus outlines and native help disclosures are retained. The spacing changes are scoped to the new-project form.
3. **DCS navigation:** the desktop and mobile headers on landing, pricing, FAQ, Realise and consultation pages now include Account and an Articles disclosure containing Field Notes. Account uses the existing signed-in account destination or the existing sign-in destination. FAQs and Pathways were removed only from these primary menus. The minimal checkout header was preserved. All page-body pathway content, anchors, comparison/detail links, FAQ content, footer links and commercial copy are unchanged.

## Live deployment

| Item | Identifier |
| --- | --- |
| Worker | `tidesofknowing-consolidated` |
| Worker version | `595c29ee-5fa8-4621-8690-bc0301c5b056` |
| Worker deployment | `7ec7eef7-e8eb-49b5-9ceb-eb1cc9f3b3d0` |
| Pages Production `main` | `92b3ed73-1c7b-4bf1-980c-352fbfacac1c` |
| Supabase Production binding | `vbdqvjvhjleqdadiiqjx`, unchanged |

Worker activated first, verified with the preceding compatible Pages package, then matching Pages deployed and both identities verified. All 13 route assignments, Pages configuration/domains and Worker bindings/runtime are unchanged. Payments, billing, video, recording and transcription remain disabled. No Production SQL, accounts, grants, projects, test records, permissions, content, emails or notifications were created or modified. Protected Preview was untouched.

Collaborate remains six group sessions; Develop remains eight, displayed as two more. All prices, other allowances and periods are unchanged. Historical/test allocations and the ongoing complimentary Develop workspace grant remain unchanged.

## Tests and evidence

- `scripts/dcs-layout-client.test.cjs`: actual old client source reproduced double submission and the false warning; current source passed one-request tests in both load orders, repeated-submit suppression, clean/saved/pending/failed/interrupted/unverified response cases, retained recovery and newer-edit protection, and field/help associations. The full shared draft guard was included in the DOM/event fixture. No browser automation or live writes.
- `scripts/dcs-layout-candidate.test.mjs`: ten compiled page renders passed, covering five public routes in anonymous and authenticated states, desktop/mobile menu destinations, native disclosure markup and default closed state. All body content and offer/API/access/guard sources were compared with the accepted baseline; only the approved headers differ in presentation data.
- Current allowance regression passed, including six/eight totals, preserved eight-session test records, attendance and remaining balances, and unchanged prices/periods. Its historical header-equality assertion was narrowed to preserve body equality while allowing the newly authorised header edits.
- Isolated Astro production build and exact-package Wrangler dry run passed.
- Fresh Production preflight and staged binding/runtime comparisons passed before activation.
- Live read-only checks passed for menus on all five routes, Field Notes and Account sign-in destinations, existing Tides pages, repeating-card example, registration/Studio routing, canonical URLs and assets.
- The three corrected client modules were fetched from both normal and scoped asset paths and matched the frozen build SHA-256 values. Live identities, configuration, disabled providers and all routes were checked after deployment.

Real browser/device visual acceptance remains separate. No Computer Use, Windows browser automation, owner session or genuine project creation was used. An already-open page retains its old scripts until refreshed; preserve any unsaved text before refreshing to inspect the corrections.

## Source baseline and recovery

Next-build baseline: `.build-temp/dcs-layout-repair-20261119/build`, based on the accepted six/eight release after all 951 source hashes were verified. Exactly seven application source files changed:

- `src/scripts/exploreProjectDraft.ts`
- `src/scripts/studioNativeDrafts.ts`
- `src/scripts/studioFieldWisdom.ts`
- `src/styles/studio.css`
- `src/styles/dcs-approved-public.css`
- `src/data/studio/approved-public/presentation.json`
- `src/layouts/DcsPublicLayout.astro`

The separate pending authentication-message correction remains excluded. The existing uncommitted working tree was preserved; no commit, reset or clean.

Worker artifact manifest SHA-256: `6d396e4dd0c763757ada12b4155935ce1d8c65f9695ad1913a96a236d205b1bc`.

Pages artifact manifest SHA-256: `1acc224a072ab064ae79c96cfb19d2cf41ee084d27d378ece7ecbcbc561b9643`.

The packet `.build-temp/dcs-layout-repair-20261119` retains source association and scope verification, client/compiled/allowance tests, build and dry-run results, manifests, preflight/staging/deployment receipts and both live-verification reports. Embedded brief screenshots are separate local review evidence and were not published.

Guarded rollback: `node scripts/dcs-layout-production-release.cjs rollback` verifies current identities, then restores Pages `f08dbae5-fea4-4d72-a660-5028687ec698` and Worker version `8e61ef09-02d0-4dc1-a9c7-fe93aa620176`. No database rollback is necessary. Rollback was prepared, not executed.
