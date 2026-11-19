> **Production database installed and verified:** Migration `20261119005334 — dcs_integrated_creator_launch` completed under the exact owner approval on 18 November 2026, approximately 6:53 p.m. Mérida. All 22 contracts passed; existing account/data/entitlement fingerprints matched. The database installation gate is closed. See [DCS-PRODUCTION-DATABASE-INSTALL-RECEIPT-20261118.md](DCS-PRODUCTION-DATABASE-INSTALL-RECEIPT-20261118.md). Worker/Pages release, accounts and grants remain separately authorised.

# DCS connected acceptance and guarded release packet

Recorded 18 November 2026 in Mérida, after the final passing compiled journey at 19 November 00:11:08 UTC. This record supersedes earlier **acceptance status** statements in the provisioning, launch implementation and continuation records. Historical evidence remains intact. No production installation or deployment is authorised by this document.

## Outcome and scope

The approved API-based connected acceptance passed against independent Supabase project `kcahcrfdubpoajsfxziv`, `dcs-connected-acceptance-20261118`, organisation `arkimixmzjlgixqvhnir`. Production `vbdqvjvhjleqdadiiqjx` and protected Preview `utzcmbidotxgmulguzxo` were not mutated or used for tests. No Computer Use or Windows browser automation was used in this connected run.

Final bounded data: four synthetic Auth identities, five projects, 23 cards and two private image objects, within the authorised 4/8/40/2 limits. The temporary identity using `hello@thedeckcompass.com` is a synthetic fixture only; no genuine production owner account or grant was created. Programme enrolments, capability grants and service-ledger rows were all zero. No purchase, payment, consultation or service consumption was fabricated.

The prerequisite packet was schema-only, materialised from the previously captured production catalog definitions: 28 tables, 34 functions and 113 policies. No protected Auth identities, creator rows or private objects were copied. Baseline RLS/contracts were retained. The isolated bootstrap deliberately used narrower authenticated/executor DML/function privileges instead of copying source broad anonymous/table-maintenance ACLs. This is a documented fixture ACL difference, not a claim of a byte-identical production database clone.

## Connected evidence

| Area | Observed result |
| --- | --- |
| Auth | Four genuine Supabase email-token sessions; own active profile; actual compiled callback/session cookies for Explore, Develop and administrator. |
| Registration | Exact compiled registration form renders. Synthetic signup/confirmation tokens generated through Auth Admin without outbound mail. SMTP delivery and an ordinary owner's email confirmation remain owner-verification items. |
| Explore | One active project, ten-active-card capacity, second-project/eleventh-card denial, save/reopen, card/project soft deletion and restoration. Concurrent card insertion has exactly one winner. |
| Develop | Authenticated administrator grants ongoing complimentary workspace access; multiple projects and more than ten cards work. Nonadministrator, self-grant, wrong-email target and stale grant updates denied. |
| Grant precedence | Revocation pauses writes; restoration works; an independent finite grant retains access when complimentary access is revoked. Finite grant subsequently revoked and complimentary-only path retested. |
| Historical rights | Existing unclassified owner project remains readable and is not silently classified as Explore; writes denied without eligibility. |
| Ownership/RLS | User-scoped requests deny foreign reads/writes, owner reassignment and foreign card moves. A blocked profile loses access with an existing genuine Auth session. Administrator SQL was not used as a substitute for these tests. |
| Version restoration | Actual card and guidebook restoration as a new version, provenance and foreign-owner denial pass for Explore and complimentary-only Develop. |
| Storage | Genuine owner upload/download of two private objects, foreign download denied. The same two object identities were replaced with canonical synthetic JPEG bytes and attached through user-scoped journal/photo records. |
| Exports | User-authenticated project/editorial/Exchange snapshots and actual compiled JSON, Markdown and ZIP routes pass. ZIP inspection confirms attached private JPEG bytes and retained Exchange content. |
| Atomicity/concurrency | Stale atomic capture rolls back card/settings together; concurrent capture has one winner and one explicit conflict. Version/grant optimistic concurrency remains enforced. |
| Restricted executor | Actual separate restricted database LOGIN exercises the real `cloudflareServiceConnection` implementation with verify-full TLS and the public Supabase CA. Verified actor sees only its project; mutation and grant management denied; transaction rollback and reconnect pass. No service-role substitution. |
| Compiled pair | Exact Worker v6 and Pages v4: Auth, dashboards, owned/foreign project views, compiled project/card creation, edit/reopen, lifecycle and exports pass. A preserved Pages article is served through the consolidated Worker. Last full run: 173 isolated Supabase requests. |

