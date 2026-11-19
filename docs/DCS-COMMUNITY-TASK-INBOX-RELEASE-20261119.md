# DCS Community task inbox — Production release receipt

Released 19 November 2026. Application pair verified at 07:44:40 UTC; new inbox assets verified at 07:45:51 UTC. Owner-authorised implementation and deployment; no content cleanup was authorised or performed in this release.

Live owner entry: https://www.tidesofknowing.com/ask-leilia/admin/studio-community/

## Installed behaviour

- Shared tasks; separate read state for each administrator; completion actor, time, method and immutable event history. Only the existing assigned active administrator is admitted. No bot or second administrator was enabled.
- New and Opened remain outstanding. All clear requires zero outstanding work, including separate editorial work; zero unread counters alone is insufficient.
- Four attention counters, eight pillar unread tiles, Inbox / Done / Hidden content / Moderation log, server-side filtering and exact counts, 25 rows per page, compact rows and explicit action confirmation. Moderation log retains its existing records and has server paging.
- The existing live discussion and reply form are reused with a bounded internal task/return marker. A correctly targeted community reply and task completion are one database transaction. Readback precedes return to the same filters and page. Undo changes completion only and preserves the published reply and earlier history.
- Reports require Hide or Dismiss with a reason. Replying does not resolve them. Direct supported moderation resolution also records report-task completion. Moderation checks both task version and the content timestamp shown to the administrator.
- Task completion and content visibility remain independent. Hiding moves unfinished work out of Inbox; restoring brings unfinished work back without erasing earlier Done history. Scribes do not create tasks.
- The empty private/founders room is retired from creator navigation, welcome/help text, authoring choices and administration. Its legacy Studio URL redirects to the shared Community. Both empty private section records are inactive; the admission grants themselves remain byte-for-byte unchanged.
- Badge projection uses trusted server records. Complimentary Develop maps to Develop; recognised active programme promises can project Explore, Create, Collaborate, Develop or Realise. Ambiguous or unrecognised access shows no pathway badge. Founder requires the actual founding completion-receipt contract, not private admission or Leilia's identity. There are zero completion receipts, so no Founder badges currently show.

The supplied HTML mockups were read as references only. Their support.js and bundled React runtime were not installed, executed, copied into application source or published.

## Production installation and identity

Supabase project `vbdqvjvhjleqdadiiqjx`, `tides-of-knowing`, healthy, `ap-southeast-1`, host `db.vbdqvjvhjleqdadiiqjx.supabase.co`. Protected Preview and the deleted acceptance project were not used.

| Installed migration | SHA-256 |
| --- | --- |
| `supabase/migrations/20261119073920_dcs_community_task_inbox.sql` | `752cfa375e2c12400fd215b33d6326e917c2cc5804bad40c6f2520fce8da66eb` |
| `supabase/migrations/20261119074429_dcs_inbox_report_author.sql` | `4a5e69f066dedbdd9e21d62980447c17d7539da3b5b42c0a3680ed0394c5e5b8` |

Both installation calls succeeded and both versions are recorded in Supabase migration history. CLI-created filenames were aligned to the actual recorded server versions; original CLI files are retained in the ignored evidence packet. SQL bytes were preserved.

The second migration corrects report-row author attribution: a reported comment uses that comment's author and tier, rather than the parent discussion's author. The view change was guarded against its exact prior definition and tested with different authors. No content or existing task rows were rewritten; there were zero tasks at installation.

New private tables: `community_tasks_v1`, `community_task_reads_v1`, `community_task_events_v1`, `community_task_commands_v1`, `community_task_exclusions_v1`. All have RLS and no direct anon/authenticated table privileges. Five source capture triggers are installed. Explicit public RPCs have empty search paths and are owned by postgres. Anonymous execution is revoked. Existing Supabase default service-role execution remains; staff RPC bodies independently require the existing assigned active administrator. No new account, role assignment, customer entitlement or executor capability was granted.

