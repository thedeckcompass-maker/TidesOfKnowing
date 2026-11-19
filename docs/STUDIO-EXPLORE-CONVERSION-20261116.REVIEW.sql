-- REVIEW ONLY; ends in ROLLBACK. No client grant, route or hosted activation.
-- This draft covers only an unbound, owned project with current read access.
-- It does not clear paid-write markers or rewrite historical evidence.
BEGIN;
CREATE FUNCTION studio_private.review_convert_to_explore_v1(target uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=auth.uid(); project_row public.studio_projects; n bigint;
BEGIN
 IF actor IS NULL OR NOT studio_private.explore_active_v1() OR studio_private.has_access() THEN
  RAISE EXCEPTION USING ERRCODE='42501',message='STUDIO_CONVERSION_NOT_ELIGIBLE';
 END IF;
 PERFORM 1 FROM public.profiles WHERE id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='42501',message='STUDIO_CONVERSION_NOT_ELIGIBLE'; END IF;
 SELECT * INTO project_row FROM public.studio_projects p WHERE p.id=target AND p.owner_id=actor FOR UPDATE;
 IF NOT FOUND OR project_row.deleted_at IS NOT NULL OR project_row.status='archived' OR NOT public.studio_project_can_read_v1(target) THEN
  RAISE EXCEPTION USING ERRCODE='42501',message='STUDIO_CONVERSION_NOT_ELIGIBLE';
 END IF;
 IF EXISTS(SELECT 1 FROM studio_private.explore_project_bindings_v1 b WHERE b.project_id=target) THEN
  RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_CONVERSION_BINDING_REQUIRES_REVIEW';
 END IF;
 SELECT count(*) INTO n FROM public.studio_cards c WHERE c.project_id=target AND c.deleted_at IS NULL;
 IF n>10 THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_EXPLORE_CARD_CAPACITY'; END IF;
 SELECT count(*) INTO n FROM studio_private.explore_project_bindings_v1 b
  JOIN public.studio_projects p ON p.id=b.project_id AND p.owner_id=b.owner_id
  WHERE b.owner_id=actor AND b.paid_write_at IS NULL AND p.deleted_at IS NULL AND p.status<>'archived'
   AND (SELECT count(*) FROM public.studio_cards c WHERE c.project_id=p.id AND c.deleted_at IS NULL)<=10;
 IF n>0 THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_EXPLORE_PROJECT_CAPACITY'; END IF;
 INSERT INTO studio_private.explore_project_bindings_v1(project_id,owner_id) VALUES(target,actor);
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION studio_private.review_convert_to_explore_v1(uuid) FROM PUBLIC, anon, authenticated;
ROLLBACK;