Retained evidence is `.build-temp/dcs-connected-acceptance-20261118/connected-progress.json`, `worker-progress.json`, `install-recovery-results.json`, `installed-contracts.json` and `release-sql-manifest.json`. These files contain non-secret results and synthetic identifiers, not keys, passwords or session tokens. Keep private development evidence outside Git/public build output.

Earlier failures remain in the chronology rather than being erased. Test assumptions were corrected for the registration form, normal project redirect, inspiration-save RPC and valid UUID. Transient fetch failures were retried only within the affected bounded phase. Two repeated compiled-editor requests redirected to sign-in after successful saves; their precise cause is unconfirmed. The final instrumented complete run passed with Auth-user HTTP 200 responses and successful reopen. No application authentication change was made or inferred from those redirects; retain this observation for first-live-journey verification.

## Demonstrated corrections

1. Hosted default privileges granted direct `anon` and `service_role` function execution despite revoking `PUBLIC`. The combined SQL now explicitly removes those grants on its eleven new public RPCs while retaining intended authenticated execution. Hosted checks verified owner `postgres`, no anonymous/service-role execution and intended authenticated execution. Existing default privileges were not changed globally.
2. The existing `studio_restore_card_version(uuid,uuid,uuid,integer)` and `studio_restore_guidebook_version(uuid,uuid,uuid,integer)` used finite-access-only authorisation. Actual Explore restore failed with HTTP 403. They now use the owner-bound project edit predicate, preserve explicit ownership, revision and provenance checks, and deny inactive/deleted targets. Original definitions are fingerprint-guarded and retained in `DCS-CREATOR-VERSION-RESTORE-BASELINE-20261118.sql`. Both corrected paths passed genuine user-session tests.

These changes were installed only in the temporary project and incorporated in local SQL. Application source/design and the frozen deployment artifacts were not rewritten during this connected continuation. Existing uncommitted changes remain intact.

## Guarded production SQL

Install **only** `supabase/migrations/20261118234903_dcs_integrated_creator_launch.sql`, SHA-256 `726ce3f81eca50db008dab6e2317396e38107b649da00ba5ae9a13eb31f40575`.

Related files:

- `docs/DCS-INTEGRATED-CREATOR-PREFLIGHT-20261118.sql`: read-only exact baseline/dependency/policy and original restore-function checks.
- `docs/DCS-INTEGRATED-CREATOR-POSTFLIGHT-20261118.sql`: read-only verification of 22 installed function definitions.
- `docs/DCS-INTEGRATED-CREATOR-RECOVERY-20261118.sql`: guarded compensating recovery, SHA-256 `52843f17c8848187bf2544e3dceb31d790755885f21b3f9a7d3973275dc245ec`.
- `docs/DCS-INTEGRATED-CREATOR-COMPATIBILITY-20261118.REVIEW.sql`: retained rollback-only review source, not the install command.

The installer contains the missing read/edit/lifecycle/write-access, atomic capture, deleted-card removal and inspiration-link contracts, explicit new-project Explore binding/capacity, private ongoing complimentary Develop grant/audit storage and administrator RPCs, owner-only complimentary Exchange export, and the two version-restore corrections. It preserves existing records, owner boundaries, retained reads, finite grant precedence and programme-service separation. It does not grant blanket access or disable RLS.

Execution must independently verify the connector/connection target is Production `vbdqvjvhjleqdadiiqjx`, run the fresh read-only preflight, and then execute this single file with both transaction-local settings inserted immediately after its `BEGIN` and before its guard: `SET LOCAL dcs.release_target_ref='vbdqvjvhjleqdadiiqjx'; SET LOCAL dcs.owner_approved_install='true';`. These settings are operator safeguards, not cryptographic proof of project identity. Do not execute a blanket migration-directory push or remove the guard. Stop on drift or existing target objects; repeat execution safely refuses rather than overwriting unreviewed state. No credential belongs in a command argument or SQL file.

