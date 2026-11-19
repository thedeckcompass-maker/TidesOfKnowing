# Community moderation submission defect — corrected live

Owner authorised the submission fix, correction of its regression test and deployment only. No discussion/comment moderation or deletion was authorised as part of this release.

## Exact change and test correction

One application file changed, with one line replaced: src/scripts/studioCommunityAdminLayout.ts now posts to the fixed existing `/api/studio/community-completion` endpoint instead of reading `form.action`. A hidden input named action=moderate shadows the HTMLFormElement.action property in browsers. The previous DOM test shim incorrectly forced that property to return the action attribute, masking the defect.

scripts/dcs-community-admin-layout.test-v2.mjs now models that named-property override and requires a URL string in the mock submission. The scoped release test also explicitly asserts form.action is an INPUT and mutation-tests the old handler. submission-regression.json records oldHandlerRejected=true and fixedHandlerPassed=true. The seven existing scoped admin-layout checks pass under the corrected model. Synthetic provider requests only; no real browser automation, Production moderation, emails or notifications. The first negative-test run was stopped because Node attempted an expensive full-DOM assertion diff; the mock now validates the argument type first, preserving the regression and avoiding that diagnostic problem.

The compiled-endpoint-check.json verifies the explicit endpoint in the generated script and exact one-line replacement against the previous deployed source. source-association.json verifies that all other application source files match the deployed layout candidate. No API, SQL, permissions, layout, commercial content or configuration changes.

## Live release

- Worker version: ba241bac-c40f-4f95-8f80-4a8ee7017181.
- Worker deployment: 6cfe1f06-ae26-4677-869c-e3709ab4f929.
- Pages Production: b11bb4a0-2424-4889-898a-0b646f943acc; completed 2026-11-19T05:22:20.167Z (18 November, 11:22 p.m. Mérida).
- Worker manifest SHA-256: 85e7113f3dbf4e661d19e1bd4be0ca192d43941fe171df3d4a7420e66c1056e2.
- Pages manifest SHA-256: 73ad5e6a531f120bfb8623ab56cc0bdab4ea1716e0f633df479e8e2bdbe74d43.

Evidence: .build-temp/dcs-community-admin-submit-fix-20261118. Existing public static assets preserved byte-for-byte; new hashed script added. Scoped adapter and Production settings are unchanged. The live-script-verification.json confirms the corrected JavaScript bytes match the package. The standard guarded release verifies exact serving identities, all thirteen routes, runtime/binding fingerprints and Pages configuration preservation; billing/video remain inactive.

Rollback: `node scripts/dcs-community-admin-submit-production-release.cjs rollback` guards current identities and restores Pages d37de523-7af6-4be2-b501-a090962fa637 followed by Worker b88436e4-b10a-46cd-82fe-3aae7ca00977, preserving existing bindings. That prior version contains the diagnosed submission defect; rollback is containment, not a functional fix. No database rollback is involved.

## Records and remaining owner action

data-preservation.json records exact before/after matching post and reply row hashes, existing audit/report hashes, account identity/confirmation/creation digest, profile digest, entitlement/access digests and notification count. Three discussions remain published and all six comments remain intact. No hide/delete, account grant, permission change, notification send, production migration or unrelated deployment was performed.

Owner should reload https://www.tidesofknowing.com/ask-leilia/admin/studio-community/ to receive the new script. A genuine owner Hide action was deliberately not performed to validate this fix. Receipt verification and actual owner moderation remain to be observed after the owner chooses to act. The prior generic error did not hide any discussion or create an audit record.
