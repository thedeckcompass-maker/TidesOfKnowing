# Deck Creator Studio Stage 9 release gate

Status: **hold production launch**. This document records what has been verified on the isolated feature branch and what must pass before the production schema, branch merge, public navigation and enrolment are enabled.

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
| Application build and Studio contracts | Passed locally | `npm run build` and all eleven `test:studio-*` commands passed. The Markdown export preserves nested card content and the production plan. |
| Feature preview | Staging callback configured; authenticated journey pending | The staging Supabase URL and publishable key are active: an invalid sign-in request returns normal email validation (HTTP 400). An unsigned webhook POST returns `Missing Stripe signature` (HTTP 400), confirming the test webhook secret is active. The owner reports saving the staging service key in Preview, but its use has not been verified. On 23 September, the explicitly approved `https://feature-deck-creator-studio-m3g9.tidesofknowing.pages.dev/auth/callback/**` was added to the staging Supabase Redirect URLs; the Site URL remains `http://localhost:3000`. Send a real sign-in link and check its return path before checkout. |
| Independent Workers Builds check | Failing | The check on application commit `2c024bb` failed, as it has on earlier feature and main commits. The GitHub check has no error annotations; inspect its Cloudflare build log and decide whether it is a required deployment gate before merge. |
| Complete creator journey | Pending | Run the browser/API acceptance steps above against the deployed staging preview. |
| Stripe test-mode lifecycle | Pending signed-in sandbox checkout | All three sandbox prices, the test Stripe key and a six-event webhook destination have been configured for Preview. The owner reports adding the staging project's server-only `SUPABASE_SERVICE_ROLE_KEY` to Preview. With the auth callback now allowed, exercise the real event lifecycle and inspect database effects; an unsigned webhook probe does not verify the server key. Keep API keys and webhook signing secrets out of Git and chat. |
| Production migration, merge, navigation and enrolment | Not started | Requires the preceding gates and an approved launch checklist. Existing production stays on `main` until then. |

## Recovery

Keep the previous production commit and migration log. If the production smoke test fails, disable public Studio entry points and enrolment, restore the previous application commit, and preserve private project and billing data for diagnosis. Database migrations add tables and grants, so do not drop creator data as an application rollback.
