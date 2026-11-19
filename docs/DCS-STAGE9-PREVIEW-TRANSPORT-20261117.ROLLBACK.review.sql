-- PREVIEW ONLY. Pinned wrapper verifies utzcmbidotxgmulguzxo before this SQL.
-- Never removes a table, row, creative record, policy, function or ledger.
BEGIN;
DO $guard$
BEGIN
 IF current_database()<>'postgres' OR session_user<>'postgres' OR current_user<>'postgres'
 THEN RAISE EXCEPTION 'Expected verified preview operator'; END IF;
 IF to_regrole('dcs_service_executor') IS NULL OR to_regrole('dcs_exchange_connection') IS NULL
 THEN RAISE EXCEPTION 'Missing installation; reconcile rather than repeat'; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles r WHERE r.rolname IN ('dcs_service_executor','dcs_exchange_connection')
  AND shobj_description(r.oid,'pg_authid') IS DISTINCT FROM 'DCS Stage9 preview utzcmbidotxgmulguzxo transport-only 20261117 v1')
 THEN RAISE EXCEPTION 'Unrecognised role provenance'; END IF;
 IF EXISTS(SELECT 1 FROM pg_stat_activity WHERE usename IN ('dcs_service_executor','dcs_exchange_connection'))
 THEN RAISE EXCEPTION 'Transport is in use; detach Preview Hyperdrive and close sessions first'; END IF;
 IF EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles p ON p.oid=m.roleid JOIN pg_roles c ON c.oid=m.member
  WHERE (p.rolname IN ('dcs_service_executor','dcs_exchange_connection') OR c.rolname IN ('dcs_service_executor','dcs_exchange_connection'))
  AND NOT(p.rolname='dcs_service_executor' AND c.rolname='dcs_exchange_connection' AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option))
 THEN RAISE EXCEPTION 'Unexpected memberships; preserve changed installation'; END IF;
END $guard$;
REVOKE dcs_service_executor FROM dcs_exchange_connection;
REVOKE CONNECT ON DATABASE postgres FROM dcs_exchange_connection;
-- DROP ROLE fails on ANY remaining object/grant dependency. Never DROP OWNED/CASCADE.
-- Entire transaction rolls back if either role has acquired later dependencies.
DROP ROLE dcs_exchange_connection;
DROP ROLE dcs_service_executor;
ROLLBACK;
