-- REVIEW ONLY, step 2 after DCS-PREVIEW-DEMO-COMPATIBILITY. Default rollback.
-- Dedicated demonstration only; do not replace the broader Explore candidates.
BEGIN;
ALTER TABLE dcs_demo.grants ADD COLUMN isolated_history_verified boolean NOT NULL DEFAULT false;

CREATE FUNCTION dcs_demo.require_export(target uuid) RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT dcs_demo.can_access(target,false) OR NOT EXISTS(
 SELECT 1 FROM dcs_demo.imports i JOIN dcs_demo.grants g ON g.owner_id=i.owner_id
 WHERE i.project_id=target AND i.owner_id=auth.uid() AND g.isolated_history_verified)
 THEN RAISE EXCEPTION 'Verified isolated owner export required' USING ERRCODE='42501'; END IF;
 -- This adapter cannot omit a later installed hosted history subsystem.
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND (c.relname LIKE 'studio_editorial_%' OR c.relname LIKE 'studio_exchange_%' OR c.relname LIKE 'studio_visual_exchange%'))
 THEN RAISE EXCEPTION 'Hosted history adapter requires reconciliation'; END IF;
END$$;
REVOKE ALL ON FUNCTION dcs_demo.require_export(uuid) FROM PUBLIC;

CREATE FUNCTION public.studio_editorial_owner_history_v1(p_project uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM dcs_demo.require_export(p_project);
 RETURN jsonb_build_object('version',1,'consistent_snapshot',true,'requests','[]'::jsonb,'replies','[]'::jsonb);
END$$;
CREATE FUNCTION public.studio_exchange_export_snapshot_v1(p_project uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM dcs_demo.require_export(p_project);
 RETURN jsonb_build_object('ownerId',auth.uid(),'projectId',p_project,'revision',0,'rows','[]'::jsonb);
END$$;
CREATE FUNCTION public.studio_project_export_snapshot_v1(p_project uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE t text; data jsonb; collections jsonb:='{}';
BEGIN
 PERFORM dcs_demo.require_export(p_project);
 -- STABLE reads share the calling statement snapshot; do not filter deleted
 -- cards. The application separately verifies media bytes and rechecks digest.
 FOREACH t IN ARRAY ARRAY['studio_projects','studio_card_families','studio_cards','studio_guidebook_sections','studio_journal_entries','studio_production_plans','studio_card_versions','studio_guidebook_versions','studio_production_plan_versions','studio_import_records','studio_journal_photos','studio_journal_excerpts','studio_programme_progress'] LOOP
  EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]''::jsonb) FROM public.%I r WHERE %I=$1',t,CASE WHEN t='studio_projects' THEN 'id' ELSE 'project_id' END) INTO data USING p_project;
  collections:=jsonb_set(collections,ARRAY[t],data);
 END LOOP;
 RETURN jsonb_build_object('version',1,'ownerId',auth.uid(),'projectId',p_project,'coverage','project-and-editorial-v1','tables',collections,'editorial',public.studio_editorial_owner_history_v1(p_project));
END$$;
REVOKE ALL ON FUNCTION public.studio_project_export_snapshot_v1(uuid),public.studio_editorial_owner_history_v1(uuid),public.studio_exchange_export_snapshot_v1(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.studio_project_export_snapshot_v1(uuid),public.studio_editorial_owner_history_v1(uuid),public.studio_exchange_export_snapshot_v1(uuid) TO authenticated;

-- Apply lifecycle invariants only to the registered demo, without reclassifying
-- historical projects, overriding paid grants or changing free-tier counters.
CREATE FUNCTION dcs_demo.lifecycle_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target uuid; creator uuid;
BEGIN
 IF TG_TABLE_NAME='studio_projects' THEN target:=NEW.id;creator:=NEW.owner_id;
 ELSE target:=NEW.project_id;SELECT owner_id INTO creator FROM public.studio_projects WHERE id=target;END IF;
 IF NOT EXISTS(SELECT 1 FROM dcs_demo.preview_owners WHERE project_id=target) THEN RETURN NEW;END IF;
 PERFORM 1 FROM public.profiles WHERE id=creator FOR UPDATE;
 IF creator IS DISTINCT FROM auth.uid() OR NOT EXISTS(SELECT 1 FROM dcs_demo.grants g JOIN public.profiles p ON p.id=g.owner_id WHERE g.owner_id=creator AND p.status='active' AND g.kind='develop-demo' AND g.revoked_at IS NULL AND g.starts_at<=now() AND g.expires_at>now()) THEN RAISE EXCEPTION 'Active demo owner required' USING ERRCODE='42501';END IF;
 IF TG_OP='UPDATE' THEN
  IF TG_TABLE_NAME='studio_projects' THEN
   IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN RAISE EXCEPTION 'Owner cannot change';END IF;
  END IF;
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Restore before editing';END IF;
  IF OLD.deleted_at IS DISTINCT FROM NEW.deleted_at AND (to_jsonb(OLD)-ARRAY['deleted_at','updated_at','version_number']) IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['deleted_at','updated_at','version_number']) THEN RAISE EXCEPTION 'Lifecycle change must be separate from editing';END IF;
 END IF;
 IF TG_TABLE_NAME='studio_cards' THEN
  IF TG_OP='UPDATE' AND OLD.project_id IS DISTINCT FROM NEW.project_id THEN RAISE EXCEPTION 'Card project cannot change';END IF;
  IF NEW.deleted_at IS NULL AND NOT EXISTS(SELECT 1 FROM public.studio_projects WHERE id=target AND deleted_at IS NULL AND status<>'archived') THEN RAISE EXCEPTION 'Project inactive';END IF;
 END IF;
 RETURN NEW;
END$$;
REVOKE ALL ON FUNCTION dcs_demo.lifecycle_guard() FROM PUBLIC;
CREATE TRIGGER dcs_demo_lifecycle BEFORE INSERT OR UPDATE ON public.studio_projects FOR EACH ROW EXECUTE FUNCTION dcs_demo.lifecycle_guard();
CREATE TRIGGER dcs_demo_lifecycle BEFORE INSERT OR UPDATE ON public.studio_cards FOR EACH ROW EXECUTE FUNCTION dcs_demo.lifecycle_guard();

CREATE FUNCTION public.studio_capture_atomic_v1(target_project uuid,expected_updated_at timestamptz,new_card jsonb,new_settings jsonb) RETURNS timestamptz
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE stamp timestamptz;
BEGIN
 IF NOT public.studio_project_can_edit_v1(target_project) OR jsonb_typeof(new_settings) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Owned editable project required' USING ERRCODE='42501';END IF;
 SELECT updated_at INTO stamp FROM public.studio_projects WHERE id=target_project AND owner_id=auth.uid() FOR UPDATE;
 IF stamp IS DISTINCT FROM expected_updated_at THEN RAISE EXCEPTION 'STUDIO_CAPTURE_CONFLICT';END IF;
 IF new_card IS NOT NULL THEN
  INSERT INTO public.studio_cards(id,project_id,title,card_number,sort_order,family_id)
  VALUES((new_card->>'id')::uuid,target_project,new_card->>'title',coalesce(new_card->>'card_number',''),(new_card->>'sort_order')::integer,nullif(new_card->>'family_id','')::uuid);
 END IF;
 UPDATE public.studio_projects SET settings=new_settings WHERE id=target_project AND owner_id=auth.uid() RETURNING updated_at INTO stamp;
 IF stamp IS NULL THEN RAISE EXCEPTION 'STUDIO_CAPTURE_CONFLICT';END IF;RETURN stamp;
END$$;
CREATE FUNCTION public.studio_remove_deleted_project_card_v1(target_project uuid,target_card uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT dcs_demo.can_access(target_project,true) OR NOT EXISTS(SELECT 1 FROM public.studio_projects WHERE id=target_project AND owner_id=auth.uid() AND deleted_at IS NOT NULL) THEN RAISE EXCEPTION 'STUDIO_DELETED_PROJECT_REQUIRED' USING ERRCODE='42501';END IF;
 UPDATE public.studio_cards SET deleted_at=now() WHERE id=target_card AND project_id=target_project AND deleted_at IS NULL;
 RETURN FOUND;
END$$;
REVOKE ALL ON FUNCTION public.studio_capture_atomic_v1(uuid,timestamptz,jsonb,jsonb),public.studio_remove_deleted_project_card_v1(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.studio_capture_atomic_v1(uuid,timestamptz,jsonb,jsonb),public.studio_remove_deleted_project_card_v1(uuid,uuid) TO authenticated;
ROLLBACK;
