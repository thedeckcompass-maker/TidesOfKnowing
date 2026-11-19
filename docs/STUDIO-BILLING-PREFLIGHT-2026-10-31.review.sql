-- READ-ONLY REVIEW PREFLIGHT. NOT A MIGRATION. No customer rows or manuscripts.
-- Proposed activation/security changes are described in the adjacent billing proposal.
BEGIN READ ONLY;
SELECT schemaname,tablename FROM pg_tables
 WHERE (schemaname='studio_private' AND tablename IN ('service_ledger_v1','service_receipts_v1','service_assessment_links_v1'))
 OR (schemaname='public' AND tablename IN ('studio_access','studio_capability_grants'));
SELECT c.relname,pg_get_constraintdef(k.oid) AS definition
 FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname IN ('studio_access','studio_capability_grants');
SELECT rolname,rolcanlogin,rolsuper,rolbypassrls FROM pg_roles
 WHERE rolname IN ('dcs_service_executor','dcs_exchange_connection');
ROLLBACK;