The transaction uses 3-second lock and 60-second statement timeouts, expected migration owner, exact prerequisite/policy checks, explicit function ACLs/search paths/identity handling, old-function fingerprints and 22-function postflight assertions before COMMIT. Without explicit approved context the canonical guard was actually tested in the temporary database and refused before DDL. The positive baseline-install rehearsal executed the full candidate body inside a temporary-only ROLLBACK transaction and passed.

Both hosted install and recovery rehearsals passed. Counts/data fingerprints across 32 tables and the four Auth identities were identical before and after. At that rehearsal point there were five projects, 23 cards and two Storage objects; journal/photo reference rows were attached afterward. The rehearsal temporarily preserved existing additive objects in a private namespace and rolled back every change; it did not delete creator rows or classify historical projects. The final read-only 22-contract postflight also passed after the completed journey.

Recovery requires separate authority, verified Production identity and `SET LOCAL dcs.owner_approved_recovery='true'` plus the same target setting. First restore a compatible previous application pair or pause DCS writes. Recovery verifies installed contracts, restores 19 original restrictive policies and the two original restore routines, disables ten new binding/capacity/paid-write triggers and revokes new mutation RPCs. It preserves tables, creator rows, tombstones, grant/audit/binding records and owner-read contracts. New Explore/complimentary writes pause; historical finite rights remain. This is compensating containment, not an uninstall or a blind rerun path. A later rollforward needs an explicit reviewed repair. Failure before COMMIT rolls back automatically; infrastructure backup/PITR should not be assumed or used to erase creator changes.

## Frozen artifacts and coordinated release

- Worker `.build-temp/dcs-production-worker-candidate-20261118-v6`, manifest SHA-256 `71e210c3af1138d20bd0f69b1cfb8e80b6a583f9330823d6db248dacaa80616e`.
- Pages `.build-temp/dcs-pages-workspace-grant-20261118-v4/public`, manifest SHA-256 `aec0db1629c9a4dc9b36d64a64dcb8b0ea21a6ea84ac069a5393d864de6f8b2c`.
- Shared compiled entry SHA-256 `06b414349b8bca23ac9e86cebf09e2e19427f83d533d40ec1b256fce272fd7bf`.

The pair passed genuine connected acceptance with isolated bindings; no new application build is required by the SQL corrections. Final full manifest verification at 19 November 00:23:44 UTC matched every size and SHA-256 for 1,310 Worker files and 917 Pages files, with the manifest hashes above unchanged. Evidence: `.build-temp/dcs-connected-acceptance-20261118/final-artifact-verification.json`. The 157 preserved public article files and two CSS assets retain the earlier semantic comparison evidence; refresh the live comparison immediately before a release. Public response captures are not an origin backup.

Fresh GET-only Cloudflare inventory reconfirmed Worker deployment `ef0bb87c-c83c-4990-a19a-b8b7be109432`, version `ebe18b61-b412-4963-90ab-172cdc93b2f0` at 100%, Pages Production `553f1987-688f-47ff-9ad3-82353ca2b415`, branch `main`, and all thirteen existing route assignments to `tidesofknowing-consolidated`. Production Worker Supabase URL and Hyperdrive `1ed3105145e041ffae0192deba9f7973` match; service key is configured and three billing flags are false. Pages URL/key bindings are present, but its URL is encrypted `secret_text`; **its effective production value has not been verified**. Presence is not authentication or value verification.

Release procedure, requiring separate explicit authority:

1. Finish temporary project deletion. Refresh baseline deployment/version/routes, binding identities, scheduled-handler settings and artifact hashes. Confirm the previous Worker version and successful Pages deployment are available rollback targets. Authenticate effective Production bindings without printing them; securely correct the Pages Production URL/key if needed under release authority. Never import Preview or temporary bindings.
2. Approve and install only the guarded SQL file after fresh read-only Production preflight; pass postflight before application changes. Do not create accounts or grants in this step.
3. Confirm the new Worker/old Pages transition is compatible with retained legacy routes/assets and existing runtime capabilities; the connected run proves the new/new pair, not an exercised hosted mixed-version release. If that transition cannot be established, stop before deployment. Preserve all thirteen routes, existing non-DCS functions, production secrets/Hyperdrive and scheduled behavior. Keep billing/video/recording/transcription disabled.
4. Under coordinated release authority deploy the prepared Worker first, verify its identities/routes and representative legacy functions, then publish the matching Pages Production package and verify the pair. Do not deploy Pages alone as a substitute for updating the routed Worker.
5. Verify public/non-DCS pages and the genuine owner registration/confirmation and creator journey within expressly approved account scope. No fabricated purchase or service allowance is needed.

