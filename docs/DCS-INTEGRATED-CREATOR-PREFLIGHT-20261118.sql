-- Read-only exact baseline preflight; confirmed Production target must be selected externally.
BEGIN READ ONLY;
DO $preflight$
DECLARE t text; prefix text; v text; pol text; expected text;
BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'STOP: expected reviewed postgres migration owner'; END IF;
 IF to_regprocedure('auth.uid()') IS NULL OR to_regprocedure('studio_private.has_access()') IS NULL
  OR to_regprocedure('public.is_admin(uuid)') IS NULL THEN RAISE EXCEPTION 'STOP: identity/access dependencies missing'; END IF;
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','dcs_service_executor') AND has_schema_privilege(r.oid,'public','CREATE')) THEN RAISE EXCEPTION 'STOP: public schema is writable by a caller'; END IF;
 IF to_regclass('studio_private.explore_project_bindings_v1') IS NOT NULL OR to_regclass('studio_private.complimentary_develop_workspace_v1') IS NOT NULL
  OR EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('studio_projects','studio_cards') AND column_name='deleted_at')
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='public' AND p.proname IN ('studio_project_can_read_v1','studio_project_can_edit_v1','studio_project_can_manage_lifecycle_v1','studio_has_write_access','studio_capture_atomic_v1','studio_remove_deleted_project_card_v1','studio_explore_inspiration_link_v1','studio_complimentary_exchange_export_snapshot_v1','studio_complimentary_develop_workspace_active_v1','studio_inspect_complimentary_develop_workspace_v1','studio_manage_complimentary_develop_workspace_v1')) OR (n.nspname='studio_private' AND p.proname IN ('explore_active_v1','explore_active_project_v1','explore_capacity_v1','explore_bound_v1','explore_journal_object_v1','bind_new_explore_project_v1','mark_explore_paid_write_v1','creator_workspace_full_access_v1','has_complimentary_develop_workspace_v1'))) THEN RAISE EXCEPTION 'STOP: existing target objects require review'; END IF;
 FOREACH t IN ARRAY ARRAY['public.studio_visual_exchange','public.studio_visual_interests','studio_private.exchange_export_revisions_v1','storage.objects'] LOOP
  IF to_regclass(t) IS NULL OR NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid=to_regclass(t)) THEN RAISE EXCEPTION 'STOP: export/Storage RLS dependency missing: %',t; END IF;
 END LOOP;
 FOREACH t IN ARRAY ARRAY['public.studio_visual_exchange','public.studio_visual_interests','studio_private.exchange_export_revisions_v1'] LOOP
  IF NOT has_table_privilege('authenticated',t,'SELECT') THEN RAISE EXCEPTION 'STOP: authenticated export SELECT missing: %',t; END IF;
 END LOOP;
 FOREACH t IN ARRAY ARRAY['studio_projects','studio_cards','studio_card_families','studio_guidebook_sections','studio_journal_entries','studio_journal_photos','studio_journal_excerpts','studio_production_plans'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=t AND c.relrowsecurity AND pg_get_userbyid(c.relowner)='postgres') THEN RAISE EXCEPTION 'STOP: table ownership or RLS differs: %',t; END IF;
  FOREACH v IN ARRAY ARRAY['insert','update'] LOOP
   prefix:=CASE WHEN t LIKE 'studio_journal_%' OR t='studio_production_plans' THEN 'Manual Studio access required ' ELSE 'Studio entitlement required ' END;
   pol:=CASE WHEN t='studio_projects' AND v='insert' THEN 'Studio entitlement required for creating' WHEN t='studio_projects' THEN 'Studio entitlement required for editing' ELSE prefix||v END;
   expected:=CASE v WHEN 'insert' THEN '4fd788d8fb04f506a683f4f030eaa055' ELSE '0ad9d749806bc395c3fb095ebfca09d1' END;
   IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policies p WHERE p.schemaname='public' AND p.tablename=t AND p.policyname=pol AND p.permissive='RESTRICTIVE' AND p.roles=CASE WHEN t LIKE 'studio_journal_%' OR t='studio_production_plans' THEN ARRAY['authenticated']::name[] ELSE ARRAY['public']::name[] END AND p.cmd=upper(v) AND md5(coalesce(p.qual,'')||'|'||coalesce(p.with_check,''))=expected) THEN RAISE EXCEPTION 'STOP: policy drift: %.%',t,pol; END IF;
  END LOOP;
 END LOOP;
 FOREACH v IN ARRAY ARRAY['insert','update','delete'] LOOP
  expected:=CASE v WHEN 'insert' THEN 'cad340673a47f0b41c9a6895ec04d0b4' WHEN 'update' THEN '2a22494e3b78c002c8625cc660ca0815' ELSE '711dc4e609f7ed73a8ce604cd33ea29f' END;
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policies p WHERE p.schemaname='storage' AND p.tablename='objects' AND p.policyname='Manual Studio journal media '||v AND p.permissive='RESTRICTIVE' AND p.roles=ARRAY['authenticated']::name[] AND p.cmd=upper(v) AND md5(coalesce(p.qual,'')||'|'||coalesce(p.with_check,''))=expected) THEN RAISE EXCEPTION 'STOP: journal Storage policy drift: %',v; END IF;
 END LOOP;
END $preflight$;
DO $$ BEGIN IF to_regprocedure('public.studio_restore_card_version(uuid,uuid,uuid,integer)') IS NULL OR md5(replace(pg_get_functiondef('public.studio_restore_card_version(uuid,uuid,uuid,integer)'::regprocedure),chr(13),''))<>'84761f181f2742091139598ecc217e85' OR pg_get_userbyid((SELECT proowner FROM pg_proc WHERE oid='public.studio_restore_card_version(uuid,uuid,uuid,integer)'::regprocedure))<>'postgres' THEN RAISE EXCEPTION 'STOP: version-restore baseline drift: studio_restore_card_version'; END IF; END $$;
DO $$ BEGIN IF to_regprocedure('public.studio_restore_guidebook_version(uuid,uuid,uuid,integer)') IS NULL OR md5(replace(pg_get_functiondef('public.studio_restore_guidebook_version(uuid,uuid,uuid,integer)'::regprocedure),chr(13),''))<>'807872b3cf744a5a33c13dc4219ac8da' OR pg_get_userbyid((SELECT proowner FROM pg_proc WHERE oid='public.studio_restore_guidebook_version(uuid,uuid,uuid,integer)'::regprocedure))<>'postgres' THEN RAISE EXCEPTION 'STOP: version-restore baseline drift: studio_restore_guidebook_version'; END IF; END $$;
ROLLBACK;
