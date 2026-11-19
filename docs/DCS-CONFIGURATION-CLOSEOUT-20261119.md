# DCS configuration close-out — 19 November 2026

The owner authorised this narrow cleanup after reviewing the preserved files. The earlier classification of `desktopArtwork.ts` as unrelated was incorrect: it is a compile dependency for a dormant artwork option. The file is preserved byte-for-byte and is now included in the recorded release inputs. The special local-folder editor/save flag remains disabled. No creator navigation, layout, programme allowance, account, grant, permission or content change is included.

## Completed reconciliation

- Recorded the artwork dependency, SHA-256 `d1c5ac7ea5f124eaae553c439ddb6357cf099c92f042249b25511c18277df42f`, without changing its behavior.
- Recorded the accepted scoped Worker and Pages adapters under `scripts/release-support/`. Their bytes match the latest accepted packages. The older `src/worker-adapters/dcs-scoped.mjs` is not the wrapper used by that release; packaging now names the recorded accepted wrapper explicitly.
- Archived ten earlier root/Community/Stage 7/visual/consolidated profiles as `.retired.txt` files, with original names, purpose and byte hashes. Removed their selectable originals; replaced the root stage profile only after the canonical package and fresh live preflight passed.
- Retired the stale local `.wrangler/deploy/config.json` discovery redirect to private evidence. A root Wrangler dry run now refuses deployment and does not discover the consolidated Production Worker.
- Established `npm run release:production -- <phase>` as the definitive entry point. `npm run build` prepares/verifies the pair locally; generic publish refuses deployment. Configuration, retained route assignments, inputs, outputs, disabled services, separate execution approval and recovery are documented in `DCS-PRODUCTION-BUILD-RELEASE.md`.
- Kept Lexicon parked. Its dedicated configuration, generic tooling and fixtures remain. The old real-account import instruction is retired privately; its diagnostic test now uses synthetic identities. Private Access/recovery evidence stays outside Git and public assets. No hosted Lexicon/Access or protected Preview operation occurred.

## Hosted Pages safeguard — explicitly approved and applied

After the exact change and consequences were presented, the owner separately approved changing only `source.config.production_deployments_enabled` to `false` and `source.config.preview_deployment_setting` to `none` on Pages project `tidesofknowing`.

Readback at **22:18:39 UTC** verified both settings. The entire remaining source-control configuration, build settings, Production/Preview deployment configuration (including binding metadata), domains and active deployment were unchanged. Pushes/merges no longer automatically deploy Pages; coordinated Wrangler uploads remain available. The old machine-specific Git output setting is left inert. PR #30 is not merged and this safeguard does not authorise merging it.

The original values and restoration evidence are retained privately in `.build-temp/dcs-configuration-closeout-20261119/pages-source-before.json` and `pages-automation-receipt.json`. Re-enabling automation requires separate authority and a compatible deployment design. No application rollback is needed for this setting-only change.

## Verification and production status

- All 929 active `src` files match the accepted source manifest. Artwork and the existing Lexicon fixture are copied/pinned external build dependencies; the compiled application is unchanged.
- The initial isolated attempt exposed the missing copied Lexicon fixture and stopped locally. Evidence is retained in `.build-temp/dcs-production-release-20261119`; nothing was deployed. The corrected fresh build and coordinated packaging passed in `.build-temp/dcs-production-release-20261119-v2`.
- Existing Pages assets and accepted routing adapter were hash-compared and preserved. Canonical Worker configuration matches its reviewed template; all billing flags remain false and no video/recording/transcription provider is activated.
- Ten compiled public-page renders, compiled accepted/rejected reset responses, six callback cases, save/draft/field-help regression checks, and 14 offline Lexicon diagnostics/safeguards passed. Tests made no hosted data writes or email requests.
- Archive integrity/default-target checks passed. Every remote write phase refuses execution without a separate exact-packet approval. Exact-package Wrangler dry run passed without upload.
- Fresh read-only Production preflight passed at **22:28 UTC**: all 13 routes, expected Worker/Pages identities, bindings/runtime, effective Production Supabase URL and existing public pages were preserved. Automatic Pages deployments were confirmed disabled.

No application deployment, database migration, account/grant/content change, billing activation or notification occurred. Current production remains:

| Component | Identifier |
| --- | --- |
| Worker version | `09a58112-f999-40be-b631-7bb5848eab89` |
| Worker deployment | `6e789de0-f978-499d-b719-1fd6711b53fe` |
| Pages deployment | `14046671-08dc-4135-8bd0-f5eb4dcefbf5` |

New candidate manifest hashes (locally validated, deliberately not deployed): Worker `fb998ded1d80e097b8a51a4120b1a702ba3360a4c75d03d451b3f0536565376a`; Pages `408e759652581d1311ba0b2541deba97f0f0972abcb585144da6b13d49e24787`.

## Remaining boundaries

No approved application correction is silently waiting for deployment. This housekeeping is effective in the local release tools and hosted Pages automation; deploying another identical application pair is unnecessary.

PR #30 remains draft pending a separate merge decision. The automatic-build blocker is resolved; merge authority was explicitly withheld. The root stage configuration is no longer an unexplained local change. Historical/private build evidence remains excluded from Git, with locations recorded in the file register and this receipt.

All other owner/device/demo/authentication follow-up, deferred commercial/provider/Lexicon work and the scheduled-retention/subscription checks remain as listed in `DCS-AUTHORISED-CLOSEOUT-20261119.md`. The owner has reset her password and signed in; the earlier failure's cause remains unproven. The ongoing Develop workspace grant is unchanged. The rejected project-start brief remains rolled back. This close-out is not a claim of full product launch readiness.

## Source history

Configuration/dependency/pipeline commit: `b3e9a6f30e4bed28471026804ebd1c215317c926`. The scoped evidence/handover commit follows it on `codex/dcs-authorised-closeout-20261119`; both are pushed to draft PR #30 without merging. The final remote/live verification receipt is retained privately in `.build-temp/dcs-configuration-closeout-20261119`.