The existing member reply, report, moderation and staff-identity function definitions were not replaced. Existing RLS-policy fingerprint remained `b2ec4e78830d39ef4f6f002d99eab307`. Advisor notices about deny-all private tables and authenticated SECURITY DEFINER RPCs were reviewed against the explicit ACLs and staff guards; no new anonymous executable API was introduced. Existing unrelated advisor findings were not changed. Supabase references: [private-table RLS notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [authenticated-function notice](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Application deployment

| Resource | Final identifier |
| --- | --- |
| Worker | `tidesofknowing-consolidated` |
| Worker version | `3ab57fa1-f92b-4207-8bc3-a07955a73de8` |
| Worker deployment | `8134227a-7ded-45c1-998c-8f48243d8632` |
| Pages project | `tidesofknowing`, main Production |
| Pages deployment | `7214b1e3-5599-4caa-b78e-ab60b39d8bd8` |
| Frozen packet | `.build-temp/dcs-community-inbox-20261119-v4` |
| Worker manifest SHA-256 | `9e51b38c42ec2dff4ec1c18a4d18851a5616a93bf69f460d07add59d71e06fb8` |
| Pages manifest SHA-256 | `0276f6bf27b0670d2620d6ef92bdcc4ad08e9aceb1b4d5c717830bbde3d7c522` |

All 13 original Worker routes, domain assignments, Hyperdrive, bindings, encrypted secrets and Pages deployment configuration were preserved. Effective Supabase remains Production. Binding fingerprint `e7b4c9176ad315cea2d093e0d6a3595b64304dc7fd316235a461c355252f0a05`; runtime fingerprint `4a29f243fccf22429414c679f088ae33172e2f103faa6ca4e0a4482173469c53`; Pages configuration fingerprint `dd835396a37c46513690b369f6ef7cb0d89c69bbb7af005f5d2cb6e191203e67`.

The existing scoped adapter and all existing public static assets were preserved. New hashed client assets were added. Public Tides pages, DCS landing/pricing/FAQ, registration, Studio authentication routing, representative repeating-card metadata/canonical URLs and editorial image/CSS delivery passed read-only live checks. New inbox/thread JS and inbox CSS returned 200 with matching SHA-256. Signed-out admin access returned 404. No browser automation or Computer Use was used.

Billing flags remain false; no video, recording or transcription binding was activated; Worker schedules remain empty. No new commercial terms, providers or paid resources were introduced.

An earlier candidate version `145d093c-1be2-438b-826b-29443c23dd7c` was uploaded inactive, never activated. The final version above includes removal of the remaining private-room wording in creator welcome and chapter help.

## Preservation and current state

Fresh pre-install and final post-release fingerprints match for all three discussions, all six comments, stable profile fields, Auth account identities, Studio access, all capability grants, all reports and all moderation actions. Notification events remained zero. Existing owner sign-in activity refreshed `last_seen_at` and `updated_at` before installation; stable profile fields were fingerprinted separately to avoid misclassifying that normal activity as a role change.

The exact three test questions and six test comments have nine explicit exclusion/provenance entries. They have no inbox tasks, do not affect counters, and were not edited, hidden, restored or deleted. Exclusions apply to those exact records; a future genuine contribution or new report is not silently ignored simply because its thread contains preserved test material.

Final owner-guarded read-only database checks: tasks **0**; all four counters **0**; outstanding **0**; Inbox rows **0**; Hidden content rows **5** (includes preserved comments under the already-hidden discussion); contextual moderation-log records **8**. Existing published/hidden states are unchanged. Founder completion receipts **0**.

The two preserved private-community grants belong to Mere Te Kauri (`TheMereArtist`) and Leilia (`Leilia`). Both record an expiry of 2 November 2026, 15:02 UTC. Neither grant nor account was changed, and no explanatory message was sent. Recorded expiry is not a determination of any separate promise made to a person.

## Validation and limits

- Isolated PGlite PostgreSQL tests: 20 focused check groups. Actual accepted reply/moderation/report functions were used with synthetic records. Coverage includes role denial, per-admin state, exclusions, atomic/idempotent reply completion, undo, report resolution, hide/restore, new comments on completed threads, 25-row paging and bulk actions, stale task/content versions, editorial isolation, Realise/ambiguous/Founder badge projection, different report authors and recovery.
- Compiled Astro SSR and DOM/API tests: 11 check groups, including All clear versus Opened, filters/return markers, private queue visibility, action confirmation/cancellation, uncertain-write blocking, actual reply round trip, cross-origin denial and the named `form.action` browser regression. The actual hidden action input is modelled as shadowing the form property.
- Frozen Astro build passed. No mockup runtime dependencies were installed. Application source association and artifact hashes were checked before staging and activation.
- Production validation used read-only SQL, guarded role/claim checks and signed-out HTTP reads. It did **not** create a genuine Auth session or submit a Production task, reply, report, account, project or comment. Owner visual acceptance and authenticated task-write acceptance remain for the owner; HTTP/DOM verification is not a claim of visual acceptance.

Evidence: `.build-temp/dcs-community-inbox-20261119/{database-tests.json,ui-tests.json,production-before.json}` and final packet `{database-install-verification.json,migration-pin.json,worker-staged.json,worker-activated.json,pages-activated.json,live-verification.json,inbox-live-assets.json,source-association.json}`. The evidence directories are ignored by Git and are not application build assets.

## Recovery

Application rollback remains separately executable and guarded against unrelated deployment drift:

```powershell
Set-Location -LiteralPath 'D:\Projects\Tides-of-Knowing\workspace'
node scripts/dcs-community-inbox-production-release.cjs rollback
```

It restores Pages `dd8d459b-40e2-42c8-9b13-aac8aeea9b33` and Worker `a475afb8-94bc-4109-b24a-f665626d0a84`, preserving the original routes. No rollback was needed or executed.

Database recovery is prepared in `docs/DCS-COMMUNITY-INBOX-RECOVERY-20261119.sql` and was tested locally after both migrations. It disables only the new task capture triggers/RPC access and restores the prior empty-room active flags, while retaining all new task tables and history. It does not delete content, accounts, grants, task records or migration history. It is **not** a blind down migration: review the exact project, preserve current task evidence and reconcile any real content created while capture is disabled before re-enabling the inbox.

## Privacy and deferred work

`docs/DCS-COMBINED-PRIVACY-POLICY-DRAFT-20261119.md` is the combined, unpublished owner-review draft, based on the published Tides policy and original DCS audit notes. The live policy is unchanged. It includes the proposed 12-month hidden-content period, an explicit unresolved reported-content period, and operator/provider/retention details requiring review. Automatic deletion remains OFF; no retention schedule or deletion job was added. No reported-content period was chosen.

The separate Reviewed workflow, Insights, second-administrator access and bot operation remain deferred. The owner's next step is to refresh the live admin page and review the inbox layout; the privacy draft can be reviewed independently without enabling deletion.
