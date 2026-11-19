# DCS close-out release — 19 November 2026

The owner separately approved deployment of the password-reset acknowledgement wording. The accepted layout-repair source was used, not the older auth candidate. Exactly one application source file differs: `src/lib/community/passwordAuth.ts`, SHA-256 `7938d4fb18cbcb2a6942212b8ba91dfda9d3fe9f40ee5d140ea56ca51ebed81c`.

The page now distinguishes submission from sending/delivery. No password, account, provider, callback, grant, permission, content, notification, SQL, commercial or payment/video behavior changed.

| Record | Value |
| --- | --- |
| Accepted-live reconciliation commit | `8db6df8` |
| Wording-only source commit | `90ba385` |
| Worker version | `09a58112-f999-40be-b631-7bb5848eab89` |
| Worker deployment | `6e789de0-f978-499d-b719-1fd6711b53fe` |
| Pages Production deployment | `14046671-08dc-4135-8bd0-f5eb4dcefbf5` |
| Worker artifact-manifest SHA-256 | `c7ac2ef3d5680d52a3c7794f9cb1775a5d2f410edb3ed4e95b966234b6b2a6fd` |
| Pages package-manifest SHA-256 | `745abeb842c84987cd8e7f0f94b5a6e138728d14a4ae6c76db3dbaa42d552e63` |

Fresh preflight passed at 21:56 UTC. The uploaded Worker was compared with the live binding/runtime fingerprints before activation. Worker activated at 21:58 UTC, passed checks with the preceding compatible Pages package, then matching Pages completed at 22:01 UTC. Read-only verification completed at 22:02 UTC.

All 13 route identities/assignments, Pages domains/configuration and Worker bindings/runtime remain unchanged. The effective Production Supabase URL remains `https://vbdqvjvhjleqdadiiqjx.supabase.co`. Billing flags remain false; video, recording and transcription were not activated. No Production database or protected Preview operation occurred.

Checks passed: isolated production build and exact-package dry run; compiled accepted/rejected recovery responses; five groups of acknowledgement/error checks; six callback cases; ten public-page renders; save/draft-protection and field-help regressions; current six/eight allowance presentation and unchanged offer/API/access sources. Live checks covered established Tides pages, a repeating-card page and its title/canonical, DCS public routes, registration and anonymous Studio redirect, editorial CSS/portrait and the three existing client modules at both normal/scoped URLs with matching hashes. No authenticated Production write, email, test account or browser automation was used. The live acknowledgement is not exercised by sending a recovery request.

The source/Git/build association is `DCS-CLOSEOUT-SOURCE-20261119.json`. The private frozen packet, detailed checks and deployment receipts remain under `.build-temp/dcs-authorised-closeout-20261119`. Real-device visual and genuine owner-workflow acceptance remain separate, as listed in the current close-out handover.

Guarded application rollback: `node scripts/dcs-closeout-production-release.cjs rollback`. It verifies the active pair, restores Pages `92b3ed73-1c7b-4bf1-980c-352fbfacac1c`, then Worker `595c29ee-5fa8-4621-8690-bc0301c5b056`. This does not roll back data, grants, history or retention. No rollback was needed or executed.

Source/evidence push succeeded on `codex/dcs-authorised-closeout-20261119`; draft PR [#30](https://github.com/thedeckcompass-maker/TidesOfKnowing/pull/30) is open. The GitHub connector could read but returned 403 for PR creation; the existing GitHub CLI successfully completed it. Main was not merged because its automatic Pages build still references a machine-specific output directory. No production configuration was changed to bypass that dependency. This leaves source integration held explicitly, not an undeployed application correction.
