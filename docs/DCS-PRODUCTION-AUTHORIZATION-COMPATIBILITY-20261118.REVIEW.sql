-- REVIEW / LOCAL ISOLATED TEST ONLY. Not an approved production migration.
-- Mirrors observed current production RLS; it does NOT establish free Explore
-- classification, independent grant precedence, or a 28-day expiry policy.
-- Never replace ROLLBACK with COMMIT to bypass those unresolved boundaries.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
DO $preflight$
DECLARE missing text;
BEGIN
  IF current_user <> 'postgres' THEN RAISE EXCEPTION 'STOP: expected reviewed postgres owner'; END IF;
  SELECT string_agg(x.name, ', ') INTO missing FROM (VALUES
    ('public.studio_projects'),('public.profiles'),('public.studio_access')
  ) x(name) WHERE to_regclass(x.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'STOP: missing tables %', missing; END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname IN ('studio_projects','profiles','studio_access') AND NOT c.relrowsecurity)
  THEN RAISE EXCEPTION 'STOP: expected RLS is not enabled'; END IF;
  IF to_regprocedure('auth.uid()') IS NULL OR to_regprocedure('studio_private.has_access()') IS NULL
  THEN RAISE EXCEPTION 'STOP: trusted identity/access dependencies missing'; END IF;
  IF to_regprocedure('public.studio_project_can_read_v1(uuid)') IS NOT NULL
    OR to_regprocedure('public.studio_project_can_edit_v1(uuid)') IS NOT NULL
    OR to_regprocedure('public.studio_project_can_manage_lifecycle_v1(uuid)') IS NOT NULL
    OR to_regprocedure('public.studio_has_write_access()') IS NOT NULL
  THEN RAISE EXCEPTION 'STOP: a target function already exists; inspect, do not overwrite'; END IF;
END $preflight$;

-- INVOKER retains installed project/profile RLS. No caller-supplied owner ID.
CREATE FUNCTION public.studio_project_can_read_v1(p_project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS (
 SELECT 1 FROM public.studio_projects p JOIN public.profiles u ON u.id=p.owner_id
 WHERE p.id=p_project AND p.owner_id=auth.uid() AND u.status='active'
) $$;
CREATE FUNCTION public.studio_project_can_edit_v1(p_project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT auth.uid() IS NOT NULL AND studio_private.has_access() AND EXISTS (
 SELECT 1 FROM public.studio_projects p JOIN public.profiles u ON u.id=p.owner_id
 WHERE p.id=p_project AND p.owner_id=auth.uid() AND u.status='active'
 AND p.deleted_at IS NULL AND p.status<>'archived'
) $$;
CREATE FUNCTION public.studio_project_can_manage_lifecycle_v1(p_project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT auth.uid() IS NOT NULL AND studio_private.has_access() AND EXISTS (
 SELECT 1 FROM public.studio_projects p JOIN public.profiles u ON u.id=p.owner_id
 WHERE p.id=p_project AND p.owner_id=auth.uid() AND u.status='active'
) $$;
CREATE FUNCTION public.studio_has_write_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT auth.uid() IS NOT NULL AND studio_private.has_access() AND EXISTS (
 SELECT 1 FROM public.profiles u WHERE u.id=auth.uid() AND u.status='active'
) $$;
REVOKE ALL ON FUNCTION public.studio_project_can_read_v1(uuid), public.studio_project_can_edit_v1(uuid), public.studio_project_can_manage_lifecycle_v1(uuid), public.studio_has_write_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.studio_project_can_read_v1(uuid), public.studio_project_can_edit_v1(uuid), public.studio_project_can_manage_lifecycle_v1(uuid), public.studio_has_write_access() TO authenticated;
DO $postflight$
DECLARE f record;
BEGIN
 FOR f IN SELECT p.oid, p.proname, p.prosecdef, p.proconfig, pg_get_userbyid(p.proowner) owner
 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('studio_project_can_read_v1','studio_project_can_edit_v1','studio_project_can_manage_lifecycle_v1','studio_has_write_access') LOOP
  IF f.owner<>'postgres' OR f.prosecdef OR NOT (f.proconfig @> ARRAY['search_path=""'])
   OR has_function_privilege('anon',f.oid,'EXECUTE') OR has_function_privilege('public',f.oid,'EXECUTE')
   OR NOT has_function_privilege('authenticated',f.oid,'EXECUTE') THEN
   RAISE EXCEPTION 'STOP: owner, invoker, search path, or ACL mismatch: %', f.proname;
  END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('studio_project_can_read_v1','studio_project_can_edit_v1','studio_project_can_manage_lifecycle_v1','studio_has_write_access'))<>4 THEN
  RAISE EXCEPTION 'STOP: unexpected function count';
 END IF;
END $postflight$;
ROLLBACK;