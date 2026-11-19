# DCS coordinated Production application release receipt

**Deployed and technically verified. Owner visual acceptance and authenticated Production use remain outstanding.**

Completed 18 November 2026 at approximately 7:29 p.m. Mérida. Production Worker activation was recorded at `2026-11-19T01:28:06Z`; Pages completion at `2026-11-19T01:29:02Z`. The exact owner-authorised Worker v6 / Pages v4 pair is now serving the existing Tides of Knowing website.

## Release identities

| Component | Production identity |
| --- | --- |
| Cloudflare account | `bd6ec7740077c69b954f70cf9aa61c95` |
| Consolidated Worker | `tidesofknowing-consolidated` |
| New Worker version | `1cffb084-8f75-4e5f-a4e4-83155d1d29a9`, 100% traffic |
| New Worker deployment | `eac0188f-6dd4-4db6-b1bb-e70d529bc6a1` |
| Existing Pages project | `tidesofknowing`, ID `770284b7-07db-4b37-bec6-dda90d995641` |
| New Pages Production deployment | `26c7b2d5-c223-48b4-af34-bf06c7f96e4d`, branch `main` |
| Production database | `vbdqvjvhjleqdadiiqjx` |

Frozen Worker: `.build-temp/dcs-production-worker-candidate-20261118-v6`, manifest SHA-256 `71e210c3af1138d20bd0f69b1cfb8e80b6a583f9330823d6db248dacaa80616e`, 1,310 recorded files. Frozen Pages: `.build-temp/dcs-pages-workspace-grant-20261118-v4/public`, manifest SHA-256 `aec0db1629c9a4dc9b36d64a64dcb8b0ea21a6ea84ac069a5393d864de6f8b2c`, 917 recorded files. All recorded hashes/sizes were reverified before each release phase. No unrelated build or Preview package was substituted, and frozen source/artifact bytes were not edited.

## Supabase configuration gate — explicitly resolved

Source `src/lib/community/env.ts` reads runtime `locals.serverRuntime.env` first, then Vite build-time fallback. Both frozen bundles contain the same `chunks/supabaseServer_Ci08c_uQ.mjs` with **empty** build-time `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` fallbacks. The actual application therefore needs runtime values: the consolidated Worker supplies them on its scoped routes; Pages Functions require their own Production runtime bindings. Current-deployment secrets and future build inputs are separate from this frozen-artifact evidence. No local environment file was treated as proof of saved Pages secrets.

Under the owner's new narrow authorisation, the matching pair was obtained from the authenticated existing Production Worker configuration. Identity: project `vbdqvjvhjleqdadiiqjx`; key type **legacy anon JWT**. In addition to checking its project/anon claims, a genuine GET to that project's `/auth/v1/settings` with the public key returned **HTTP 200**. No user, session, account or record was created by that read-only verification. No service-role, secret, database or administrative key was placed in a public/client variable.

The gate was satisfied by an **explicit Production-only Pages configuration update**, not by recovering masked values. A PATCH to the existing Pages project contained only:

- `deployment_configs.production.env_vars.PUBLIC_SUPABASE_URL`
- `deployment_configs.production.env_vars.PUBLIC_SUPABASE_ANON_KEY`

Both retained their `secret_text` storage type. All other variables were omitted from the PATCH; masked values were never resent as credentials or used to rebuild the whole map. Before/after comparison confirmed Preview configuration and all unrelated settings unchanged. The prior Production deployment remained unchanged during this identity correction. The former masked values remain **unknown, unverified and not recoverable from this operation**. No key was rotated. Values were held in process memory only and not printed or written to new logs, documentation or credential files.

This update establishes the intended pair for the new Production deployment and subsequent Pages runtime/build configuration. It does not retrospectively prove the previous deployment used the same pair.

## Controlled release and safeguards

Baseline IDs matched the recorded old Worker version `ebe18b61-b412-4963-90ab-172cdc93b2f0` and old Pages deployment `553f1987-688f-47ff-9ad3-82353ca2b415`. Route IDs/patterns/assignments matched the thirteen-route ledger.

The workspace root `wrangler.toml` targets staging and includes Pages build configuration. To prevent accidental profile inheritance, deployment commands ran through the established credential-safe helper from an isolated temporary execution directory, with the exact Worker config or explicit Pages project/main/public directory. Installed Wrangler 4.156.0 was used; no dependency upgrade or rebuild occurred. CLI output remained in memory and was suppressed from logs/evidence because binding diagnostics can contain values.

Worker v6 was uploaded as a non-serving version with `--no-bundle --keep-vars --strict`, then its complete binding fingerprint and runtime fingerprint were checked against the old version. Both matched exactly. It was activated at 100%, and essential anonymous site/registration/Studio checks passed with old Pages still serving. Only then was the exact Pages v4 directory deployed to Production `main` with `--no-bundle`.

No competing Worker, route mutation, domain change, Supabase migration rerun, account/project creation, entitlement grant, payment operation, video/recording/transcription activation, subscription upgrade or additional financial commitment occurred. Existing scheduled operations remain empty. Existing Worker bindings/runtime and unrelated Pages secrets are preserved. The configured Production Hyperdrive remains `1ed3105145e041ffae0192deba9f7973`, targeting the confirmed Production database.

