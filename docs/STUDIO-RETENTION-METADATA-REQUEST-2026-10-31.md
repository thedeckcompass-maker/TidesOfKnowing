# Narrow installed-definition inspection requested — NOT EXECUTED

Target: approved shared Supabase project `vbdqvjvhjleqdadiiqjx`.
Purpose: compare preserved ownership/download and free-concept gates against the installed definitions before preparing a minimal retention correction. No manuscript, account rows, secrets, or connection strings are requested.

The previously denied query text is not retained in the compacted execution record. This is a newly formulated exact approval request, not a reconstruction of that denied query. Do not execute without new relevant approval.

```sql
SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE (n.nspname,p.proname) IN (
 ('studio_private','has_access'),
 ('studio_private','owner_download_grace_v1'),
 ('public','studio_creator_inspiration_save_v1'),
 ('public','studio_owns_project'))
ORDER BY 1,2,3;
```

Separately, confirm which existing SELECT policies call the retained helper, without retrieving any table rows:

```sql
SELECT schemaname,tablename,policyname,cmd,permissive,roles,qual,with_check
FROM pg_policies
WHERE schemaname='public' AND
 (qual LIKE '%owner_download_grace_v1%' OR tablename='studio_creator_inspiration')
ORDER BY tablename,policyname;
```

Source basis: preserved `review/gap-repairs-20261026/01-owned-export-grace.review.sql` and `account-desk-20261026/schema.applied-v1.sql`. Original reference workspaces remain unmodified.
