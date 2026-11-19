> **Current amendment — Step 196G.5J.235:** Owner approved LOCAL nullable-updater/guarded-RPC implementation/testing at 15:48 UTC. Final October 31 commercial policy supersedes the historical pending questions and old Collaborate instalments below. New Collaborate: 2 x USD310, monthly; Develop: 3 x USD525. First payment starts twelve-month Create/six-month editorial; seven-day grace plus fourteen-day resolution; upgrades stop renewals with documented prepaid credit/refund and no automatic resumption. See STUDIO-COMMERCIAL-POLICY-2026-10-31.md and the .235 readiness entry. SQL candidate exists but is unexecuted: no local PostgreSQL engine. No production application approved. Historical proposal text follows for audit continuity.

# Exact Studio billing boundary request - 31 October 2026

This replaces the earlier recommendation to introduce a dedicated billing principal. Further installed-grant inspection identified an existing narrowly callable server-payment pattern: public.mark_compass_enrolment_paid is SECURITY DEFINER and executable by service_role (and postgres), not authenticated or anon. The Studio change can follow this pattern without a new principal, database or general service-role expansion.

## Decision requested

Approve this specific schema design before implementation: make the EXISTING studio_access.updated_by column nullable for automated billing, and add ONE guarded RPC, proposed name public.studio_apply_verified_billing_v1(jsonb), callable only by the existing trusted server service_role. Automated actions will use updated_by=NULL with explicit Stripe event/provider provenance in the existing ledger; manual actions continue recording the actual administrator. The RPC will atomically materialize verified paid access and its ledger intent/receipt. This is not permission to apply live SQL: after this material schema decision, prepare the executable migration and acceptance evidence for a separate live-application approval.

No new role, login, credential, table, public user grant, private-schema USAGE grant or direct table-write grant is proposed. The sole proposed existing-column constraint change is ALTER TABLE public.studio_access ALTER COLUMN updated_by DROP NOT NULL. No existing value is rewritten. No change to studio_manage_access or studio_confirm_founding_agreement_v1 is proposed. Do not grant billing authority to dcs_service_executor or impersonate an admin account.

## Why this exact function is needed

Installed privileges were checked, not inferred:

- dcs_exchange_connection inherits dcs_service_executor.
- dcs_service_executor can SELECT and UPDATE(body) on studio_private.service_ledger_v1, SELECT/INSERT service_receipts_v1 and assessment links, SELECT/INSERT editorial requests/replies, and UPDATE only request revision/status. It has no Studio access/capability writes.
- service_role can INSERT studio_access and UPDATE its expires_at, but cannot read/write the private ledger, use studio_private schema, or INSERT capability grants.
- studio_manage_access grants EXECUTE to authenticated and service_role, but its body requires is_admin(), rejects self-target, and applies the legacy six-month paid expiry. A service-key invocation is not an authenticated administrator; passing an admin JWT claim would misrepresent identity.
- studio_confirm_founding_agreement_v1 is an authenticated-admin manual founding workflow. Reusing it would impose old agreement/payment/start terms on the standard offers.

A further metadata check confirmed studio_access.updated_by is NOT NULL and references profiles(id). Automated inserts cannot truthfully use NULL today; a new login role would not solve this profile foreign-key requirement. Inventing a human actor, creating a fake user or silently retaining a previous administrator as the updater is not acceptable. This is why the single nullability decision is necessary.

A SECURITY DEFINER RPC with empty search_path and a server-role check can join the required existing access and ledger changes atomically while exposing neither private tables nor broad write permissions. Public/anon/authenticated EXECUTE would be explicitly revoked. The existing Compass RPC is the precedent for caller restriction, not a function to modify or reuse for Studio purchases.

## Exact proposed effect and limits

The function will accept only server-verified, versioned purchase evidence from the signature/retrieval adapter. It will check owner, offer, configured amount, provider identifiers, event identity and expected stored revision; lock the ledger/profile/access row; reject inactive/revoked accounts, conflicting events and stale state; and save the intent/receipt/access projection in one transaction. No browser-supplied price or expiry is authority. Exact provider paid-period timestamps must govern subscription access; date-only service-promise display fields must not shorten a paid period.

Existing customers are not migrated. Existing onboarding, timezone, manual/founding grant history, revocation and unrelated ledger entries remain intact. A new verified purchase must not shorten existing manual access or revive a revoked account. Programme support is six months and included Create is twelve months; Create subscriptions use paid periods. Missing provider provenance in old intents requires explicit reconciliation, not guessed backfill.

Do not automatically invent community capability membership from a price or overwrite existing capability grants. Included group sessions, consultations and written reviews remain tied to the existing versioned service promise/ledger. Any capability mapping not already approved must be identified separately.

Live application is a later explicit approval: relax only the reviewed updated_by nullability constraint, CREATE the reviewed function and GRANT only its EXECUTE to service_role. No table grants. No bulk UPDATE, live payment, existing subscription change, provider activation or deployment accompanies it.

## Rollback

Before first activation, preserve the exact affected access/intent/receipt state. To stop processing, disable the Studio billing caller and revoke service_role EXECUTE on this new function; retain incoming events for retry/reconciliation. Existing manual functions and permissions remain intact. Do not delete receipts, reverse customer access or reset the database automatically. Review any processed events before restoring individual states. If no event has executed, the new function can simply be removed after execution permission is revoked, and updated_by NOT NULL reinstated after verifying no NULL rows exist. After automated rows exist, do NOT reinstate NOT NULL or fabricate human attribution: retain the relaxed constraint while explicitly reconciling those recorded events. Data rollback is not an automatic inverse of the schema change.

