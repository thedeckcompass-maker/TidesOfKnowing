# Deck Creator Studio Stage 9 release gate

Status: **hold production launch**. This document records what has been verified on the isolated feature branch and what must pass before the production schema, branch merge, public navigation and enrolment are enabled. Creator ownership, complete export, exit, refund and interface requirements are tracked in [the creator trust and interface pass](./deck-studio-creator-trust-interface-pass.md).

## Live Stripe catalogue prepared for launch

The owner created these products and monthly USD prices in the live Stripe catalogue on 23 September 2026. Price IDs are public identifiers, not API credentials. They are recorded for the later production billing integration and **must not** be entered into the preview's `STUDIO_STRIPE_TEST_PRICE_*` variables.

| Plan | Monthly price | Live product ID | Live price ID |
| --- | ---: | --- | --- |
| Deck Creator Studio | US$197 | `prod_VJHJo8CfJW3Cto` | `price_1UIekXA1ktB58WIReBdbeLuH` |
| Guided Deck Circle | US$597 | `prod_VJHOuAHwzmsNDM` | `price_1UIepeA1ktB58WIR50nycEAr` |
| Private Deck Partnership | US$1,495 | `prod_VJHQojrELg7j34` | `price_1UIes4A1ktB58WIRqEpdOyxz` |

Stripe Checkout now presents a promotion-code field for Studio subscriptions. This does not switch the preview to live billing. A 100% promotion cannot verify failed payments or genuine charges, so the test-mode lifecycle gate remains required.

## Stripe test-mode catalogue for the isolated preview

The owner created these products and monthly USD prices in the Tides of Knowing **Test mode** sandbox on 23 September 2026. Use these price IDs only with this sandbox's test secret key and the preview's `STUDIO_STRIPE_TEST_PRICE_*` variables.

| Plan | Monthly price | Test product ID | Test price ID | Preview variable |
| --- | ---: | --- | --- | --- |
| Deck Creator Studio | US$197 | `prod_VJI1FBZjyCpYYz` | `price_1UIfQzA1ktB58WIRtfP76M3O` | `STUDIO_STRIPE_TEST_PRICE_STUDIO` |
| Guided Deck Circle | US$597 | `prod_VJI2zuM0KJvyM9` | `price_1UIfSAA1ktB58WIRj8VhgLr2` | `STUDIO_STRIPE_TEST_PRICE_CIRCLE` |
| Private Deck Partnership | US$1,495 | `prod_VJI3r9zNro1Vse` | `price_1UIfTCA1ktB58WIRg4Hraiwi` | `STUDIO_STRIPE_TEST_PRICE_PRIVATE` |

## Scope and sequence

1. Verify the exact candidate commit on the feature branch and its Cloudflare Pages preview. The preview uses the isolated Studio staging database.
2. Exercise a complete creator journey in the preview with a test account: enrolment, onboarding, Bird Oracle manuscript and version history, programme unlocking, journal, production plan, exports and cancellation/read-only behaviour.
3. Complete Stripe **test-mode** checkout, invoice payment, failed payment, renewal and cancellation events. Confirm the billing event ledger, entitlement changes, idempotent replay and creator access after each transition. Confirm the three test price IDs and webhook destination are configured for the preview.
4. Review support consent, artist introduction and community sharing flows using accounts in their respective roles. Check that an unrelated account cannot access a creator's private record.
5. Check the preview build and the independent Workers Builds check. Resolve any release-blocking build failure and review monitoring/rollback access before launch.
6. Approve the checklist, apply the Studio migrations to production in order, merge the reviewed commit, then enable public navigation and enrolment. Smoke test the production journey and monitor billing, errors and privacy events. Stop and roll back the public entry points if a gate fails.

## Evidence recorded on the feature branch

