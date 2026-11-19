-- PREVIEW ONLY: utzcmbidotxgmulguzxo. Apply ONLY through the pinned TLS SQL wrapper.
-- Minimum connection isolation contract; optional service delivery remains OFF.
-- No service ledger, data grants, dispatch functions, RLS changes or member writes.
-- This SQL cannot establish host identity; the existing wrapper verifies it first.
BEGIN;
DO $guard$
BEGIN
 IF current_database()<>'postgres' OR session_user<>'postgres' OR current_user<>'postgres'
 THEN RAISE EXCEPTION 'Expected verified preview operator'; END IF;
 IF current_setting('server_version_num')::int < 160000 THEN RAISE EXCEPTION 'Explicit role membership options require PostgreSQL 16+'; END IF;
 IF to_regrole('dcs_service_executor') IS NOT NULL OR to_regrole('dcs_exchange_connection') IS NOT NULL
 THEN RAISE EXCEPTION 'Existing role requires reconciliation; never replace'; END IF;
END $guard$;
CREATE ROLE dcs_service_executor NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE dcs_exchange_connection LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD NULL;
COMMENT ON ROLE dcs_service_executor IS 'DCS Stage9 preview utzcmbidotxgmulguzxo transport-only 20261117 v1';
COMMENT ON ROLE dcs_exchange_connection IS 'DCS Stage9 preview utzcmbidotxgmulguzxo transport-only 20261117 v1';
GRANT CONNECT ON DATABASE postgres TO dcs_exchange_connection;
GRANT dcs_service_executor TO dcs_exchange_connection WITH INHERIT FALSE;
GRANT dcs_service_executor TO dcs_exchange_connection WITH SET TRUE;
GRANT dcs_service_executor TO dcs_exchange_connection WITH ADMIN FALSE;
-- No password provisioned here. Owner sets it privately after approved install.
-- Do NOT grant authenticated/service_role membership or general schema access.
DO $verify$
DECLARE r record;
BEGIN
 FOR r IN SELECT * FROM pg_roles WHERE rolname IN ('dcs_service_executor','dcs_exchange_connection') LOOP
  IF r.rolsuper OR r.rolinherit OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls
  THEN RAISE EXCEPTION 'Restricted role attributes differ'; END IF;
  IF has_schema_privilege(r.rolname,'public','CREATE') THEN RAISE EXCEPTION 'Unexpected inherited public schema CREATE; reconcile before installation'; END IF;
  IF to_regnamespace('studio_private') IS NOT NULL AND has_schema_privilege(r.rolname,'studio_private','USAGE')
  THEN RAISE EXCEPTION 'Unexpected inherited private schema access'; END IF;
  IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND (c.relname LIKE 'studio\_%' ESCAPE '\' OR c.relname='profiles') AND c.relkind IN ('r','p','v','m')
   AND has_table_privilege(r.rolname,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
  THEN RAISE EXCEPTION 'Unexpected inherited creator-data privileges'; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles p ON p.oid=m.roleid JOIN pg_roles c ON c.oid=m.member
  WHERE p.rolname='dcs_service_executor' AND c.rolname='dcs_exchange_connection' AND m.set_option AND NOT m.inherit_option AND NOT m.admin_option)
 THEN RAISE EXCEPTION 'Restricted transport membership differs'; END IF;
END $verify$;
ROLLBACK;
