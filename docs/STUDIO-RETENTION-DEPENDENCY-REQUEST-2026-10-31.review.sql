-- READ-ONLY REQUEST, NOT EXECUTED. Target: vbdqvjvhjleqdadiiqjx.
-- Exact policy before-state and consumers of the already-inspected retention helper.
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies
WHERE schemaname='public' AND
 (tablename='studio_creator_inspiration' OR coalesce(qual,'') LIKE '%owner_download_grace_v1%' OR coalesce(with_check,'') LIKE '%owner_download_grace_v1%')
ORDER BY tablename,policyname;
SELECT n.nspname AS schema_name,p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','studio_private') AND p.prokind='f' AND p.proname<>'owner_download_grace_v1'
AND position('owner_download_grace_v1' IN pg_get_functiondef(p.oid))>0
ORDER BY n.nspname,p.proname;
-- No application tables or customer rows, no secrets, no mutations.
