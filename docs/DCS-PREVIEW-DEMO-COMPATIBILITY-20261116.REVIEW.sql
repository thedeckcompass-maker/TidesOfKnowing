-- PREVIEW REVIEW ONLY. Not a production migration. Default: ROLLBACK.
-- Do not combine with the broader Explore/project-entitlement candidates.
-- This delta is limited to a separately approved dedicated demonstration.
BEGIN;
CREATE SCHEMA dcs_demo;
CREATE TABLE dcs_demo.environment(singleton boolean PRIMARY KEY CHECK(singleton), project_ref text NOT NULL CHECK(project_ref='utzcmbidotxgmulguzxo'));
INSERT INTO dcs_demo.environment VALUES(true,'utzcmbidotxgmulguzxo');
CREATE TABLE dcs_demo.grants(owner_id uuid PRIMARY KEY REFERENCES public.profiles(id),kind text NOT NULL CHECK(kind='develop-demo'),starts_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,revoked_at timestamptz,CHECK(expires_at>starts_at));
CREATE TABLE dcs_demo.preview_owners(owner_id uuid PRIMARY KEY REFERENCES auth.users(id),project_id uuid UNIQUE NOT NULL,approval_reference text NOT NULL CHECK(length(approval_reference)>0));
CREATE TABLE dcs_demo.imports(owner_id uuid PRIMARY KEY REFERENCES public.profiles(id),project_id uuid UNIQUE NOT NULL REFERENCES public.studio_projects(id),source_sha256 text NOT NULL,snapshot jsonb NOT NULL);
REVOKE ALL ON SCHEMA dcs_demo FROM PUBLIC,anon,authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA dcs_demo FROM PUBLIC,anon,authenticated;
ALTER TABLE public.studio_projects ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.studio_cards ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE FUNCTION dcs_demo.can_access(target uuid,writing boolean) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM dcs_demo.preview_owners b
 JOIN dcs_demo.grants g ON g.owner_id=b.owner_id
 JOIN public.profiles u ON u.id=b.owner_id AND u.status='active'
 JOIN public.studio_projects p ON p.id=b.project_id AND p.owner_id=b.owner_id
 WHERE b.owner_id=auth.uid() AND b.project_id=target AND g.kind='develop-demo'
 AND g.revoked_at IS NULL AND g.starts_at<=now()
 AND now()<g.expires_at+CASE WHEN writing THEN interval '0 days' ELSE interval '28 days' END);
$$;
REVOKE ALL ON FUNCTION dcs_demo.can_access(uuid,boolean) FROM PUBLIC;
GRANT USAGE ON SCHEMA dcs_demo TO authenticated;
GRANT EXECUTE ON FUNCTION dcs_demo.can_access(uuid,boolean) TO authenticated;

-- CREATE deliberately fails if a different candidate has already installed
-- these contracts. Do not overwrite such functions without reconciliation.
CREATE FUNCTION public.studio_project_can_edit_v1(p_project uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.studio_projects p WHERE p.id=p_project
 AND p.owner_id=auth.uid() AND p.deleted_at IS NULL AND p.status<>'archived'
 AND (public.studio_has_write_access() OR dcs_demo.can_access(p.id,true)));
$$;
CREATE FUNCTION public.studio_project_can_read_v1(p_project uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.studio_projects p WHERE p.id=p_project
 AND p.owner_id=auth.uid() AND (public.studio_has_read_access() OR dcs_demo.can_access(p.id,false)));
$$;
CREATE FUNCTION public.studio_project_can_manage_lifecycle_v1(p_project uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.studio_projects p WHERE p.id=p_project
 AND p.owner_id=auth.uid() AND (public.studio_has_write_access() OR dcs_demo.can_access(p.id,true)));
$$;
REVOKE ALL ON FUNCTION public.studio_project_can_edit_v1(uuid),public.studio_project_can_read_v1(uuid),public.studio_project_can_manage_lifecycle_v1(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.studio_project_can_edit_v1(uuid),public.studio_project_can_read_v1(uuid),public.studio_project_can_manage_lifecycle_v1(uuid) TO authenticated;

CREATE POLICY dcs_demo_project_read ON public.studio_projects FOR SELECT TO authenticated USING(dcs_demo.can_access(id,false));
CREATE POLICY dcs_demo_project_update ON public.studio_projects FOR UPDATE TO authenticated USING(dcs_demo.can_access(id,true)) WITH CHECK(owner_id=auth.uid() AND dcs_demo.can_access(id,true));
DO $$DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['studio_card_families','studio_cards','studio_guidebook_sections','studio_journal_entries'] LOOP
  EXECUTE format('CREATE POLICY dcs_demo_read ON public.%I FOR SELECT TO authenticated USING(dcs_demo.can_access(project_id,false))',t);
  EXECUTE format('CREATE POLICY dcs_demo_insert ON public.%I FOR INSERT TO authenticated WITH CHECK(public.studio_project_can_edit_v1(project_id))',t);
  EXECUTE format('CREATE POLICY dcs_demo_update ON public.%I FOR UPDATE TO authenticated USING(public.studio_project_can_edit_v1(project_id)) WITH CHECK(public.studio_project_can_edit_v1(project_id))',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['studio_card_versions','studio_guidebook_versions','studio_import_records'] LOOP
  EXECUTE format('CREATE POLICY dcs_demo_read ON public.%I FOR SELECT TO authenticated USING(dcs_demo.can_access(project_id,false))',t);
 END LOOP;
END$$;
-- No grants/identities/fixtures are inserted. Operator DML authority must be
-- reviewed separately. Storage, billing and existing grants are untouched.
ROLLBACK;