Application rollback mechanisms are separate: restore Pages to successful Production deployment `553f1987-688f-47ff-9ad3-82353ca2b415`; restore the consolidated Worker to version `ebe18b61-b412-4963-90ab-172cdc93b2f0` at 100%. After a completed two-part release normally restore Pages first then Worker, verifying mixed-version compatibility and preserved routes/bindings. If Worker checks fail before Pages is touched, roll back only Worker. Neither mechanism reverts database changes, data, routes or independently altered bindings. No live rollback/deployment was executed; their operational availability remains an execution-time gate.

## Owner Develop workspace

Normal route: `https://www.tidesofknowing.com/auth/register/`, email exactly `hello@thedeckcompass.com`, normal confirmation and active ordinary-member profile. Do not create it in this phase. After registration verify the actual Production UUID and request approval for the exact account-specific `grant` using `studio_manage_complimentary_develop_workspace_v1`, authenticated as a distinct active administrator, with the observed optimistic revision (NULL only when inspection confirms no row). The supported administrator page is `/ask-leilia/admin/studio-access/`.

The approved duration is **ongoing until revoked**. The grant is private complimentary Develop **workspace** access. It does not fabricate a purchase, programme enrolment, consultations, reviews or consumption. Those services require distinct agreed entitlement authority. The temporary test UUID must never be reused in Production.

## Teardown and financial status

Project creation `2026-11-18T20:26:46.728679Z`; absolute deletion deadline `2026-11-19T20:26:46.728679Z`, 19 November 2:26:46 p.m. Mérida. Pro charge reported by owner: US$25; projected total US$33.79; cumulative cap US$40. No further upgrade/add-on was purchased here. Up to 24 hours of Micro compute was previously quoted at approximately US$0.32256, not an actual final receipt or a guarantee about final taxes. Deletion stops this temporary compute exposure; it does not end the organisation subscription. The earlier authenticated billing record reports the November 18–December 18 cycle and December 18 renewal boundary; it was not rechecked in this API acceptance continuation. Do not downgrade Pro without checking intended live-project impact and actual renewal/billing details.

After evidence preservation all four synthetic sessions were globally logged out. Read-only verification found zero remaining synthetic `auth.sessions`. The exact temporary database LOGIN was dropped and verified absent. The verified loopback Node process was stopped, port 18761 closed and the public-key-only temporary config removed. The memory-only service key and test passwords/tokens are no longer held by that process. Existing signed access JWTs are not intrinsically invalidated merely by logout; deletion completes temporary-environment teardown.

**Remote teardown confirmed at 19 November 00:26:31 UTC**, before the deadline. After the owner reported deletion, a fresh Supabase connector project inventory omitted exact temporary reference `kcahcrfdubpoajsfxziv` and retained protected Production `vbdqvjvhjleqdadiiqjx` and Preview `utzcmbidotxgmulguzxo`, both `ACTIVE_HEALTHY`. The owner performed the dashboard deletion after the screenshot's exact name/reference were confirmed. Evidence remains locally preserved. No further temporary testing or deletion action is needed. The organisation's Pro subscription remains separate; no downgrade or automatic renewal expenditure was authorised or performed by this teardown verification.

## Exact remaining approvals

The next production approval is: **Approve installation of only `20261118234903_dcs_integrated_creator_launch.sql` (SHA-256 above) in Production `vbdqvjvhjleqdadiiqjx`, after fresh read-only preflight, with transaction guards and read-only postflight; no deployment, account creation or entitlement mutation.** Execute only after temporary teardown is confirmed.

Coordinated Worker/Pages release needs its own approval, effective Production Pages binding verification and transition/rollback gate. The genuine registered owner's account-specific ongoing grant needs separate approval with its real UUID. No production SQL, deployment, route/config change, genuine account/grant, provider activation, commit, reset or clean occurred during this connected acceptance continuation.
