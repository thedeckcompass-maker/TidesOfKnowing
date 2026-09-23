# Deck Creator Studio Stage 9 release gate

Status: **hold production launch**. This document records what has been verified on the isolated feature branch and what must pass before the production schema, branch merge, public navigation and enrolment are enabled.

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
| Feature preview | Pending | Confirm the Pages check on the final candidate commit and inspect the deployed route responses. |
| Independent Workers Builds check | Failing | The check on application commit `2c024bb` failed, as it has on earlier feature and main commits. The GitHub check has no error annotations; inspect its Cloudflare build log and decide whether it is a required deployment gate before merge. |
| Complete creator journey | Pending | Run the browser/API acceptance steps above against the deployed staging preview. |
| Stripe test-mode lifecycle | Pending | Use configured test-mode credentials and events; do not infer this from local contract tests. |
| Production migration, merge, navigation and enrolment | Not started | Requires the preceding gates and an approved launch checklist. Existing production stays on `main` until then. |

## Recovery

Keep the previous production commit and migration log. If the production smoke test fails, disable public Studio entry points and enrolment, restore the previous application commit, and preserve private project and billing data for diagnosis. Database migrations add tables and grants, so do not drop creator data as an application rollback.
