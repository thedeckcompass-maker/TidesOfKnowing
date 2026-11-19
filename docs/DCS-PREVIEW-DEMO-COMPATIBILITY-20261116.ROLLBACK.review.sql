-- Review only. Refuse schema removal once any demonstration state exists.
BEGIN;
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM dcs_demo.grants) OR EXISTS(SELECT 1 FROM dcs_demo.preview_owners) OR EXISTS(SELECT 1 FROM dcs_demo.imports) THEN
 RAISE EXCEPTION 'Preserve demonstration state; use guarded project archival instead'; END IF;
END$$;
DROP POLICY dcs_demo_project_read ON public.studio_projects;
DROP POLICY dcs_demo_project_update ON public.studio_projects;
DO $$DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['studio_card_families','studio_cards','studio_guidebook_sections','studio_journal_entries'] LOOP
  EXECUTE format('DROP POLICY dcs_demo_read ON public.%I',t);
  EXECUTE format('DROP POLICY dcs_demo_insert ON public.%I',t);
  EXECUTE format('DROP POLICY dcs_demo_update ON public.%I',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['studio_card_versions','studio_guidebook_versions','studio_import_records'] LOOP
  EXECUTE format('DROP POLICY dcs_demo_read ON public.%I',t);
 END LOOP;
END$$;
DROP FUNCTION public.studio_project_can_edit_v1(uuid),public.studio_project_can_read_v1(uuid),public.studio_project_can_manage_lifecycle_v1(uuid);
DROP FUNCTION dcs_demo.can_access(uuid,boolean);
DROP TABLE dcs_demo.imports,dcs_demo.preview_owners,dcs_demo.grants,dcs_demo.environment;
DROP SCHEMA dcs_demo;
-- Keep additive deleted_at columns: removing them may discard later lifecycle
-- evidence and is unnecessary for rollback of access. Existing policies remain.
ROLLBACK;
