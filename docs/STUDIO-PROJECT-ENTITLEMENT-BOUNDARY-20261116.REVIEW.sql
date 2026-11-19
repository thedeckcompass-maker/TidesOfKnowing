-- REVIEW CANDIDATE ONLY. Do not apply to production or hosted staging.
-- Requires the earlier Explore-capacity candidate and exact policy/ACL review.
-- Historical projects are intentionally not backfilled or reclassified.
-- The projected grant does not identify contractual exceptions or all overlapping
-- grants; this candidate must not replace any longer existing promise.
BEGIN;
CREATE TABLE studio_private.explore_project_bindings_v1 (
  project_id uuid PRIMARY KEY,
  owner_id uuid NOT NULL,
  bound_at timestamptz NOT NULL DEFAULT now(),
  paid_write_at timestamptz,
  FOREIGN KEY (project_id,owner_id) REFERENCES public.studio_projects(id,owner_id) ON DELETE RESTRICT
);
REVOKE ALL ON studio_private.explore_project_bindings_v1 FROM PUBLIC, anon, authenticated;

-- The member cannot write or choose this binding through project settings.
CREATE FUNCTION studio_private.explore_bound_v1(target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM studio_private.explore_project_bindings_v1 b
  JOIN public.profiles u ON u.id=b.owner_id AND u.status='active'
  WHERE b.project_id=target AND b.owner_id=auth.uid() AND b.paid_write_at IS NULL
    AND (SELECT count(*) FROM public.studio_cards c WHERE c.project_id=b.project_id AND c.deleted_at IS NULL)<=10
    AND (SELECT count(*) FROM studio_private.explore_project_bindings_v1 x
      JOIN public.studio_projects p ON p.id=x.project_id AND p.owner_id=x.owner_id
      WHERE x.owner_id=b.owner_id AND x.paid_write_at IS NULL AND p.deleted_at IS NULL AND p.status<>'archived'
       AND (SELECT count(*) FROM public.studio_cards c2 WHERE c2.project_id=p.id AND c2.deleted_at IS NULL)<=10)<=1
 );
