# Combined privacy policy — live publication receipt

> Later update: the simplified daily retention job was enabled on 19 November 2026. See [retention release](DCS-RETENTION-SIMPLE-RELEASE-20261119.md). The OFF status below describes the earlier policy-publication checkpoint.

Owner-authorised publication completed **19 November 2026, 08:11:43 UTC**.

Live policy: https://www.tidesofknowing.com/privacy/

## Published wording

The combined policy covers Tides of Knowing, Ask Leilia, COMPASS, Deck Creator Studio, the Studio Community and related support. The operator is Tides of Knowing, operated by Leilia Spencer. Contact: `hello@tidesofknowing.com`.

The owner explicitly removed Mérida and business/address placeholders. Neither the location nor an address placeholder appears in the published policy. The earlier reported-content placeholder is replaced by the owner's agreed rule:

- Hidden content: normally 12 months from the hide date, subject to reports, disputes and legal requirements.
- Reported content: while open and 24 months after final resolution; a reopened report restarts that period at its latest resolution.
- The applicable hidden-content period must also have ended. Necessary disputes, investigations and legal obligations can extend retention, with review when they end.
- The policy explicitly states **automatic deletion is currently disabled**.

Approved text is preserved in `docs/DCS-COMBINED-PRIVACY-POLICY-APPROVED-20261119.md`; the application source is `src/pages/privacy.astro`. The earlier draft remains historical and is superseded.

## Deployment scope

**Pages-only release.** The privacy route is served by the existing Pages application, outside the consolidated Worker's scoped routes. No Worker deployment or database operation was required.

| Item | Value |
| --- | --- |
| Pages project | `tidesofknowing`, main Production |
| Final Pages deployment | `739487a0-ca3c-4bb7-b45e-b8f594677385` |
| Previous Pages / rollback target | `7214b1e3-5599-4caa-b78e-ab60b39d8bd8` |
| Unchanged Worker version | `3ab57fa1-f92b-4207-8bc3-a07955a73de8` |
| Unchanged Worker deployment | `8134227a-7ded-45c1-998c-8f48243d8632` |
| Frozen policy packet | `.build-temp/dcs-privacy-policy-20261119` |
| Pages manifest SHA-256 | `f2b5489f65d3bcf8bfe545fe0a3066089a430a27a9b6deb33713e229a119a7c7` |
| Privacy source SHA-256 | `ffd6c3c1472fbad938d7a82d15b19dc05bccf50264821737e220626e134bb856` |
| Normalised published policy-text SHA-256 | `51e5121f0b1656334a2a70a3e99e294a3f7535ff77618c1940e2fa3755ce04b6` |

The Pages server was built from the latest accepted frozen source with **only `src/pages/privacy.astro` changed**. Existing legal-page styling and the Pages adapter were retained. All existing public static assets were preserved byte-for-byte; no new client assets were necessary. All 13 Worker routes, Worker bindings/runtime, Pages configuration and domain assignments were verified unchanged.

There were no database migrations, account or entitlement changes, content moderation actions, notification sends, retention jobs or deletion settings changes. Billing and video functionality were not activated. No working-tree reset, clean or commit occurred.

## Verification and one controlled retry

The compiled Astro privacy page was rendered locally without network access or browser automation. Checks confirmed the approved text, both retention periods, correct date/contact/canonical URL, and absence of address lines, placeholders and draft labels.

The first deployment, `4826fff8-e1bc-406d-8d96-3d2397ec128d`, was automatically rolled back to the preceding Pages deployment after its raw-text verification failed. The cause was the site's existing Cloudflare email protection: public HTML substitutes an encoded email and “[email protected]”, which the browser decodes. The verifier initially compared that raw representation with the unobfuscated source text.

Read-only inspection of the prior live policy confirmed that its encoded contact decodes to the approved address. The verifier was corrected to account for the existing `data-cfemail` encoding. **No email-protection setting or policy wording changed.** The identical, pinned artifact was then redeployed and verified successfully.

Final verification compared the whole published policy article with the compiled approved article, accounting only for the existing email encoding and whitespace. The policy stylesheet returned 200 with the expected hash. Homepage, COMPASS article, representative repeating-card page, DCS landing, registration and Studio/admin signed-out routes retained their prior statuses, titles, canonical URLs and redirects.

Evidence is in the ignored policy packet: `source-association.json`, `build-result.json`, `content-verification.json`, `package-receipt.json`, `pages/PACKAGE-MANIFEST.json`, `preflight.json`, `preflight-attempt2.json`, `email-protection-diagnostic.json`, the preserved failed-attempt receipt, and final `deployment.json`.

## Recovery and continuation

Guarded Pages-only rollback is prepared:

```powershell
Set-Location -LiteralPath 'D:\Projects\Tides-of-Knowing\workspace'
node scripts/dcs-privacy-policy-production-release.cjs rollback
```

It verifies the current policy deployment and unchanged Worker/routes/configuration before restoring Pages `7214b1e3-5599-4caa-b78e-ab60b39d8bd8`. It does not roll back the Worker or database. No rollback of the final successful release was needed.

For subsequent builds, preserve this approved privacy source. The latest Pages source snapshot is the policy packet's `build/src`; the live consolidated Worker remains the Community inbox v4 artifact. Do not restore the older privacy page from the inbox baseline when preparing a later release.

The policy is now published. **Automatic deletion remains OFF**; enabling or executing retention processing remains a separate action requiring owner authorisation.
