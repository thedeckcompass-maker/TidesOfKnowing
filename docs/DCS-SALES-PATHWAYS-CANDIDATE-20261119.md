> **Superseded status:** The pricing changes plus the separately authorised seventh Desk card are now live. See [DCS-SALES-DESK-RELEASE-20261119.md](DCS-SALES-DESK-RELEASE-20261119.md). The local-candidate record below is preserved as historical evidence.

# DCS sales pathways — local candidate, 19 November 2026

Status: implemented and locally verified; **not deployed**. Real-browser desktop and phone-width visual acceptance remains outstanding. No Production requests or writes were used for these checks.

## Authority and scope

Source: `C:\Users\DELL 7410\Downloads\DCS sales page pathways and pricing changes for Codex.pdf`, eight pages, read and visually inspected. Owner subsequently confirmed that Collaborate's written assessment and written review are the same service and approved “written review” consistently.

The existing Community admin brief is not a request to reinstall an older implementation. This candidate is limited to the supplied sales-page brief. The separate Creator's Desk seventh-card issue remains outside this candidate.

## Presentation changes

- Four-pathway heading; Collaborate and Develop prices display `/ 12 months`.
- Collaborate inherits Create and lists eight group sessions, one private consultation, one written review and twelve months of Create.
- Develop inherits Collaborate and lists only three additional private consultations (four total) and one additional written review (two total). It does not promise another eight group sessions.
- Renewal note appears immediately below the cards. The existing programme explanation remains beneath it.
- Comparison remains fully expanded immediately after the pathway section; Realise follows the comparison. Its approved copy is unchanged.
- Feature inclusion lines and the new mid-page secondary link lead to the pathway cards. Header desktop/mobile navigation includes Pathways. Each card's full-details link goes to its own comparison column.
- `#pathways` and `#compare` work; existing `#comparison` links remain valid. Pricing-page feature links return to the corresponding landing-page feature.
- Visible public FAQ answers and matching structured-data answers use written review. Other member/admin service terminology and internal assessment identifiers are outside this sales-page candidate.

Explore/Create benefits, prices, payment schedules, payment links, numerical offer contracts, six-month editorial service periods and twelve-month Create periods are unchanged. Checkout, Realise partnership copy, ownership/privacy copy and historical founding arrangements are preserved. No database, permission, account, payment-provider or video changes.

## Baseline and candidate

Accepted source: `.build-temp/dcs-report-menu-20261119/build`, all 951 source hashes verified before copying. Recorded accepted live Worker version `b21d8f54-fc4a-43ae-9d8d-4d47cc705a38`; Pages deployment `ed017d79-f2a6-492c-ae0d-aa598f67de82`. These identifiers were taken from the existing release records; this task did not change or re-query deployments.

Candidate directory: `.build-temp/dcs-sales-pathways-20261119`.

Only these application source files differ from the accepted baseline:

| File | SHA-256 |
| --- | --- |
| `src/data/studio/approved-public/presentation.json` | `2a91224865e5dad9918016c3312ff6d7619bd22905ccb54228b42a37731b9979` |
| `src/data/studio/creator-guidance.mjs` | `614c10c9a61e0d837588f8c16324ac5704622862e1bad02ce6b4a890556c501b` |
| `src/styles/dcs-approved-public.css` | `f4ce87d3ed224f8d2a62d547037d873ec4cfd8ab578d80a6ef59f62458952efd` |

The pre-existing local `passwordAuth.ts` message change was deliberately excluded by building from the accepted frozen source and overlaying only the three files above. The uncommitted working tree was preserved; no commit, reset or clean.

Packaged artifacts (prepared for review, not uploaded):

- Worker: `.build-temp/dcs-sales-pathways-20261119/worker`; manifest SHA-256 `e32e07511b46bdd72551cf18ff9c339030ff08da1b448cba3872cffc1178efe5`.
- Pages: `.build-temp/dcs-sales-pathways-20261119/pages/public`; manifest SHA-256 `3ef5342752c4482217628f17ea5fcbf767d796f04ebf394786d8be6c3be56ae5`.

## Verification

- `node scripts/dcs-sales-pathways.test.cjs`: passed. Checks exact inheritance, unchanged Explore/Create benefits and payment links, comparison body/totals, fragment targets, duplicate IDs, retained adjacent owner-approved content and unchanged service-offer contracts.
- `node scripts/build-dcs-sales-pathways.cjs`: isolated Astro production build passed; exactly three source differences.
- `node scripts/dcs-sales-pathways-candidate.test.mjs`: six compiled Astro renders passed (landing, pricing and FAQ; anonymous and authenticated). Checks include canonical URLs, registration/member destinations, section order, comparison links and FAQ terminology. All external fetches were forbidden; no emails or live content created.
- `node scripts/package-dcs-sales-pathways.cjs`: passed. Existing public assets and scoped Worker adapter preserved; no binding changes. Package receipt and source association are in the candidate directory.

Responsive grid/table containment is retained and target highlighting added. These checks do **not** establish visual acceptance on a real phone or desktop browser. No Computer Use or Windows browser automation was attempted.

## Next step

Owner review and separate deployment approval are required before publishing this candidate. Use the established coordinated Worker/Pages procedure, with fresh identity/route/configuration checks and separate rollback targets recorded immediately before any approved deployment. Do not deploy the separate pending auth-message candidate or change the Creator's Desk as part of this release.