$$;
REVOKE ALL ON FUNCTION studio_private.explore_bound_v1(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION studio_private.explore_bound_v1(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION studio_private.explore_active_project_v1(target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT studio_private.explore_bound_v1(target) AND EXISTS (
  SELECT 1 FROM public.studio_projects p WHERE p.id=target AND p.owner_id=auth.uid()
  AND p.deleted_at IS NULL AND p.status <> 'archived');
$$;

-- Preserve the documented 28-day expiry window. This projected row must be
-- reconciled with all grants before hosted acceptance; it is not a grant ledger.
CREATE OR REPLACE FUNCTION studio_private.owner_download_grace_v1()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.profiles p JOIN public.studio_access a ON a.user_id=p.id
  WHERE p.id=auth.uid() AND p.status='active' AND a.revoked_at IS NULL
   AND isfinite(a.starts_at) AND isfinite(a.expires_at) AND a.expires_at>a.starts_at
   AND a.starts_at<=now() AND now()>=a.expires_at AND now()<a.expires_at+interval '28 days');
$$;

CREATE FUNCTION studio_private.bind_new_explore_project_v1()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF auth.uid()=NEW.owner_id AND studio_private.explore_active_v1() AND NOT studio_private.has_access() THEN
  INSERT INTO studio_private.explore_project_bindings_v1(project_id,owner_id) VALUES(NEW.id,NEW.owner_id);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION studio_private.bind_new_explore_project_v1() FROM PUBLIC;
CREATE TRIGGER studio_bind_new_explore_project AFTER INSERT ON public.studio_projects
 FOR EACH ROW EXECUTE FUNCTION studio_private.bind_new_explore_project_v1();

-- Called by the application for a project already visible under RLS. The
-- caller cannot supply an owner identity or grant; unknown projects fail closed.
CREATE FUNCTION public.studio_project_can_edit_v1(p_project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.studio_projects p WHERE p.id=p_project AND p.owner_id=auth.uid()
   AND p.deleted_at IS NULL AND p.status<>'archived'
   AND (studio_private.has_access() OR studio_private.explore_active_project_v1(p.id)));
$$;
REVOKE ALL ON FUNCTION public.studio_project_can_edit_v1(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.studio_project_can_edit_v1(uuid) TO authenticated;
CREATE FUNCTION public.studio_project_can_read_v1(p_project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.studio_projects p JOIN public.profiles u ON u.id=p.owner_id AND u.status='active'
  WHERE p.id=p_project AND p.owner_id=auth.uid()
   AND (studio_private.has_access() OR studio_private.owner_download_grace_v1() OR studio_private.explore_bound_v1(p.id)));
$$;
REVOKE ALL ON FUNCTION public.studio_project_can_read_v1(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.studio_project_can_read_v1(uuid) TO authenticated;
CREATE FUNCTION public.studio_project_can_manage_lifecycle_v1(p_project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.studio_projects p WHERE p.id=p_project AND p.owner_id=auth.uid()
   AND (studio_private.has_access() OR studio_private.explore_bound_v1(p.id)));
$$;
REVOKE ALL ON FUNCTION public.studio_project_can_manage_lifecycle_v1(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.studio_project_can_manage_lifecycle_v1(uuid) TO authenticated;

-- Project/card trigger: lock the same owner row used by the original quota.
-- Historical unbound projects do not count against a separate Explore project.
CREATE OR REPLACE FUNCTION studio_private.explore_capacity_v1()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE owner uuid; target uuid; active_project boolean; paid boolean; bound boolean; n bigint;
BEGIN
 IF TG_TABLE_NAME='studio_projects' THEN
  owner:=NEW.owner_id; target:=NEW.id;
  IF TG_OP='UPDATE' AND OLD.owner_id<>NEW.owner_id THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_PROJECT_OWNER_IMMUTABLE'; END IF;
 ELSE
  IF TG_OP='UPDATE' AND OLD.project_id<>NEW.project_id THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_CARD_PROJECT_IMMUTABLE'; END IF;
  target:=NEW.project_id;
  SELECT p.owner_id INTO owner FROM public.studio_projects p WHERE p.id=NEW.project_id;
 END IF;
 IF owner IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_OWNER_NOT_FOUND'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_OWNER_NOT_FOUND'; END IF;
 IF TG_OP='UPDATE' AND OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NOT NULL THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_RESTORE_BEFORE_EDIT'; END IF;
 IF TG_OP='UPDATE' AND OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
  AND (to_jsonb(OLD)-ARRAY['deleted_at','updated_at','version_number']) IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['deleted_at','updated_at','version_number'])
  THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_LIFECYCLE_SEPARATE_FROM_EDIT'; END IF;
 IF TG_TABLE_NAME='studio_cards' AND NEW.deleted_at IS NULL THEN
  SELECT p.deleted_at IS NULL AND p.status<>'archived' INTO active_project FROM public.studio_projects p WHERE p.id=NEW.project_id;
  IF NOT coalesce(active_project,false) THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_PROJECT_INACTIVE'; END IF;
 END IF;
 SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=owner AND p.status='active' AND upper(p.role::text)='ADMIN')
  OR EXISTS(SELECT 1 FROM public.studio_access a JOIN public.profiles p ON p.id=a.user_id AND p.status='active'
   WHERE a.user_id=owner AND a.revoked_at IS NULL AND a.starts_at<=now() AND a.expires_at>now()) INTO paid;
 IF paid THEN
  UPDATE studio_private.explore_project_bindings_v1 SET paid_write_at=coalesce(paid_write_at,now())
   WHERE project_id=target AND owner_id=owner;
  RETURN NEW;
 END IF;
 IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_CAPACITY_ISOLATION_REQUIRED'; END IF;
 IF auth.uid() IS DISTINCT FROM owner OR NOT studio_private.explore_active_v1() THEN RAISE EXCEPTION USING ERRCODE='42501',message='STUDIO_OWNER_REQUIRED'; END IF;
 IF TG_TABLE_NAME='studio_projects' THEN
  IF TG_OP='UPDATE' AND NOT EXISTS(SELECT 1 FROM studio_private.explore_project_bindings_v1 b WHERE b.project_id=NEW.id AND b.owner_id=owner) THEN
   RAISE EXCEPTION USING ERRCODE='42501',message='STUDIO_PROJECT_BINDING_REQUIRED';
  END IF;
  IF NEW.deleted_at IS NULL AND NEW.status<>'archived' THEN
   SELECT count(*) INTO n FROM public.studio_projects p JOIN studio_private.explore_project_bindings_v1 b ON b.project_id=p.id AND b.owner_id=p.owner_id
    WHERE p.owner_id=owner AND b.paid_write_at IS NULL AND p.deleted_at IS NULL AND p.status<>'archived' AND p.id<>NEW.id
     AND (SELECT count(*) FROM public.studio_cards c2 WHERE c2.project_id=p.id AND c2.deleted_at IS NULL)<=10;
   IF n>=1 THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_EXPLORE_PROJECT_CAPACITY'; END IF;
   SELECT count(*) INTO n FROM public.studio_cards c WHERE c.project_id=NEW.id AND c.deleted_at IS NULL;
   IF n>10 THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_EXPLORE_CARD_CAPACITY'; END IF;
  END IF;
 ELSE
  SELECT EXISTS(SELECT 1 FROM studio_private.explore_project_bindings_v1 b WHERE b.project_id=NEW.project_id AND b.owner_id=owner) INTO bound;
  IF NOT bound THEN RAISE EXCEPTION USING ERRCODE='42501',message='STUDIO_PROJECT_BINDING_REQUIRED'; END IF;
  IF NEW.deleted_at IS NULL THEN
   SELECT count(*) INTO n FROM public.studio_cards c WHERE c.project_id=NEW.project_id AND c.deleted_at IS NULL AND c.id<>NEW.id;
   IF n>=10 THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_EXPLORE_CARD_CAPACITY'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;

-- A paid write to a previously free project is retained as paid work after
-- expiry. It is never silently converted back to Explore. Existing versions
-- and child records are left untouched.
CREATE FUNCTION studio_private.mark_explore_paid_write_v1()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target uuid; owner uuid; paid boolean;
BEGIN
 IF TG_OP='DELETE' THEN target:=OLD.project_id; ELSE target:=NEW.project_id; END IF;
 SELECT p.owner_id INTO owner FROM public.studio_projects p WHERE p.id=target;
 IF owner IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_OWNER_NOT_FOUND'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_OWNER_NOT_FOUND'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=owner AND p.status='active' AND upper(p.role::text)='ADMIN')
  OR EXISTS(SELECT 1 FROM public.studio_access a JOIN public.profiles p ON p.id=a.user_id AND p.status='active'
   WHERE a.user_id=owner AND a.revoked_at IS NULL AND a.starts_at<=now() AND a.expires_at>now()) INTO paid;
 IF paid THEN
  UPDATE studio_private.explore_project_bindings_v1 SET paid_write_at=coalesce(paid_write_at,now()) WHERE project_id=target AND owner_id=owner;
 ELSIF current_setting('transaction_isolation')<>'read committed' OR NOT studio_private.explore_active_project_v1(target) THEN
  RAISE EXCEPTION USING ERRCODE='42501',message='STUDIO_PROJECT_BINDING_REQUIRED';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION studio_private.mark_explore_paid_write_v1() FROM PUBLIC;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['studio_card_families','studio_guidebook_sections','studio_journal_entries','studio_journal_photos','studio_journal_excerpts','studio_production_plans','studio_import_records'] LOOP
  EXECUTE format('CREATE TRIGGER studio_mark_explore_paid_write BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION studio_private.mark_explore_paid_write_v1()',t);
 END LOOP;
END $$;

-- Scope mutations to current paid rights or an owner-bound active Explore project.
ALTER POLICY "Studio entitlement required for editing" ON public.studio_projects
 USING (studio_private.has_access() OR studio_private.explore_bound_v1(id))
 WITH CHECK (studio_private.has_access() OR studio_private.explore_bound_v1(id));
-- The prior Explore policies for cards and child tables call the replaced
-- explore_active_project_v1 helper and therefore inherit the trusted binding.

-- Owner read is paid, within verified projected grace, or an Explore binding.
ALTER POLICY "Studio entitlement required for reading" ON public.studio_projects
 USING (studio_private.has_access() OR (owner_id=auth.uid() AND (studio_private.owner_download_grace_v1() OR studio_private.explore_bound_v1(id))));
DO $$ DECLARE t text; prefix text; BEGIN
 FOREACH t IN ARRAY ARRAY['studio_card_families','studio_cards','studio_card_versions','studio_guidebook_sections','studio_guidebook_versions','studio_import_records','studio_journal_entries','studio_journal_excerpts','studio_journal_photos','studio_production_plans','studio_production_plan_versions'] LOOP
  prefix:=CASE WHEN t LIKE 'studio_journal_%' OR t LIKE 'studio_production_%' THEN 'Manual Studio access required ' ELSE 'Studio entitlement required ' END;
  EXECUTE format('ALTER POLICY %I ON public.%I USING (studio_private.has_access() OR (public.studio_owns_project(project_id) AND (studio_private.owner_download_grace_v1() OR studio_private.explore_bound_v1(project_id))))',prefix||'read',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['studio_production_plans','studio_production_plan_versions'] LOOP
  prefix:=CASE WHEN t='studio_production_plans' THEN 'Creators can read own production plan' ELSE 'Creators can read own production plan history' END;
  EXECUTE format('ALTER POLICY %I ON public.%I USING (public.studio_owns_project(project_id) AND (studio_private.has_access() OR studio_private.owner_download_grace_v1() OR studio_private.explore_bound_v1(project_id)))',prefix,t);
 END LOOP;
END $$;

-- Preserve creator-visible editorial history for a bound free project without
-- granting service submission or expanding access to other paid projects.
ALTER POLICY "Owner or assigned editorial recipient only" ON public.studio_editorial_requests
 USING (studio_private.editorial_actor_active_v1() AND
  (studio_private.editorial_owner_read_v1(owner_id)
   OR (owner_id=auth.uid() AND studio_private.explore_bound_v1(project_id))
   OR studio_private.editorial_staff_v1(recipient_id)));
CREATE OR REPLACE FUNCTION studio_private.editorial_history_access_v1(p_project uuid,p_allow_expired boolean)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.studio_projects WHERE id=p_project AND owner_id=auth.uid())
  AND EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND status='active')
  AND (studio_private.has_access() OR (coalesce(p_allow_expired,false) AND
       (studio_private.owner_download_grace_v1() OR studio_private.explore_bound_v1(p_project))));
$$;

-- Journal object paths are owner/project scoped by the previous candidate.
-- Only that known bucket/path is changed; other media policies require their
-- own exact review before hosted execution.
ALTER POLICY "Manual Studio journal media read" ON storage.objects
 USING (bucket_id<>'studio-journal-photos' OR studio_private.has_access()
   OR ((storage.foldername(name))[1]=auth.uid()::text AND
       (studio_private.owner_download_grace_v1() OR studio_private.explore_journal_object_v1(name))));

-- SECURITY DEFINER deletion helper from the previous candidate must not grant
-- free access to an unclassified former paid project.
CREATE OR REPLACE FUNCTION public.studio_remove_deleted_project_card_v1(target_project uuid,target_card uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT (studio_private.has_access() OR studio_private.explore_bound_v1(target_project)) OR NOT EXISTS(
  SELECT 1 FROM public.studio_projects p WHERE p.id=target_project AND p.owner_id=auth.uid() AND p.deleted_at IS NOT NULL
 ) THEN RAISE EXCEPTION USING ERRCODE='42501',message='STUDIO_DELETED_PROJECT_REQUIRED'; END IF;
 UPDATE public.studio_cards SET deleted_at=now() WHERE id=target_card AND project_id=target_project AND deleted_at IS NULL;
 RETURN FOUND;
END $$;

-- The original retention helper also protects private editorial and Storage
-- consumers. Their exact current policy definitions and all project-specific
-- media paths still need guarded reconciliation before this is executable.
ROLLBACK;
