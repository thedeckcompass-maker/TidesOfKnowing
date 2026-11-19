# Collaborate six / Develop eight group sessions — live

Owner authorised implementation and deployment on 19 November 2026. Live pair verified at **18:48:25 UTC**, with explicit FAQ/session-feature allowance checks completed at **18:48:49 UTC**.

## Current offer

| Allowance | Collaborate | Develop |
| --- | --- | --- |
| Group sessions | **6** | **8** |
| Private consultations | 1 | 4 |
| Written reviews | 1 | 2 |
| Create access | 12 months | 12 months |

Develop's card now says **“2 more group sessions (8 in total)”**, followed by the existing three more private consultations and one more written review. Prices, payment schedules, six-month editorial service periods and twelve-month Create periods are unchanged.

Updated public locations: landing/pricing cards and comparison tables, the landing session-booking inclusion summary, visible FAQ answers and their structured-data answers, and the retained Collaborate details template. The shared standard offer catalogue now supplies six for new Collaborate programmes, eight for Develop and the corresponding editorial guidance. Written-review terminology is consistent in the touched offer descriptions/guidance.

## Preservation boundary

This is the approved pre-launch current-catalogue correction, not a migration of existing programmes. No new offer-version mechanism was introduced. The older v1 catalogue explicitly retains its eight-session Collaborate allocation. Existing saved programme promises continue to supply their own allowances; their records are never reconstructed from the new catalogue on reads.

Existing test records, saved allocations, attendance, requests, receipts and history were not rewritten. **No Production database query, SQL installation or data mutation was used for this release.** In-memory regression evidence separately demonstrates that a saved eight-session Collaborate record with six attended still reports two remaining, while a new six-session record is exhausted after six. Therefore preserved test records can legitimately continue to display eight included sessions.

The ongoing complimentary Develop workspace grant is unchanged; no programme-service allocations were added to it. Accounts, permissions, Creator's Desk links, content, private Storage and protected Preview were untouched. Payments, billing, video, recording and transcription remain disabled. No notifications or emails were sent.

## Exact release

| Item | Identifier |
| --- | --- |
| Worker | `tidesofknowing-consolidated` |
| Worker version | `8e61ef09-02d0-4dc1-a9c7-fe93aa620176` |
| Worker deployment | `a348ac9c-60d9-467a-a167-91333c9a67c0` |
| Pages Production `main` | `f08dbae5-fea4-4d72-a660-5028687ec698` |
| Production Supabase binding | `vbdqvjvhjleqdadiiqjx`, unchanged |

Accepted next-build source: `.build-temp/dcs-group-allowances-20261119-v2/build`. This was copied from the accepted sales/Desk release after verifying all 951 source hashes. Exactly three application source files differ:

| Source | SHA-256 |
| --- | --- |
| `src/components/studio/EditorialHelp.astro` | `a7cbbd0bb5ab0ba679f174e556b938055cb9a1717b7eeaef4bea01f291cd2f9a` |
| `src/data/studio/approved-public/presentation.json` | `8f76fec47e1cfc68f14961335ad34858d234ccde3bc6ea235634d183ba866616` |
| `src/lib/studio/serviceOffers.ts` | `1d91ed00878befb12eb1a1e0ae000111bdd1a7a70e7614aa4aaca85cf7363d90` |

Worker manifest SHA-256: `14456599e7d020a2f8a2705bc9fc945d37e34d881e4842ab1ad572c4c9275ad0`.

Pages manifest SHA-256: `63f5ef0e52c2ea109395f422d7310c0254ba2930e4bfa2ee5d64d455dcab2497`.

The pending unrelated authentication-message correction was excluded. No commit, reset or clean was performed.

## Validation

- `dcs-group-allowances.test.cjs`: passed. Checks current six/eight allocations, saved eight-session records/attendance, enforcement of the six-session limit, current public copy and preserved prices/periods/other pathways.
- `studio-payment-policy.test.mjs`: passed with the current Collaborate expectation updated to six. Payment-stage rules, legacy prices, refund/history protection and unrelated-owner preservation remain valid.
- `studio-develop-initial-unlock.test.mjs`: seven tests passed; existing Develop eight-session and 4/2 allowances, historic release behavior, ownership and replay safeguards remain intact. Stripe interactions were mocked locally; no provider was activated.
- Isolated Astro build and exact-package Wrangler dry run passed.
- Six compiled landing/pricing/FAQ renders passed for anonymous and signed-in states.
- Seven compiled editorial renders passed: standard offer guidance plus programme overview/group views for new Collaborate six, Develop eight and preserved test Collaborate eight. No live authentication or data writes were used.
- A focused test caught an unchanged count in a retained template before release. It was corrected and the candidate rebuilt as v2; the earlier build was never staged or deployed.
- Fresh preflight, staged binding/runtime comparisons and post-release readback passed. Pages configuration/domains, Production bindings and all 13 route assignments remain unchanged.
- Live read-only checks passed for exact cards/inheritance, comparison six/eight row, FAQ six/eight wording, session-feature summary, existing Tides pages, repeating-card example, registration, Studio redirects, canonical URLs and assets.

Evidence is retained in `.build-temp/dcs-group-allowances-20261119-v2`, including `allowance-tests.json`, `candidate-tests.json`, `editorial-tests.json`, `scope-verification.json`, manifests, preflight/staging/deployment receipts, `live-verification.json` and `content-live-verification-v2.json`. No Computer Use or browser automation was performed; owner visual review remains separate.

## Rollback

`node scripts/dcs-group-allowances-production-release.cjs rollback`

The guarded procedure checks active identities, restores Pages `77a00f29-75a1-44b9-a147-76c25d7d1df3`, then Worker version `f1cfb93f-0c05-41f2-a982-1f6852aeb1fa`. No database rollback is needed. Rollback was prepared, not executed.
