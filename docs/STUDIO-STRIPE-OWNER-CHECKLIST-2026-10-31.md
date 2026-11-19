# Leigh's Stripe checklist — review only, 31 October 2026

Do not activate payments yet. Implemented application paths and remaining migration/browser gates are listed in the accompanying report. No Stripe Dashboard changes were made.

## Exact approved catalogue

| Mapping key | USD price | Stripe recurrence |
|---|---:|---|
| create:monthly | 12 | Monthly |
| create:annual | 120 | Yearly |
| collaborate:once | 590 | One-time |
| collaborate:instalments | 310 | Monthly price used ONLY by a bounded TWO-payment schedule |
| develop:once | 1490 | One-time |
| develop:instalments | 525 | Monthly price used ONLY by a bounded THREE-payment schedule |

Explore is permanently free; no paid price is needed. A recurring instalment price is not an ordinary cancel-anytime subscription or an unbounded Payment Link. Both programmes include six months of editorial support and twelve months of Create. Existing customer prices/contracts must not be replaced.

## Owner Dashboard / configuration actions after readiness gates

1. Identify or create the six exact prices in test mode and retain the real `price_...` identifiers. Do not guess IDs, migrate existing subscriptions or reactivate old Collaborate 3 x $210 terms for new purchases.
2. Configure the Studio endpoint `/api/studio/billing-webhook` on the approved deployed origin when that endpoint is ready. Required handled events are `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `refund.created`, `refund.updated`. Do not replace Ask Leilia's existing endpoint.
3. Install secrets through the trusted deployment secret manager, never chat/source. Current TEST code expects `STUDIO_STRIPE_TEST_SECRET_KEY`, `STUDIO_STRIPE_TEST_WEBHOOK_SECRET`; trusted values `STUDIO_BILLING_TEST_ENABLED=true`, `STUDIO_STRIPE_TEST_PRICES_JSON` (six mappings above), and `STUDIO_BILLING_ADMIN_ID` (verified existing administrator). It reuses the approved `PUBLIC_SUPABASE_URL` and server-only `SUPABASE_SERVICE_ROLE_KEY`; the reviewed guarded RPC must exist first. No new credential or grant is silently implied.
4. Verify the approved test purchase, signature, duplicate retry, fixed total, access period, failed-payment policy and existing prepaid upgrade with ordinary authorised sessions. Application adapters have only synthetic SDK tests so far. No live charge/refund should be used as a test.
5. Production activation is separately approved configuration/release work. The reviewed code now supports live mode only with STUDIO_BILLING_LIVE_ENABLED=true, STUDIO_BILLING_RELEASE=2026-10-31-standard-v2 and STUDIO_STRIPE_LIVE_SECRET_KEY / STUDIO_STRIPE_LIVE_WEBHOOK_SECRET / STUDIO_STRIPE_LIVE_PRICES_JSON. Test and live flags cannot both be enabled. No values were installed. Do not treat this checklist as a deployment instruction.

Progressive individual-service release requires a recorded per-enrolment schedule; no universal stage counts were approved. Upgrades require an explicit recorded credit/refund agreement and preserved prepaid value. The deferred automatic refund document remains outside this checklist.

No secrets, live price IDs or unverified production webhook secrets are included here.

## Runtime work outside Stripe Dashboard

Apply neither reviewed SQL candidate without separate approval. Configure the existing private database binding and optional providers only after their acceptance: STUDIO_RUNTIME_ENABLED, strict STUDIO_RUNTIME_CONFIG_JSON and DCS_EXCHANGE_DB. Community/services require the approved recipient and community history policy. The trusted Worker scheduled handler is implemented; STUDIO_BILLING_SCHEDULER_ENABLED and a separately approved schedule remain unset. Missing scheduler activation does not extend the stored day-21 access deadline. Verify hosted ZIP/media completeness and two-account ownership using retained labelled fixtures, never disposable Oracle records.


### Step 196G.5J.247 - approved three-part bundle COMMITTED and metadata verified

Following parent review of .246, resumed the owner's exact three-part approval. Fresh schema-spanning preflight matched .245/.246 function definitions, policies (including all 17 storage.objects policies), indirect dependencies, grants, role attributes, columns and constraints. The three .244 source scripts and captured rollback hashes were unchanged. The earlier .245 coverage omission and stop remain recorded above; .246 resolved that dependency before this application.

Applied all three parts in ONE transaction using Supabase apply_migration to tides-of-knowing (vbdqvjvhjleqdadiiqjx). Migration name studio_ownership_retention_atomic_billing_20261031; recorded version 20261031194442. Tool returned success:true; subsequent catalog checks confirmed committed outcomes. Application SQL SHA256 6107749659a8a18bdf3569ea3dbdfd1fd999199ee05de1f7442b0c65445f6df4. The committed wrapper adds fresh function/Storage-policy preconditions and local lock/statement timeouts, then uses the exact approved grant, retention and billing bodies. Original review files retain their ROLLBACK defaults. No partial/uncertain application or retry occurred.

Verified outcomes:
- Active-owner retention helper and bounded inspiration function bodies exactly match approved SQL; only the approved inspiration/project SELECT policies changed in the captured policy set. Existing ownership/active-account composition remains as tested in .244/.246. All 17 Storage policies are byte-equivalent after normalization, including paid-write restrictions.
- Existing dcs_service_executor now has EXECUTE on public.studio_owns_project(uuid). Ownership function body, restricted role attributes and unrelated captured function definitions are unchanged.
- public.studio_apply_verified_billing_v1(jsonb) exactly matches the approved body, SECURITY DEFINER with empty search_path, owned by postgres. ACL contains only postgres and service_role; anon/authenticated EXECUTE are false. public.studio_access.updated_by is nullable; all other captured columns, foreign keys/constraints and triggers remain unchanged.
- No billing function was invoked, including inspect/dueOwners; no customer/manuscript/financial/Storage object rows were read or mutated by verification. DDL installed function definitions without executing their bodies. No content recount or live two-account acceptance is claimed.

Evidence in task-2: pre247-metadata.json; dependencies247-metadata.json; approved247-application.sql and SHA256 sidecar; apply247-result.json; post247-metadata.json; post247-dependencies.json; post247-billing-permissions.json; 247-verification.json. Existing .244/.246 isolated PostgreSQL acceptance remains applicable; no unrelated build/audit rerun for this database-only application.

Rollback evidence remains preserved: STUDIO-RETENTION-ROLLBACK-2026-10-31.review.sql restores the captured two function definitions and two SELECT policies; the executor grant has exact REVOKE rollback. Billing rollback requires disabling callers, dropping/revoking this function, and restoring NOT NULL only after confirming no automated NULL updater rows exist. Preserve any subsequent financial/event history; never bulk-restore records. No rollback was needed or executed.

Database/security installation gate is now COMPLETE. Candidate .242 source/build remains unchanged. Release HOLD remains for separately authorized Worker/version and trusted binding setup, controlled domain/build-automation cutover with Pages rollback, ordinary authenticated two-account workspace/isolation/private-media/export acceptance, and Leigh's Stripe setup/test/live activation. Existing recipient/routing operational state remains an acceptance gate; catalog compatibility does not prove runtime workflows. No hosting, credentials, binding, domain, scheduler, Stripe, payment, refund, commit or push action occurred. Deferred automatic refund-policy implementation remains deferred.


### .267 existing installment contracts: required owner verification before activation
In addition to the six CURRENT offer price mappings, inspect existing enrollment contracts through the authorized owner workflow to determine whether any versioned legacy installment enrollments exist. If they do, retain their original offer version and original Stripe price identifier in the supported legacy installment mapping consumed by stripeProgramme.ts; verify the remaining fixed payment count and terms against those contracts. Do not substitute the current Collaborate two-payment price for a previous contract, reactivate historical prices for new purchases, or change existing subscriptions. If none exist, record that verified fact rather than guessing legacy identifiers. No live financial lookup or configuration was performed during this recovery. This is an owner activation prerequisite, not a new product or authorization to charge.