## Local work completed without security expansion

- Existing-ledger lifecycle processing and idempotent synthetic transaction/rollback tests.
- Signed test-mode Create renewal/cancellation verification against retrieved invoice/subscription and internal ownership binding.
- Pure fixed-instalment schedule preparation: one phase of three approved billing intervals, end_behavior=cancel, exact USD210/USD525 price validation, no existing subscription adoption/update. It rejects missing cadence, mismatched price and live mode. Synthetic monthly input is only a fixture, NOT an assumed business decision. No Stripe call occurs.
- Upgrade/proration changes fail closed rather than guessing credits or altering existing subscriptions.

Evidence: step232-lifecycle.log, step232-stripe.log, step233-stripe.log under C:\Users\DELL 7410\Documents\Codex\2026-10-31\task-2. Schedule API verified against installed SDK declarations and https://docs.stripe.com/billing/subscriptions/subscription-schedules .

## Specific missing commercial decisions

The inspected handover, readiness register, offer source and preserved review material fix payment counts/amounts but do not establish these rules. Check parent-held prior approvals first; ask Leigh only if genuinely absent:

1. Instalment due dates: is it first payment on enrolment, then two monthly payments, or another explicit cadence/start arrangement?
2. Existing Create subscriber buying Collaborate/Develop: when should recurring Create stop, and is unused paid time credited, refunded, carried forward or handled without a price adjustment? No automatic cancellation/proration should be invented.
3. Missed programme instalment/refund: what happens to the remaining editorial and included Create access, and when? No grace period or automatic forfeiture is recorded in the inspected sources.
Develop 3 x USD525 and Collaborate 3 x USD210 are now VERIFIED against the owner October 24 20:48:36 final approval (message bd758652-5f99-4673-bb97-7c74471e1c83). Do not ask about amounts again. DCS Pricing.txt sections 11.4/12.3 explicitly leave the three policy questions above unresolved. Standard programme start is payment/enrolment day; first-instalment eligibility still needs its explicit policy. No automatic editorial renewal; Create is optional after included twelve months.

## Browser inspection: exact blocker

Action: enumerate existing ordinary signed-in browser sessions, before any authenticated acceptance.
Tool: cua.getState(). Failure: 'failed to write kernel assets: The system cannot find the path specified. (os error 3)'. A supported js kernel reset succeeded; the single retry failed identically. No windows were enumerated, so session/login state remains UNKNOWN.

Read-only diagnosis: repo/task/skill paths exist. The documented alternative node_repl/@oai/sky entry point is absent from available tools. load_workspace_dependencies reports 'Workspace dependency tools are only supported for local threads', despite this task retaining working Windows shell access. This is evidence of a desktop-tool routing/runtime problem, not a proven login or user-permission issue.

No reliable user-side repair is established. Do not ask Leigh to reinstall, change security settings, supply tokens or repeat account approval. Restore a supported desktop tool connection for this existing task; then inspect ordinary sessions. Ask for one normal sign-in only if the recovered UI actually requires it. No browser profiles, cookies, credentials or live creator writing were extracted.

## Step .236 amendment

Existing PostgreSQL 17.11 binaries were found through preserved acceptance scripts. Actual migration, role, rollback and atomicity tests now pass in a disposable copy of the existing synthetic cluster. The local engine blocker is resolved. Refer to the .236 readiness entry for the remaining installed-contract, runtime and financial-hook work. Production application is still not authorised; the candidate remains default-ROLLBACK.

## Step .237 activation boundary and owner setup

Concrete SDK and atomic database integrations are now locally tested; see the .237 master register. Zero npm audit findings and passing build do not remove hosted acceptance gates.

Approved prices (USD): Create12/month or120/year; Collaborate590 once or recurring310/month bounded to TWO payments; Develop1490 once or recurring525/month bounded to THREE payments. Fixed programme schedules must end in cancellation, never continue charging. Both programmes retain six months editorial and twelve months Create from successful initial payment. Existing historical purchases retain their versioned terms.

Test webhook endpoint: `/api/studio/billing-webhook/`. Supported verification covers checkout completion/async success, paid/failed invoices, supported subscription lifecycle events and settled refund updates with recorded agreements. No endpoint was registered in Stripe.

Explicit server TEST bindings implemented but NOT set: `STUDIO_BILLING_TEST_ENABLED`, `STUDIO_STRIPE_TEST_SECRET_KEY`, `STUDIO_STRIPE_TEST_WEBHOOK_SECRET`, `STUDIO_STRIPE_TEST_PRICES_JSON`, `STUDIO_BILLING_ADMIN_ID`; reuse existing approved `PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` server bindings. Never provide secret values in chat or source. Keep billing disabled until the reviewed RPC/retention installation and acceptance are authorised. Live keys/events are intentionally rejected; final live-mode release activation is a separate reviewed action, not a completed setup.

Rollback: disable the optional billing provider, restore application files only into an isolated copy of the verified .231 full recovery plus the selected checkpoint delta, and review differences before replacing a working tree. Do not use reset/clean. Before any approved database application, preserve exact installed definitions/policy/grant state. Default-ROLLBACK review scripts do not install anything. Restoring NOT NULL on updated_by requires reconciling any automated NULL records first; do not apply a blind reverse migration or invent human attribution. Creator data is never rollback test data.

The deferred refund policy document has no activation authority and is not part of this release's refund calculation logic.
