-- LOCAL REVIEW ONLY; explicit production security approval required. No function body changes.
BEGIN;
DO $guard$ BEGIN
 IF to_regrole('dcs_service_executor') IS NULL OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='dcs_service_executor' AND NOT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreaterole) THEN RAISE EXCEPTION 'Executor role differs from captured restricted role'; END IF;
 IF to_regprocedure('public.studio_owns_project(uuid)') IS NULL OR md5(pg_get_functiondef(to_regprocedure('public.studio_owns_project(uuid)'))) <> '7cdc6578eef0347c2983945f4abd091f' THEN RAISE EXCEPTION 'Ownership function changed; review before granting'; END IF;
 IF has_function_privilege('dcs_service_executor','public.studio_owns_project(uuid)','EXECUTE') THEN RAISE EXCEPTION 'Grant already present; reconcile before changing'; END IF;
END $guard$;
GRANT EXECUTE ON FUNCTION public.studio_owns_project(uuid) TO dcs_service_executor;
ROLLBACK;
-- Exact rollback after separately authorized application, only if this release added the grant:
-- BEGIN;
-- REVOKE EXECUTE ON FUNCTION public.studio_owns_project(uuid) FROM dcs_service_executor;
-- COMMIT;
