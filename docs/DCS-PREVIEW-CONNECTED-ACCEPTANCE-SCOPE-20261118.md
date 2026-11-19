# Preview connected acceptance — read-only assessment

18 November 2026. Parent Preview `utzcmbidotxgmulguzxo` is ACTIVE_HEALTHY (PostgreSQL 17). No Preview or Production writes, identities, grants, bucket changes or deployments were performed.

## Immediate finding

The existing Preview cannot safely receive the exact production candidate alongside its protected application. All seven creator RPC names already exist, as do the project/card deleted_at columns. The candidate intentionally rejects those existing targets. Installed project authorization calls `dcs_demo.can_access` and `studio_has_write_access`; the latter reads `studio_entitlements`, not the production `studio_private.has_access` contract. The private production access/grace helpers are absent. The three production Exchange relations are absent: public.studio_visual_exchange, public.studio_visual_interests and studio_private.exchange_export_revisions_v1. The recorded production restrictive policy names and definitions are not installed in Preview.

Preview contains four confirmed email Auth users and four profiles, three projects across two owners, 101 cards, one entitlement, and one protected demo owner/grant/import. There are zero studio_access rows. Installed dcs_demo_lifecycle triggers govern project/card changes for the protected demonstration. These records must not be treated as disposable. Migration history lists 18 staging community migrations; it is not a record of all manually installed demonstration contracts.

Storage contains a private studio-journal-photos bucket and a public community-spread-images bucket, both with zero objects at inspection. Existing Storage ownership policies differ from the production candidate's restrictive Manual Studio journal media policies. Zero Storage objects does not authorize bucket/policy replacement. All inspected public Studio tables have RLS enabled. Existing dcs_demo control tables have RLS disabled; they were not changed, and their ACLs must remain part of any preservation inventory.

Auth catalog inspection confirms four confirmed users and email identities. It does not verify the management-level site URL, redirect allowlist, signup/email settings or SMTP configuration. The available Supabase tools did not expose an Auth-configuration read operation. No keys or secret values were requested or printed.

## Approval scope and preservation boundary

Do not approve direct installation, dropping/replacing existing public RPCs, policy replacement, or fixture writes in the parent Preview. Those would affect its existing protected application and would not test the exact production baseline.

Recommended bounded acceptance scope is a separately isolated acceptance branch/environment derived from Preview, with a distinct project reference and no copied customer/demo rows. Before provisioning, obtain the actual hosting cost and owner approval. Branch migration replay alone may omit the manually installed schema: verify the resulting baseline and prepare a production-equivalent schema/recovery packet before requesting permission to apply it. Do not claim that copying Preview migrations is sufficient.

The subsequent separately reviewed write packet should specify: the exact schema prerequisite delta and unchanged combined candidate; one isolated private journal bucket if required; four synthetic Auth identities (administrator, Explore owner, complimentary Develop owner and historical/foreign owner); their profiles and independent test grants; at most eight synthetic projects, at most 40 cards plus generated versions, two journal photo objects, and bounded Guidebook/inspiration/Exchange fixtures. The exact-address grant check needs an explicitly approved Preview-only synthetic hello@thedeckcompass.com identity with no email sent; never create the Production identity. Test authentication as those users, not as the SQL administrator. No payment, service-allocation, billing or video records belong in this scope.

Use the exact Worker v6 and Pages v4 artifacts through test-only bindings/endpoints, with protected access. Preserve the parent Preview application, bindings, Auth configuration, users, projects, cards, grants, demo controls and buckets. Before writes in the isolated target, retain schema/function/ACL/policy/trigger definitions and a fixture ID ledger, identify all generated dependencies, and prepare reviewed rollback. Cleanup must address only the ledger's synthetic rows/objects in dependency order; no reset, cascade, parent restoration or deletion of unrelated records. Do not switch Production bindings or deploy to Production. Do not expose test credentials in logs or artifacts.

Status: stopped at the owner's explicit approval boundary. The production migration remains rollback-only. No connected acceptance or migration installation is claimed.
