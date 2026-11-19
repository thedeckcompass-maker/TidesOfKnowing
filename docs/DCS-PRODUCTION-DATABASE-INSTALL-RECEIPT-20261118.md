# DCS Production database installation receipt

**PRODUCTION_DATABASE_MIGRATION_INSTALLED_VERIFIED — database installation gate closed.**

Owner-authorised migration only, installed on 18 November 2026 at approximately 6:53 p.m. Mérida (`2026-11-19T00:53:36Z`). No application deployment, route/configuration change, account/project creation, entitlement grant or provider activation followed.

## Exact execution

- Production Supabase: `vbdqvjvhjleqdadiiqjx`, `tides-of-knowing`, organisation `arkimixmzjlgixqvhnir`; connector confirmed `ACTIVE_HEALTHY`, database host `db.vbdqvjvhjleqdadiiqjx.supabase.co`, PostgreSQL `17.6.1.127`.
- Canonical file: `supabase/migrations/20261118234903_dcs_integrated_creator_launch.sql`.
- Required and actual SHA-256: `726ce3f81eca50db008dab6e2317396e38107b649da00ba5ae9a13eb31f40575`.
- Submitted transaction SHA-256: `475915d934c41e7b075d0d489f3551489103c7d562b1c44e0f070fa09d981393`.
- The only in-memory insertion was the two approved transaction-local settings naming the Production reference and `dcs.owner_approved_install='true'`, immediately after BEGIN. The canonical file, remaining SQL, timeouts, assertions and COMMIT were unchanged.
- Supported `apply_migration` executed once, returned `success: true`, and all expected committed objects were independently verified afterward.
- Actual Production migration history entry: **`20261119005334 — dcs_integrated_creator_launch`**. The tool assigned the execution-time version; the approved local source filename retains its original version. All 48 previous migration entries remain; total is now 49.

## Fresh preflight

Immediately before installation the exact read-only baseline preflight passed without exception. The second approved dependency check also passed with zero drift across 28 existing tables, 247 columns, 113 policies and 34 existing functions, including ownership, RLS, ACLs and original restore-function fingerprints. New targets were absent. Expected Production identity, existing owner links, private Storage and restricted executor were confirmed. No Preview or temporary database was used.

Read-only fingerprints were captured before installation and compared afterward. No credentials, Auth password hashes, tokens, private connection strings or creator-content rows were returned or saved; the evidence contains aggregate counts and database-side digests only.

## Post-install verification

- All **22 exact function-contract checks passed** in the documented independent read-only postflight. All 22 functions are owned by `postgres` and have explicit search paths.
- All **11 public RPC ACL checks passed**: intended authenticated EXECUTE; no PUBLIC, anonymous or service-role EXECUTE on those new RPCs.
- All **ten new triggers** exist and are enabled. The two nullable lifecycle columns have their expected types/defaults, and existing rows have no initial tombstones.
- All **three new private tables are empty**: no complimentary grant, audit event or Explore binding was inserted. Grant/audit relations have RLS enabled and no anonymous/authenticated table DML rights. The private binding register has no direct caller DML rights; its RLS=false matches the reviewed installer and was not changed as an unrelated follow-up.
- Exactly the **19 reviewed restrictive policies** changed to the reviewed workspace/binding predicates, retaining roles and restrictive policy mode. The other **94 baseline policies remain unchanged**, including permissive owner/read and service policies. The two new owner-scoped Exchange SELECT policies are present.
- Exactly the two reviewed version-restore routines changed among the 34 baseline functions; the other **32 baseline functions remain unchanged**, including the historical finite-grant and retained-read helpers. All 247 prior columns retain their definitions and ACLs; only the two approved lifecycle columns were added to the existing tables.
- Existing table RLS remains enabled where required, the journal bucket remains private, and the restricted executor role remains restricted. No orphan project owner or card/project relationship was introduced.

## Accounts, records and historical rights

The before/after comparison matched the Auth identity fingerprint and **all 29 existing table fingerprints**, accounting for the two new nullable columns when comparing old project/card records. There were no concurrent-data differences to explain.

Unchanged: eight Auth accounts, eight profiles, five projects, 78 cards, five existing `studio_access` records, all ownership relationships, card/guidebook versions, service records and Storage metadata. Existing programme enrolments remain zero. No grant was created/revoked, no existing project was reclassified as Explore, and no member entitlement or commercial term was changed.

Historical access preservation is supported by unchanged access records, unchanged identity/finite-grant/read helpers and owner/read policies, the reviewed additive policy branches, and prior genuine isolated acceptance. No impersonated or genuine-member Production write test was performed or claimed. The live owner registration/browser journey remains a separately authorised release check.

## Backup, recovery and failures

The immediately preceding approval-gate dashboard evidence shows the Production **18 November 2026 18:07:17 UTC physical backup**, with Restore available. Its screenshot is `C:\Users\DELL74~1\AppData\Local\Temp\codex-clipboard-24324754-62df-4af6-8c0e-8693fb50b13a.png`. Backup availability evidence is owner-dashboard supplied; the connector does not independently list backups. No backup/restore setting was altered and no restore was exercised. Database backups exclude Storage object bytes; this migration did not alter those bytes.

Guarded compensating recovery remains `docs/DCS-INTEGRATED-CREATOR-RECOVERY-20261118.sql`, SHA-256 `52843f17c8848187bf2544e3dceb31d790755885f21b3f9a7d3973275dc245ec`. Its earlier hosted transactional rehearsal passed. It was not executed in Production and requires separate authority. It preserves creator rows and additive schema while restoring restrictive policies/routines and pausing the new write paths; it is not a destructive uninstall. Full backup restoration is a last resort requiring separate approval because it causes downtime and discards subsequent database changes.

**No Production execution failure, partial installation or unexpected database difference occurred.** A local shell quoting error while preparing the payload happened before final preflight and before DDL; it was corrected by safe local JSON serialization. No SQL body changed and no Production migration retry occurred. No automatic recovery was needed.

Machine evidence, including before/after digests, catalog verification and complete before/after migration history, is preserved privately at `.build-temp/dcs-connected-acceptance-20261118/production-install-receipt.json`. Preserve all existing uncommitted changes; no commit/reset/clean was performed.

## Next separate action

The database installation gate is closed. The application is **not newly deployed**. Next obtain separate authority for the coordinated frozen Worker v6 / Pages v4 Production release, including effective Production Pages binding verification and the mixed-version/rollback gate before deployment. Preserve all thirteen Worker routes and existing Production bindings/runtime behavior. Worker and Pages rollbacks remain independent. Do not create the owner's account or invoke the ongoing Develop grant under this database approval.

Controlling release preparation and limitations remain in `docs/DCS-CONNECTED-ACCEPTANCE-RESULTS-20261118.md` and `docs/DCS-PRODUCTION-MIGRATION-APPROVAL-GATE-20261118.md`, superseded only as to the now-completed database installation.
