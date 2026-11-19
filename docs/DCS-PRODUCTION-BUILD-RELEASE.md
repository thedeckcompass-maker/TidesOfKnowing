# Definitive DCS Production build and release

Use `npm run release:production -- <phase>` from the authoritative workspace. This is the single current entry point. Older dated scripts and receipts are historical; archived profiles are not selectable deployment inputs. Generic `npm run publish` refuses to deploy.

## Configuration and inputs

- `config/dcs-production-release.json`: accepted baseline packet, isolated output directory, exact Worker/Pages identities, Production Supabase reference, 13 existing route assignments and expected configuration fingerprints.
- `config/wrangler.production.json`: the reviewed Production Worker template, derived from the latest accepted release. The runner generates absolute compiled entry/asset paths only inside the isolated packet. It retains existing secrets/variables, pins the existing Hyperdrive binding and does not manage routes or cron triggers.
- `config/wrangler.build.json`: credential-free, endpoint-disabled compile configuration. The root `wrangler.toml` is also build-only, with no deployable entry, account or Production target. Neither is a release artifact.
- `config/dcs-production-dependencies.json`: pins `local-folder-prototype/desktopArtwork.ts` and the existing Lexicon demonstration fixture. These are copied into the build, not junctioned to unrecorded external source. The local-folder feature remains disabled; no application source behavior changes.

The source guard compares every active application file with `docs/DCS-CLOSEOUT-SOURCE-20261119.json` and rejects additions, removals or changes. A future authorised application change needs a newly reviewed source manifest. Existing historical `.before-*`/backup files are excluded from the build copy. The rejected project-start files remain absent.

The preserved accepted packet `.build-temp/dcs-authorised-closeout-20261119` supplies the previous static assets and the comparison baseline for routing adapters. The exact accepted adapter source is now recorded in `scripts/release-support/dcs-scoped.mjs` and `pages-entry.mjs`; packaging verifies it against that baseline. Its manifests and every referenced file are hash-verified before packaging. This preserves old asset URLs and existing Tides content. That packet remains private and must be retained or restored from its verified recovery copy before packaging on another computer. It is an explicit prerequisite, not an implicit dependency on an older generated root configuration.

Use the committed package/lockfile and installed project-local Wrangler. No dependency or compatibility-date upgrade is included. The credential-free build runs the installed Astro directly, outside root pre/post hooks, in a new private directory; it does not inherit workspace `.env` values or remote credentials. Output is the policy's directory, containing `build/`, `worker/` and `pages/public/`, source association, artifact manifests and verification receipts. Existing frozen outputs are verified rather than overwritten; a new build requires a fresh reviewed `policy.output` directory.

## Local preparation

1. `npm run build` — source check, isolated compile, coordinated packaging and verification. It does not upload or deploy.
2. Run the focused compiled/public-page and client regressions against that output. Existing close-out tests accept `DCS_TEST_PACKET` for this purpose. Auth callback evidence and accepted connected/database evidence remain applicable because application source is unchanged.
3. `npm run release:production -- dry-run` — exact compiled Worker package validation, without upload.
4. `npm run release:production -- preflight` — fresh read-only check of the active pair, routes, variables, bindings/runtime and public smoke pages. It also requires Pages automatic Production and Preview deployments to be disabled.

No live write phase is authorised by these commands or this document.

## Separately authorised coordinated release

The supported phases are `stage`, `worker`, `pages`, then read-only live verification; `rollback` is the guarded recovery phase. Write phases require `--approval <private-reviewed-file>` in addition to their normal gates. That file must record the exact Production project, Worker/Pages manifest hashes, source-association hash, `authorized: true` and explicitly approved phases. Do not create that approval merely to satisfy a tool: obtain owner execution authority for the exact packet first. This housekeeping operation creates no such approval.

The existing sequence is preserved: upload a non-serving Worker version with retained variables; compare its bindings/runtime with the live version; activate it and check compatibility with current Pages; deploy matching Pages to the existing project/main environment; verify identities, domains, route assignments, configuration and live pages. Separate Pages and Worker rollback remains available, with identity guards. The runner never deploys triggers/routes or executes SQL.

Credentials stay in process memory. An existing process token can be used, or the owner-host's hash-pinned secure handoff module. The latter remains private at the existing `DCS-INDIVIDUAL-ROUTE-AUTOMATION-20261110/secure-handoff.cjs` location under the owner's local website records. No credential value is stored in source, command arguments, output or release evidence.

## Pages Git deployment safeguard

The owner explicitly approved disabling these two settings on Pages project `tidesofknowing`:

- `source.config.production_deployments_enabled: false`
- `source.config.preview_deployment_setting: "none"`

Pushes to `main`, merges and other branch pushes therefore do not automatically publish Pages. Coordinated Wrangler uploads remain supported. The Git connection and `main` branch are retained. The old machine-specific Git build output path is left inert, unchanged; do not use dashboard retry/build actions or re-enable automatic builds as a substitute for the coordinated process.

This is Cloudflare's documented [disable automatic deployments](https://developers.cloudflare.com/pages/configuration/git-integration/#disable-automatic-deployments) approach. It does not change existing deployments, domains, bindings, secrets or data. It does not prevent a privileged operator deliberately issuing a manual deployment; such an operation still requires its normal execution approval.

The original settings and exact before/after checks are retained privately in `.build-temp/dcs-configuration-closeout-20261119`. Reversing the safeguard requires separate authority and must not happen while uncoordinated Git builds could serve an incompatible pair. PR #30 remains unmerged; disabling automation is not merge approval.

## Retired and parked material

Ten earlier profiles are preserved with original byte hashes in `docs/archive/dcs-build-profiles-20261119`, using non-selectable `.retired.txt` names. The stale root Wrangler generated-deployment redirect is preserved privately and removed from active discovery. Their historical purpose is documented without active release commands.

Lexicon stays parked. Its dedicated configuration, tooling and fixtures remain; its old real-account import instruction is retired privately, and diagnostic tests use synthetic identities only. See `config/lexicon-preview-README.md`. Hosted Access, protected Preview, accounts, grants and content are unchanged.