The Workers database migration remains `20261119005334 — dcs_integrated_creator_launch`, installed earlier; all 22 contracts were checked read-only again before application activation. No further database DDL was run.

## Hosted verification

Verified after the complete pair release with anonymous GETs and read-only API/SQL checks:

- Home, Articles, the established COMPASS article and COMPASS page return 200 and retain their baseline titles/canonical URLs.
- DCS landing, pricing and FAQ return 200 with the intended DCS titles and canonical URLs. Pricing/FAQ were 404 in the old baseline and are now available.
- Default registration and explicit Studio join registration return 200, show DCS content and contain the registration form. Studio returns 303 to sign-in with the Studio return destination.
- Expected DCS editorial CSS, scoped Worker CSS and the restored Leilia portrait all return 200. This is delivery/DOM/CSS evidence, not owner visual acceptance or a new visual redesign.
- All **157 repeating-card pages** have zero differences against the accepted preserved package in title, metadata, canonical, JSON-LD, headings, links and visible text. Cloudflare rotating email obfuscation explains byte-level differences; semantic comparison normalises it.
- All **13 Worker routes** retain their exact established IDs, patterns and assignments to the consolidated Worker. Worker binding/runtime fingerprints match the prior Production version. Pages domains and the intended project configuration remain intact after the two explicitly authorised public Supabase changes.
- Apex home and DCS landing return 301 to their corresponding `www` canonical URLs.
- DCS billing live/test/scheduler flags remain false; no RealtimeKit, recording or transcription provider binding was introduced or activated. Existing unrelated website secrets were not used or changed.
- Read-only after-release fingerprints match the installation receipt for **all 29 existing tables and the eight Auth identities**. Profiles, five projects, 78 cards, five existing access rows, owner relationships, content, versions, service records and Storage metadata are unchanged. No Develop grant was made.

No essential failure or rollback occurred. The pre-existing `/reading-library/` 404 was recorded as baseline, not claimed as a working established page or a release regression. No unrelated repair was attempted.

## Rollback readiness and configuration limitation

At `2026-11-19T01:31:10Z`, the following separate rollback targets were reconfirmed available:

- Worker version **`ebe18b61-b412-4963-90ab-172cdc93b2f0`**. Restore it to 100% on the same consolidated Worker using the recorded version-deployment command; verify its actual deployment and all routes afterward.
- Pages successful Production deployment **`553f1987-688f-47ff-9ad3-82353ca2b415`**. Use the project's exact deployment rollback endpoint; verify the canonical Production deployment afterward. It is not a Preview target.

The guarded local runner `scripts/dcs-coordinated-production-release.cjs rollback` checks the actual new version/deployment IDs before restoring Pages first and Worker second. It neither rolls back the database nor alters routes. No rollback was executed because live checks passed.

**Keep the verified Production Supabase pair configured when restoring prior application code.** The former encrypted values cannot be recovered or truthfully restored by this operation. An application deployment rollback does not constitute verification or recovery of independent environment settings. A prior deployment may carry its historical binding snapshot; verify its actual Auth path separately and, if necessary, deliberately reapply the verified Production pair through the supported configuration/redeployment procedure. Do not substitute masked placeholders or assume that project settings prove a historical deployment's effective values. Leave all unrelated secrets and Preview configuration intact.

## Owner continuation — still outstanding

Live URLs:

- Landing: `https://www.tidesofknowing.com/deck-creator-studio/`
- Pricing: `https://www.tidesofknowing.com/deck-creator-studio/pricing/`
- FAQ: `https://www.tidesofknowing.com/deck-creator-studio/faq/`
- Register: `https://www.tidesofknowing.com/auth/register/?mode=join&redirectTo=%2Fstudio%2F`
- Studio: `https://www.tidesofknowing.com/studio/`

Owner should register `hello@thedeckcompass.com` through the normal join form, confirm through the ordinary email flow and sign in. No account was created on the owner's behalf. SMTP delivery, genuine browser/session persistence and authenticated Production Studio use were not exercised by these anonymous checks.

After the genuine confirmed account exists, verify its actual Production UUID and active ordinary-member profile. Present the exact account-specific ongoing complimentary Develop **workspace** grant for separate approval, then use a distinct authenticated active administrator and `studio_manage_complimentary_develop_workspace_v1` with its inspected revision. Never reuse a temporary-test UUID, fabricate a purchase or silently add programme-service allowances. Owner should subsequently verify creation/edit/reopen/restore/export of their genuine demonstration project under that separately authorised account scope.

Public visual/editorial acceptance remains the owner's decision. Operational branded video consultations remain a later authorised workstream; this release did not activate them.

## Evidence

Private Git-ignored evidence under `.build-temp/dcs-coordinated-release-20261118/`: `pages-identity-intent.json`, `pages-supabase-identity.json`, `worker-staged.json`, `worker-activated.json`, `pages-activated.json`, `live-verification.json`, `repeating-card-after.json`, `protected-data-verification.json`, and `rollback-and-domains.json`. Existing uncommitted changes/files were preserved; no commit, merge, reset or clean was performed.
