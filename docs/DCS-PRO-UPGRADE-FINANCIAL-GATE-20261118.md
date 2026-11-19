# Supabase Pro upgrade — financial gate

Observed 18 November 2026 in the authenticated Supabase dashboard. This supplements the earlier Free Plan provisioning blocker; it does not replace its historical record.

## Exact organisation and quote

- Organisation: `thedeckcompass-maker's Org`, `arkimixmzjlgixqvhnir`; current plan remains Free.
- Protected Production: `vbdqvjvhjleqdadiiqjx`; protected Preview: `utzcmbidotxgmulguzxo`. Both are active Nano projects. The third, older project is already paused and was not changed.
- Dashboard: `https://supabase.com/dashboard/org/arkimixmzjlgixqvhnir/billing?panel=subscriptionPlan`.
- Pro confirmation screen: **Charge today $25.00; Monthly invoice estimate $35.00**, before adding the temporary acceptance project.
- The confirmation explicitly says one project's Micro Compute is included and each additional project costs $10+/month regardless of compute size.
- The billing page reports Spend Cap enabled and no payment methods. No payment information was entered and **Confirm upgrade was not clicked**.

## Why execution stopped

The owner authorised a maximum $25 base subscription for the intended month, with no additional paid usage or compute without separate approval, and explicitly required stopping if additional charges are mandatory. The actual $35 estimate exceeds that scope. The temporary project's cost is additional to this estimate, not included in it.

Official compute documentation confirms $10 monthly organisation compute credits, Nano billing at Micro rates in paid organisations, and Micro at $0.01344 per hour. Existing Nano sizes are not automatically upgraded because changing compute incurs downtime. Thus a plan upgrade does not require changing the protected project compute sizes, but does change their billing. Spend Cap does **not** cover compute hours.

For illustration only, two existing projects running 730 hours each plus one temporary Micro running 24 billed hours gives $25 + (1460 + 24) × $0.01344 − $10 = **$34.94496**, before applicable tax or any other charges. This is an estimate, not a capped vendor quote; billing-cycle length and rounded running hours affect the invoice. Do not treat $25 due today as the total monthly cost.

Sources checked:

- https://supabase.com/docs/guides/platform/manage-your-usage/compute
- https://supabase.com/docs/guides/platform/manage-your-subscription

## State and continuation

No organisation upgrade, payment, project provisioning, migrations, Auth identities, creator records, Storage objects, entitlement changes, deployment or protected-environment changes occurred in this operation. No application code was edited or tests rerun. Only this local documentation record was added; all pre-existing working-tree changes were preserved.

The temporary project `dcs-connected-acceptance-20261118` does not exist. No temporary project reference, creation time, 24-hour deadline or teardown exists. Genuine connected acceptance remains pending; no connected defects were established or corrected. The compatibility SQL remains `docs/DCS-INTEGRATED-CREATOR-COMPATIBILITY-20261118.REVIEW.sql`, a ROLLBACK-only review packet, not an approved installable production migration.

Existing candidate paths remain `.build-temp/dcs-production-worker-candidate-20261118-v6` and `.build-temp/dcs-pages-workspace-grant-20261118-v4/public`. They were not rebuilt or revalidated during this financial check. Their previous evidence and separate production rollback arrangements remain recorded in the creator launch implementation records; no release readiness upgrade is claimed here.

Pro is monthly, not a one-month automatic cancellation. Official documentation says downgrades take effect immediately, unused prepaid subscription value becomes organisation credit rather than a payment-method refund, and excess usage is settled on plan change. Downgrade eligibility and live-service compatibility must be checked at that time. Do not downgrade, pause, transfer or delete protected projects to fit this budget. Temporary-project deletion alone will not eliminate compute charges from both existing active projects while the organisation remains Pro.

Next action: obtain a revised explicit financial ceiling covering mandatory existing-project compute and up to 24 hours of one temporary Micro project, before any upgrade confirmation. If approved, verify the live quote again, then hand payment-method entry/owner payment confirmation to the owner in the authenticated billing dashboard. Do not request credentials in chat. Production migration/deployment and the genuine owner account/grant remain separately unauthorised.

## Follow-up — cumulative $40 authority and payment boundary

The owner subsequently authorised a maximum **$40 cumulative**, including subscription, all operation-related compute/usage and applicable taxes. This replaces the earlier $25-only financial limit; it does not authorise payment above $40 or indefinite renewal.

The authenticated dashboard was rechecked on 18 November 2026. It still reports Free, no saved payment method, $25 charge today and $35 monthly invoice estimate. Its upgrade dialog now displays payment confirmation and incomplete billing-address fields. No fields were filled, payment confirmation submitted or upgrade action executed by Codex. No sensitive payment values were copied into project evidence.

Billing relationship: official invoice documentation says fixed subscription fees are prepaid and usage is billed in arrears. The $25 is the base subscription component of the approximately $35 monthly economic cost, not an additional second base fee for the same service period. However, a renewal invoice includes the next period's prepaid subscription plus the prior period's usage. Therefore $25 today followed by an approximately $35 renewal invoice would be approximately $60 cumulative cash charges before tax and temporary compute; it is not safe to permit renewal under a $40 cumulative authority.

Reference: https://supabase.com/docs/guides/platform/your-monthly-invoice (fixed fees, usage fees and invoice example); https://supabase.com/docs/guides/platform/manage-your-subscription (usage settled on plan change, immediate downgrade and unused fee credited rather than refunded).

The earlier $34.94496 example for 730 running hours per protected project plus 24 temporary hours is a first-period pretax estimate. For a 31-day/744-hour illustration it becomes $25 + (1488 + 24) × $0.01344 − $10 = $35.32128. Neither figure is a confirmed tax-inclusive cap. Applicable tax, actual billing period/renewal date and final charge remain unconfirmed because checkout requires the owner's payment/billing details. The remaining margin below $40 is insufficient to assume any possible tax. No tax rate is inferred from the selected country.

Exact minimum owner action: in the existing organisation billing upgrade dialog, complete or verify payment-method and billing-address details personally, then stop before **Confirm upgrade** and provide the displayed tax-inclusive charge/estimate for verification. Do not pay or confirm a subscription renewal based on the pretax estimate alone. No billing credentials should be sent in chat. If the dialog cannot establish the tax-inclusive exposure, obtain the exact tax-inclusive quote through Supabase before payment. This is the owner-entry boundary explicitly required by the request.

Status remains: actual operation charges executed by Codex $0; upgrade not completed; no confirmed renewal date; no temporary project/reference or deletion to perform; connected acceptance pending; SQL remains review-only; existing application artifacts unchanged; no production migration/deployment approval requested yet. Downgrade compatibility remains unverified and must not be assumed or used as an automatic budget-control promise. No protected database, application code, deployment configuration or existing Git changes were altered in this follow-up.