| Gate | Result | Evidence / next action |
| --- | --- | --- |
| Encrypted Bird Oracle import in staging | Passed | 8 families, 78 cards, 162 guidebook sections, 248 provenance records; 156 card-linked sections, no missing versions or invalid card links. Stage 8 replay inserted or updated zero records. |
| Production-plan schema | Passed in staging | Applied `20260923070000_deck_studio_production_plan.sql` to staging only. Insert, update, version increments and two history snapshots passed in a rollback-only transaction. |
| Authenticated Studio table grants | Passed in staging | `20260923080000_deck_studio_role_privileges.sql` applied. Creator could read the full deck with a temporary transactional entitlement; an unrelated identity could read zero cards and plans. Stage 9 acceptance run `35803596420` passed. |
| Practice Commons OTP claim gate | Passed in staging and Preview | A Preview registration attempt failed before email delivery because the staging project lacked `auth_otp_submission_claims` and its RPCs. Applied the repository migration `20260714240000_auth_otp_submission_claims.sql` to staging in one transaction. Verified the table and both functions exist, forced row level security is enabled, `service_role` can execute the claim RPC and `anon` cannot. A subsequent real `join` claim completed and the active `Studio Test Creator` profile was created on 23 September. |
| Application build and Studio contracts | Passed locally | `npm run build` and all eleven `test:studio-*` commands passed. The Markdown export preserves nested card content and the production plan. |
| Feature preview | Latest Pages deployment passed; authenticated creator journey pending | The feature branch now points to `02274246680e4dbc8a3d91ceb9d0dc7920a48947`, whose tree matches the local `4d1a033` candidate. Cloudflare Pages reported success at `https://feature-deck-creator-studio-m3g9.tidesofknowing.pages.dev/` on 23 September 2026; the preview serves the new editor styles. An unauthenticated request to the test card redirects to registration. The owner previously signed in, completed one US$197 Stripe sandbox payment, submitted onboarding, and created the test project and card. Authenticated acceptance of the new editor controls and remaining creator journey is pending. |
| Independent Workers Builds check | Failing | A separate `Workers Builds: tidesofknowing` check was triggered by the feature push and failed on `0227424`, while the Pages feature preview succeeded. Its Cloudflare link points to a production Worker build area. There is no evidence that this failed build deployed a Worker, and no production action was initiated in this pass. Inspect the Cloudflare build log and branch deployment settings before treating the check as a release gate. |
| Complete creator journey | Onboarding, project, family and card creation reached; writing journey pending | The owner submitted onboarding and created a staging test project with the commercial/crowdfunded pathway, planned deck size 78 and Kickstarter purpose. The project route was `/studio/projects/2b55720e-1bfa-4cab-bf66-9bbe6c8f4d43/?created=1`. After the family/card test, the browser reached `/studio/projects/2b55720e-1bfa-4cab-bf66-9bbe6c8f4d43/cards/fae21908-1a7c-4217-9147-cca1a408062c/?created=1`. Verify that a card edit persists on refresh and creates a recoverable version; then exercise guidebook, programme, journal, production and exports, and check access from an unrelated account. A planned deck size of 78 does not itself create 78 cards. |
| Stripe test-mode lifecycle | First payment and subscription grant passed; reconciliation and lifecycle pending | One sandbox payment succeeded. Stripe's `customer.subscription.created` delivery initially returned HTTP 500 because the isolated staging `service_role` lacked billing table privileges. Migration `20260923170000_deck_studio_billing_service_privileges.sql` was applied to staging; resending the existing event produced an active write entitlement. The checkout reservation was still pending at the last staging diagnostic, so verify and reconcile the separate `checkout.session.completed` event from the **same payment**. Do not create another payment for this check. Then test invoice paid/failed, renewal, cancellation, duplicate delivery and ledger effects. The current webhook does not check several database write results, marks events completed after those unchecked writes, and treats a repeated event ID as successful even when its previous attempt failed. Fix these failure and replay semantics before relying on the ledger or attempting the remaining lifecycle gate. |
| Creator trust and interface | Requirements captured; launch disclosure pending | Complete the linked pass before paid public launch, including one project-folder export from account, a defined exit/deletion policy, a Studio-specific refund decision and matching product copy. |
| Persistent editorial save control | Deployed to feature preview; authenticated acceptance pending | Card, guidebook and journal editors have a persistent save bar, unsaved status, optional five-minute reminder, keyboard save, a leave-page warning for unsaved edits, and a save request that keeps typed text on screen if the server does not confirm success. The update built locally and passed the related Studio contract tests. Cloudflare Pages deployed the matching candidate; verify saving, refresh and reminder preference using the signed-in staging test card. |
| Inspectable manuscript history | Staging migration passed; authenticated acceptance pending | Card and guidebook histories show changed fields, line changes, full saved content and the effect of restoring against the current version. A confirmation is required and the database RPC rejects a stale current version. Migration `20260923183000_deck_studio_restore_provenance.sql` adds an atomic, owner-only restore with a reference to its source version. Staging-only GitHub Actions run `35899302004` applied the migration and passed function-grant checks and a rollback-only restore of the test card. Earlier restores, including the owner's existing Version 4, predate provenance: identical content may be identified as a match, but its source must not be claimed as recorded. Verify the version review and confirmation in the signed-in feature preview. |
| Production migration, merge, navigation and enrolment | Not started | Requires the preceding gates and an approved launch checklist. Existing production stays on `main` until then. |

## Recovery

Keep the previous production commit and migration log. If the production smoke test fails, disable public Studio entry points and enrolment, restore the previous application commit, and preserve private project and billing data for diagnosis. Database migrations add tables and grants, so do not drop creator data as an application rollback.
