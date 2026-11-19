-- READ ONLY. Run against the explicitly verified production project
-- vbdqvjvhjleqdadiiqjx; review output privately. No user data is selected.
-- This is a diagnostic, not an installation or an authorization decision.
SELECT current_database() AS database_name, current_user AS inspecting_role;

SELECT n.nspname AS schema_name, c.relname, c.relrowsecurity, c.relforcerowsecurity,
       pg_catalog.pg_get_userbyid(c.relowner) AS owner
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN
 ('profiles','studio_access','studio_projects','studio_cards','studio_guidebook_sections')
ORDER BY c.relname;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename IN
 ('profiles','studio_access','studio_projects','studio_cards','studio_guidebook_sections')
ORDER BY tablename, policyname;

SELECT n.nspname AS schema_name, p.proname,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_catalog.pg_get_userbyid(p.proowner) AS owner, p.prosecdef AS security_definer,
       p.proconfig AS settings, p.proacl AS explicit_acl,
       pg_catalog.pg_get_functiondef(p.oid) AS definition
FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE (n.nspname='public' AND p.proname IN
 ('studio_project_can_read_v1','studio_project_can_edit_v1',
  'studio_project_can_manage_lifecycle_v1','studio_has_write_access',
  'studio_capture_atomic_v1','studio_remove_deleted_project_card_v1',
  'studio_owns_project','studio_manage_access'))
 OR (n.nspname='studio_private' AND p.proname='has_access')
 OR (n.nspname='auth' AND p.proname='uid')
ORDER BY n.nspname,p.proname,arguments;

SELECT r.rolname, n.nspname, c.relname,
       pg_catalog.has_schema_privilege(r.oid,n.oid,'USAGE') AS schema_usage,
       pg_catalog.has_table_privilege(r.oid,c.oid,'SELECT') AS can_select,
       pg_catalog.has_table_privilege(r.oid,c.oid,'INSERT') AS can_insert,
       pg_catalog.has_table_privilege(r.oid,c.oid,'UPDATE') AS can_update,
       pg_catalog.has_table_privilege(r.oid,c.oid,'DELETE') AS can_delete
FROM pg_catalog.pg_roles r CROSS JOIN pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE r.rolname IN ('anon','authenticated') AND n.nspname='public'
 AND c.relname IN ('profiles','studio_access','studio_projects','studio_cards','studio_guidebook_sections')
ORDER BY r.rolname,c.relname;

SELECT r.rolname, n.nspname, p.proname,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_catalog.has_schema_privilege(r.oid,n.oid,'USAGE') AS schema_usage,
       pg_catalog.has_function_privilege(r.oid,p.oid,'EXECUTE') AS can_execute
FROM pg_catalog.pg_roles r CROSS JOIN pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE r.rolname IN ('anon','authenticated') AND
 ((n.nspname='public' AND p.proname IN
 ('studio_project_can_read_v1','studio_project_can_edit_v1',
  'studio_project_can_manage_lifecycle_v1','studio_has_write_access',
  'studio_capture_atomic_v1','studio_remove_deleted_project_card_v1',
  'studio_owns_project','studio_manage_access'))
 OR (n.nspname='studio_private' AND p.proname='has_access'))
ORDER BY r.rolname,n.nspname,p.proname,arguments;
