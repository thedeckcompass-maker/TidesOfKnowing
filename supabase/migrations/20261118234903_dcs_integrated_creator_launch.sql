-- PRODUCTION INSTALLER: vbdqvjvhjleqdadiiqjx. No production execution authorised by this file.
-- Execute this one migration only after fresh read-only preflight and explicit owner approval.
-- Supply both required dcs.* settings with SET LOCAL inside this transaction, using the approved runner.
BEGIN; SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='60s';
DO $release_target$ BEGIN IF current_setting('dcs.release_target_ref',true) IS DISTINCT FROM 'vbdqvjvhjleqdadiiqjx' OR current_setting('dcs.owner_approved_install',true) IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'STOP: explicit approved install context for vbdqvjvhjleqdadiiqjx required'; END IF; END $release_target$;
-- Integrated creator compatibility body; connected acceptance and recovery rehearsed in the isolated project.
-- This installer commits only under the explicit approved production context above.
-- Read policies and existing owner_download_grace_v1 are deliberately retained.
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


CREATE TABLE studio_private.complimentary_develop_workspace_v1 (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((revoked_at IS NULL) = (revoked_by IS NULL))
);
CREATE TABLE studio_private.complimentary_develop_audit_v1 (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK(action IN ('grant','revoke','restore')),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE studio_private.complimentary_develop_workspace_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_private.complimentary_develop_audit_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON studio_private.complimentary_develop_workspace_v1,studio_private.complimentary_develop_audit_v1 FROM PUBLIC,anon,authenticated;

CREATE FUNCTION studio_private.has_complimentary_develop_workspace_v1()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
   SELECT 1 FROM studio_private.complimentary_develop_workspace_v1 g
   JOIN public.profiles p ON p.id=g.user_id
   WHERE g.user_id=auth.uid() AND g.revoked_at IS NULL AND p.status='active'
 );
$$;
REVOKE ALL ON FUNCTION studio_private.has_complimentary_develop_workspace_v1() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION studio_private.has_complimentary_develop_workspace_v1() TO authenticated,dcs_service_executor;

-- This helper is for creator-workspace policies only. Service and community
-- policies continue to use their existing independent authorization checks.
CREATE FUNCTION studio_private.creator_workspace_full_access_v1()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT coalesce(studio_private.has_access(),false) OR
        coalesce(studio_private.has_complimentary_develop_workspace_v1(),false);
$$;
REVOKE ALL ON FUNCTION studio_private.creator_workspace_full_access_v1() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION studio_private.creator_workspace_full_access_v1() TO authenticated,dcs_service_executor;

CREATE FUNCTION public.studio_complimentary_develop_workspace_active_v1()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT studio_private.has_complimentary_develop_workspace_v1();
$$;
REVOKE ALL ON FUNCTION public.studio_complimentary_develop_workspace_active_v1() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.studio_complimentary_develop_workspace_active_v1() TO authenticated;

CREATE FUNCTION public.studio_inspect_complimentary_develop_workspace_v1(target_user uuid)
RETURNS TABLE(active boolean, updated_at timestamptz) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR target_user IS NULL OR auth.uid()=target_user OR NOT public.is_admin() OR NOT (EXISTS(
  SELECT 1 FROM public.profiles p JOIN auth.users u ON u.id=p.id
  WHERE p.id=target_user AND p.role='member'
   AND lower(u.email)='hello@thedeckcompass.com' AND u.email_confirmed_at IS NOT NULL
 ) OR EXISTS(SELECT 1 FROM studio_private.complimentary_develop_workspace_v1 g WHERE g.user_id=target_user))
 THEN RAISE EXCEPTION 'Administrator and exact confirmed member required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT (g.revoked_at IS NULL),g.updated_at FROM studio_private.complimentary_develop_workspace_v1 g WHERE g.user_id=target_user;
END $$;
REVOKE ALL ON FUNCTION public.studio_inspect_complimentary_develop_workspace_v1(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.studio_inspect_complimentary_develop_workspace_v1(uuid) TO authenticated;

-- The admin operation is scoped to the exact confirmed owner address; it never
-- writes payment, service, project, profile or studio_access records.
CREATE FUNCTION public.studio_manage_complimentary_develop_workspace_v1(
 target_user uuid, operation text, expected_updated_at timestamptz DEFAULT NULL
) RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); existing studio_private.complimentary_develop_workspace_v1; stamp timestamptz;
BEGIN
 IF actor IS NULL OR target_user IS NULL OR actor=target_user OR NOT public.is_admin() THEN
  RAISE EXCEPTION 'Administrator and distinct target required' USING ERRCODE='42501';
 END IF;
 IF operation NOT IN ('grant','revoke','restore') THEN RAISE EXCEPTION 'Invalid operation'; END IF;
 PERFORM 1 FROM public.profiles p
  WHERE p.id=target_user AND p.role='member' AND (
    (operation='revoke' AND EXISTS(SELECT 1 FROM studio_private.complimentary_develop_workspace_v1 g WHERE g.user_id=p.id)) OR
    (p.status='active' AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=p.id
      AND lower(u.email)='hello@thedeckcompass.com' AND u.email_confirmed_at IS NOT NULL))
  ) FOR UPDATE OF p;
 IF NOT FOUND THEN RAISE EXCEPTION 'Exact confirmed member with required active status required' USING ERRCODE='42501'; END IF;
 SELECT * INTO existing FROM studio_private.complimentary_develop_workspace_v1 g WHERE g.user_id=target_user FOR UPDATE;
 IF operation='grant' THEN
  IF existing.user_id IS NOT NULL OR expected_updated_at IS NOT NULL THEN RAISE EXCEPTION 'Grant already exists or unexpected revision'; END IF;
  INSERT INTO studio_private.complimentary_develop_workspace_v1(user_id,granted_by) VALUES(target_user,actor) RETURNING updated_at INTO stamp;
 ELSE
  IF existing.user_id IS NULL OR existing.updated_at IS DISTINCT FROM expected_updated_at THEN RAISE EXCEPTION 'Grant changed; reload before retrying'; END IF;
  IF operation='revoke' AND existing.revoked_at IS NULL THEN
   UPDATE studio_private.complimentary_develop_workspace_v1 SET revoked_at=clock_timestamp(),revoked_by=actor,updated_at=clock_timestamp() WHERE user_id=target_user RETURNING updated_at INTO stamp;
  ELSIF operation='restore' AND existing.revoked_at IS NOT NULL THEN
   UPDATE studio_private.complimentary_develop_workspace_v1 SET revoked_at=NULL,revoked_by=NULL,updated_at=clock_timestamp() WHERE user_id=target_user RETURNING updated_at INTO stamp;
  ELSE RAISE EXCEPTION 'Grant already in requested state'; END IF;
 END IF;
 INSERT INTO studio_private.complimentary_develop_audit_v1(user_id,actor_id,action) VALUES(target_user,actor,operation);
 RETURN stamp;
END $$;
REVOKE ALL ON FUNCTION public.studio_manage_complimentary_develop_workspace_v1(uuid,text,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.studio_manage_complimentary_develop_workspace_v1(uuid,text,timestamptz) TO authenticated;

-- REVIEW ONLY: apply only with the matching application release and approval.
-- Writing statuses are independent of removal; no creative rows are destroyed.
alter table public.studio_projects add column if not exists deleted_at timestamptz;
alter table public.studio_cards add column if not exists deleted_at timestamptz;

create or replace function studio_private.explore_active_v1()
returns boolean language sql stable security definer set search_path = pg_catalog, public
as $$ select exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active') $$;
revoke all on function studio_private.explore_active_v1() from public;
grant execute on function studio_private.explore_active_v1() to authenticated;
create or replace function studio_private.explore_active_project_v1(target uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public
as $$ select studio_private.explore_active_v1() and exists (
  select 1 from public.studio_projects p where p.id=target and p.owner_id=auth.uid()
    and p.deleted_at is null and p.status <> 'archived') $$;
revoke all on function studio_private.explore_active_project_v1(uuid) from public;
grant execute on function studio_private.explore_active_project_v1(uuid) to authenticated;
create or replace function studio_private.explore_journal_object_v1(object_name text)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
  select case when (storage.foldername(object_name))[1]=auth.uid()::text
    and (storage.foldername(object_name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then studio_private.explore_active_project_v1(((storage.foldername(object_name))[2])::uuid)
    else false end
$$;
revoke all on function studio_private.explore_journal_object_v1(text) from public;
grant execute on function studio_private.explore_journal_object_v1(text) to authenticated;

-- The profile lock serialises all project/card lifecycle changes for one owner.
-- Counts are current, never cumulative. Reject other isolation levels because their
-- transaction snapshots may not see the preceding lock holder's committed changes.
create or replace function studio_private.explore_capacity_v1()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare owner uuid; project_active boolean; paid boolean; n bigint;
begin
  if tg_table_name = 'studio_projects' then
    owner := new.owner_id;
    if tg_op = 'UPDATE' and old.owner_id <> new.owner_id then
      raise exception using errcode='P0001', message='STUDIO_PROJECT_OWNER_IMMUTABLE';
    end if;
  else
    if tg_op = 'UPDATE' and old.project_id <> new.project_id then
      raise exception using errcode='P0001', message='STUDIO_CARD_PROJECT_IMMUTABLE';
    end if;
    select p.owner_id, (p.deleted_at is null and p.status <> 'archived') into owner, project_active
      from public.studio_projects p where p.id = new.project_id;
  end if;
  if owner is null then raise exception using errcode='P0001', message='STUDIO_OWNER_NOT_FOUND'; end if;
  perform 1 from public.profiles p where p.id=owner for update;
  if not found then raise exception using errcode='P0001', message='STUDIO_OWNER_NOT_FOUND'; end if;
  if tg_op = 'UPDATE' and old.deleted_at is not null and new.deleted_at is not null then
    raise exception using errcode='P0001', message='STUDIO_RESTORE_BEFORE_EDIT';
  end if;
  if tg_op = 'UPDATE' and (old.deleted_at is distinct from new.deleted_at)
     and (to_jsonb(old) - array['deleted_at','updated_at','version_number'])
       is distinct from (to_jsonb(new) - array['deleted_at','updated_at','version_number']) then
    raise exception using errcode='P0001', message='STUDIO_LIFECYCLE_SEPARATE_FROM_EDIT';
  end if;
  if tg_table_name = 'studio_cards' and new.deleted_at is null then
    select (p.deleted_at is null and p.status <> 'archived') into project_active
      from public.studio_projects p where p.id=new.project_id;
    if not coalesce(project_active,false) then raise exception using errcode='P0001', message='STUDIO_PROJECT_INACTIVE'; end if;
  end if;
  select exists(select 1 from public.profiles p where p.id=owner and p.status='active' and upper(p.role::text)='ADMIN')
    or exists(select 1 from public.studio_access a where a.user_id=owner and a.revoked_at is null
      and a.starts_at <= now() and a.expires_at > now()) into paid;
  if paid then return new; end if;
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception using errcode='P0001', message='STUDIO_CAPACITY_ISOLATION_REQUIRED';
  end if;
  if tg_table_name = 'studio_projects' then
    -- Ordinary edits, including edits after paid expiry, never consume capacity.
    if tg_op = 'UPDATE' and old.deleted_at is null and old.status <> 'archived'
       and new.deleted_at is null and new.status <> 'archived' then return new; end if;
    if new.deleted_at is null and new.status <> 'archived' then
      select count(*) into n from public.studio_projects p
        where p.owner_id=owner and p.deleted_at is null and p.status <> 'archived' and p.id <> new.id;
      if n >= 1 then raise exception using errcode='P0001', message='STUDIO_EXPLORE_PROJECT_CAPACITY'; end if;
      -- Restoring a former paid project must not activate more than ten cards.
      select count(*) into n from public.studio_cards c where c.project_id=new.id and c.deleted_at is null;
      if n > 10 then raise exception using errcode='P0001', message='STUDIO_EXPLORE_CARD_CAPACITY'; end if;
    end if;
  else
    if tg_op = 'UPDATE' and old.deleted_at is null and new.deleted_at is null
       and coalesce(project_active,false) then return new; end if;
    if new.deleted_at is null then
      if not coalesce(project_active,false) then raise exception using errcode='P0001', message='STUDIO_PROJECT_INACTIVE'; end if;
      select count(*) into n from public.studio_cards c
        where c.project_id=new.project_id and c.deleted_at is null and c.id <> new.id;
      if n >= 10 then raise exception using errcode='P0001', message='STUDIO_EXPLORE_CARD_CAPACITY'; end if;
    end if;
  end if;
  return new;
end $$;

-- Journal photos are private to the owner and an active owned project. Delete
-- permission supports cleanup of an upload whose database insert failed.
alter policy "Manual Studio journal media insert" on storage.objects
  with check (bucket_id <> 'studio-journal-photos' or studio_private.creator_workspace_full_access_v1() or studio_private.explore_journal_object_v1(name));
alter policy "Manual Studio journal media update" on storage.objects
  using (bucket_id <> 'studio-journal-photos' or studio_private.creator_workspace_full_access_v1() or studio_private.explore_journal_object_v1(name))
  with check (bucket_id <> 'studio-journal-photos' or studio_private.creator_workspace_full_access_v1() or studio_private.explore_journal_object_v1(name));
alter policy "Manual Studio journal media delete" on storage.objects
  using (bucket_id <> 'studio-journal-photos' or studio_private.creator_workspace_full_access_v1() or studio_private.explore_journal_object_v1(name));

-- Card capture and its associated creative settings must commit together.
create or replace function public.studio_capture_atomic_v1(target_project uuid, expected_updated_at timestamptz, new_card jsonb, new_settings jsonb)
returns timestamptz language plpgsql security invoker set search_path = pg_catalog, public as $$
declare stamp timestamptz;
begin
  if auth.uid() is null or jsonb_typeof(new_settings) <> 'object' then
    raise exception using errcode='P0001', message='STUDIO_CAPTURE_INVALID';
  end if;
  if new_card is not null then
    insert into public.studio_cards (id,project_id,title,card_number,sort_order,family_id)
      values ((new_card->>'id')::uuid,target_project,new_card->>'title',coalesce(new_card->>'card_number',''),
              (new_card->>'sort_order')::integer,nullif(new_card->>'family_id','')::uuid);
  end if;
  update public.studio_projects set settings=new_settings
    where id=target_project and owner_id=auth.uid() and deleted_at is null and status <> 'archived'
      and updated_at=expected_updated_at returning updated_at into stamp;
  if stamp is null then raise exception using errcode='P0001', message='STUDIO_CAPTURE_CONFLICT'; end if;
  return stamp;
end $$;
revoke all on function public.studio_capture_atomic_v1(uuid,timestamptz,jsonb,jsonb) from public;
grant execute on function public.studio_capture_atomic_v1(uuid,timestamptz,jsonb,jsonb) to authenticated;

-- Owner-scoped variant of the existing paid inspiration link. The original
-- function remains untouched; both inboxes are updated in one transaction.
create or replace function public.studio_explore_inspiration_link_v1(capture_id uuid, project_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare actor uuid:=auth.uid(); saved jsonb; entry jsonb; pos integer; settings_value jsonb; collection jsonb; existing jsonb; receipt jsonb; stamp timestamptz;
begin
 if actor is null or not (studio_private.explore_active_project_v1(project_id) OR
   (studio_private.creator_workspace_full_access_v1() AND EXISTS(
    SELECT 1 FROM public.studio_projects p WHERE p.id=project_id AND p.owner_id=actor AND p.deleted_at IS NULL AND p.status<>'archived'))) then
   raise exception 'Active owned project required' using errcode='42501';
 end if;
 select inbox into saved from public.studio_creator_inspiration where owner_id=actor for update;
 select e.value,(e.ordinality-1)::integer into entry,pos from jsonb_array_elements(saved->'entries') with ordinality e(value,ordinality) where e.value->>'id'=capture_id::text;
 if entry is null then raise exception 'Owned inspiration not found'; end if;
 select p.settings,p.updated_at into settings_value,stamp from public.studio_projects p
   where p.id=project_id and p.owner_id=actor and p.deleted_at is null and p.status <> 'archived' for update;
 if not found then raise exception 'Owned project not found' using errcode='42501'; end if;
 if entry->'projectLink' is not null and entry->'projectLink'<>'null'::jsonb then
   if entry->'projectLink'->>'projectId'<>project_id::text then raise exception 'This inspiration is already linked to another project'; end if;
   return jsonb_build_object('projectId',project_id,'captureId',capture_id,'updatedAt',stamp);
 end if;
 settings_value:=coalesce(settings_value,'{}'::jsonb); collection:=coalesce(settings_value->'creative_inbox_v1','{"version":1,"entries":[]}'::jsonb);
 if collection->>'version'<>'1' or jsonb_typeof(collection->'entries')<>'array' then raise exception 'Project inspiration needs review'; end if;
 select e into existing from jsonb_array_elements(collection->'entries') e where e->>'id'=capture_id::text;
 if existing is not null then
   if existing->>'text'<>entry->>'text' or existing->'image' is distinct from entry->'image' then raise exception 'Project capture identity conflict'; end if;
 else collection:=jsonb_set(collection,'{entries}',(collection->'entries')||jsonb_build_array(entry-'projectLink')); end if;
 settings_value:=jsonb_set(settings_value,'{creative_inbox_v1}',collection);
 if jsonb_array_length(collection->'entries')>1000 or octet_length(settings_value::text)>6500000 then raise exception 'Project capture limit reached'; end if;
 update public.studio_projects p set settings=settings_value where p.id=project_id and p.owner_id=actor returning p.updated_at into stamp;
 receipt:=jsonb_build_object('projectId',project_id,'captureId',capture_id,'at',now());
 saved:=jsonb_set(saved,array['entries',pos::text,'projectLink'],receipt);
 update public.studio_creator_inspiration set inbox=saved,revision=revision+1,updated_at=now() where owner_id=actor;
 return jsonb_build_object('projectId',project_id,'captureId',capture_id,'updatedAt',stamp);
end $$;
revoke all on function public.studio_explore_inspiration_link_v1(uuid,uuid) from public;
grant execute on function public.studio_explore_inspiration_link_v1(uuid,uuid) to authenticated;

-- An expired paid project can have more than ten cards. Permit its owner to
-- remove active cards from that deleted project before restoring it; no card
-- or history is physically deleted and no other project can be addressed.
create or replace function public.studio_remove_deleted_project_card_v1(target_project uuid, target_card uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  if not studio_private.explore_active_v1() or not exists(
    select 1 from public.studio_projects p where p.id=target_project and p.owner_id=auth.uid() and p.deleted_at is not null
  ) then raise exception using errcode='42501',message='STUDIO_DELETED_PROJECT_REQUIRED'; end if;
  update public.studio_cards set deleted_at=now() where id=target_card and project_id=target_project and deleted_at is null;
  return found;
end $$;
revoke all on function public.studio_remove_deleted_project_card_v1(uuid,uuid) from public;
grant execute on function public.studio_remove_deleted_project_card_v1(uuid,uuid) to authenticated;
revoke all on function studio_private.explore_capacity_v1() from public;
create trigger studio_explore_project_capacity before insert or update on public.studio_projects
  for each row execute function studio_private.explore_capacity_v1();
create trigger studio_explore_card_capacity before insert or update on public.studio_cards
  for each row execute function studio_private.explore_capacity_v1();

-- Only own creator-work tables are opened to active members. Their existing
-- permissive ownership policies still apply; no paid service policy is changed.
alter policy "Studio entitlement required for creating" on public.studio_projects
  with check (studio_private.creator_workspace_full_access_v1() or studio_private.explore_active_v1());
alter policy "Studio entitlement required for editing" on public.studio_projects
  using (studio_private.creator_workspace_full_access_v1() or studio_private.explore_active_v1())
  with check (studio_private.creator_workspace_full_access_v1() or studio_private.explore_active_v1());
alter policy "Studio entitlement required insert" on public.studio_cards
  with check (studio_private.creator_workspace_full_access_v1() or studio_private.explore_active_project_v1(project_id));
alter policy "Studio entitlement required update" on public.studio_cards
  using (studio_private.creator_workspace_full_access_v1() or studio_private.explore_active_project_v1(project_id))
  with check (studio_private.creator_workspace_full_access_v1() or studio_private.explore_active_project_v1(project_id));

-- Narrow creator-owned data needed by cards, guidebooks and journals. Existing
-- permissive owner policies still apply and physical deletes stay paid-only.
do $$ declare t text; prefix text; begin
  foreach t in array array['studio_card_families','studio_guidebook_sections','studio_journal_entries','studio_journal_photos','studio_journal_excerpts','studio_production_plans'] loop
    prefix := case when t like 'studio_journal_%' or t='studio_production_plans' then 'Manual Studio access required ' else 'Studio entitlement required ' end;
    execute format('alter policy %I on public.%I with check (studio_private.creator_workspace_full_access_v1() or studio_private.explore_active_project_v1(project_id))',prefix||'insert',t);
    execute format('alter policy %I on public.%I using (studio_private.creator_workspace_full_access_v1() or studio_private.explore_active_project_v1(project_id)) with check (studio_private.creator_workspace_full_access_v1() or studio_private.explore_active_project_v1(project_id))',prefix||'update',t);
  end loop;
end $$;

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

CREATE FUNCTION studio_private.bind_new_explore_project_v1()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF auth.uid()=NEW.owner_id AND studio_private.explore_active_v1() AND NOT studio_private.creator_workspace_full_access_v1() THEN
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
   AND (studio_private.creator_workspace_full_access_v1() OR studio_private.explore_active_project_v1(p.id)));
$$;
REVOKE ALL ON FUNCTION public.studio_project_can_edit_v1(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.studio_project_can_edit_v1(uuid) TO authenticated;
CREATE FUNCTION public.studio_project_can_read_v1(p_project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.studio_projects p
 JOIN public.profiles u ON u.id=p.owner_id AND u.status='active'
 WHERE p.id=p_project AND p.owner_id=auth.uid());
$$;
REVOKE ALL ON FUNCTION public.studio_project_can_read_v1(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.studio_project_can_read_v1(uuid) TO authenticated;
CREATE FUNCTION public.studio_project_can_manage_lifecycle_v1(p_project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.studio_projects p WHERE p.id=p_project AND p.owner_id=auth.uid()
   AND (studio_private.creator_workspace_full_access_v1() OR studio_private.explore_bound_v1(p.id)));
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
 -- Preserve old unclassified project/card trigger behaviour. They are governed
 -- by the pre-existing RLS branch, never inferred to be Explore by card count.
 IF TG_TABLE_NAME='studio_projects' AND TG_OP='UPDATE' AND NOT EXISTS(SELECT 1 FROM studio_private.explore_project_bindings_v1 WHERE project_id=target AND owner_id=owner) THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='studio_cards' AND NOT EXISTS(SELECT 1 FROM studio_private.explore_project_bindings_v1 WHERE project_id=target AND owner_id=owner) THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='studio_projects' AND TG_OP='INSERT' AND auth.uid() IS DISTINCT FROM owner THEN RETURN NEW; END IF;
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
 IF paid OR (auth.uid()=owner AND studio_private.has_complimentary_develop_workspace_v1()) THEN
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
 IF NOT EXISTS(SELECT 1 FROM studio_private.explore_project_bindings_v1 WHERE project_id=target AND owner_id=owner) THEN IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW; END IF;
 PERFORM 1 FROM public.profiles WHERE id=owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0001',message='STUDIO_OWNER_NOT_FOUND'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=owner AND p.status='active' AND upper(p.role::text)='ADMIN')
  OR EXISTS(SELECT 1 FROM public.studio_access a JOIN public.profiles p ON p.id=a.user_id AND p.status='active'
   WHERE a.user_id=owner AND a.revoked_at IS NULL AND a.starts_at<=now() AND a.expires_at>now()) INTO paid;
 IF paid OR (auth.uid()=owner AND studio_private.has_complimentary_develop_workspace_v1()) THEN
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
 USING (studio_private.creator_workspace_full_access_v1() OR studio_private.explore_bound_v1(id))
 WITH CHECK (studio_private.creator_workspace_full_access_v1() OR studio_private.explore_bound_v1(id));
-- The prior Explore policies for cards and child tables call the replaced
-- explore_active_project_v1 helper and therefore inherit the trusted binding.

CREATE OR REPLACE FUNCTION public.studio_remove_deleted_project_card_v1(target_project uuid,target_card uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT (studio_private.creator_workspace_full_access_v1() OR studio_private.explore_bound_v1(target_project)) OR NOT EXISTS(
  SELECT 1 FROM public.studio_projects p WHERE p.id=target_project AND p.owner_id=auth.uid() AND p.deleted_at IS NOT NULL
 ) THEN RAISE EXCEPTION USING ERRCODE='42501',message='STUDIO_DELETED_PROJECT_REQUIRED'; END IF;
 UPDATE public.studio_cards SET deleted_at=now() WHERE id=target_card AND project_id=target_project AND deleted_at IS NULL;
 RETURN FOUND;
END $$;


CREATE FUNCTION public.studio_has_write_access() RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT studio_private.creator_workspace_full_access_v1(); $$;
REVOKE ALL ON FUNCTION public.studio_has_write_access() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.studio_has_write_access() TO authenticated;
-- The pre-existing service executor is subject to the same restrictive
-- policies; it must be able to evaluate each branch without changing RLS.
GRANT EXECUTE ON FUNCTION studio_private.explore_active_v1(),studio_private.explore_active_project_v1(uuid),studio_private.explore_bound_v1(uuid),studio_private.explore_journal_object_v1(text) TO dcs_service_executor;
-- Preserve the existing finite-grant export and add a separate, owner-scoped
-- path for the complimentary grant. Existing enquiry policies still apply.
CREATE POLICY dcs_complimentary_exchange_backup_v1 ON public.studio_visual_exchange FOR SELECT TO authenticated
 USING (studio_private.has_complimentary_develop_workspace_v1() AND owner_id=auth.uid()
  AND EXISTS(SELECT 1 FROM public.studio_projects p WHERE p.id=studio_visual_exchange.project_id AND p.owner_id=auth.uid()));
CREATE POLICY dcs_complimentary_exchange_revision_v1 ON studio_private.exchange_export_revisions_v1 FOR SELECT TO authenticated
 USING (studio_private.has_complimentary_develop_workspace_v1()
  AND EXISTS(SELECT 1 FROM public.studio_projects p WHERE p.id=exchange_export_revisions_v1.project_id AND p.owner_id=auth.uid()));
CREATE FUNCTION public.studio_complimentary_exchange_export_snapshot_v1(p_project uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
SELECT jsonb_build_object('ownerId',auth.uid(),'projectId',p.id,'revision',coalesce((SELECT revision FROM studio_private.exchange_export_revisions_v1 WHERE project_id=p.id),0),'rows',coalesce((
 SELECT jsonb_agg(jsonb_build_object('id',e.id,'owner_id',e.owner_id,'project_id',e.project_id,'prior_id',coalesce(e.prior_id::text,''),'title',e.title,'selected_text',e.selected_text,
 'images',CASE WHEN e.selected_image<>'' THEN jsonb_build_array(jsonb_build_object('id',e.id::text,'image',e.selected_image,'note','')) ELSE e.images END,
 'source_fingerprint',coalesce(e.source_fingerprint,encode(sha256(convert_to(e.selected_text||e.selected_image||e.images::text,'UTF8')),'hex')),
 'source_version',e.source_version,'version',e.version,'revision',e.revision,'status',e.status,'created_at',e.created_at,
 'enquiries',coalesce((SELECT jsonb_agg(jsonb_build_object('id',i.id,'artist_user_id',i.artist_user_id,'artist_name',i.artist_name,'directory_status',i.directory_status,'message',i.message,'created_at',i.created_at) ORDER BY i.created_at,i.id) FROM public.studio_visual_interests i WHERE i.snapshot_id=e.id),'[]'::jsonb)) ORDER BY e.created_at,e.id)
 FROM public.studio_visual_exchange e WHERE e.project_id=p.id AND e.owner_id=auth.uid()),'[]'::jsonb))
FROM public.studio_projects p WHERE p.id=p_project AND p.owner_id=auth.uid() AND studio_private.has_complimentary_develop_workspace_v1();
$$;
REVOKE ALL ON FUNCTION public.studio_complimentary_exchange_export_snapshot_v1(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.studio_complimentary_exchange_export_snapshot_v1(uuid) TO authenticated;
-- Hosted Supabase can give anon and service_role direct default EXECUTE rights
-- in public. Revoking PUBLIC alone does not remove those independent grants.
-- Normalize only this candidate's RPCs; preserve all existing/default ACLs.
DO $candidate_rpc_acl$
DECLARE signature text;
BEGIN
 FOREACH signature IN ARRAY ARRAY['public.studio_project_can_read_v1(uuid)','public.studio_project_can_edit_v1(uuid)','public.studio_project_can_manage_lifecycle_v1(uuid)','public.studio_has_write_access()','public.studio_capture_atomic_v1(uuid,timestamptz,jsonb,jsonb)','public.studio_remove_deleted_project_card_v1(uuid,uuid)','public.studio_explore_inspiration_link_v1(uuid,uuid)','public.studio_complimentary_exchange_export_snapshot_v1(uuid)','public.studio_complimentary_develop_workspace_active_v1()','public.studio_inspect_complimentary_develop_workspace_v1(uuid)','public.studio_manage_complimentary_develop_workspace_v1(uuid,text,timestamptz)'] LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',signature);
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='service_role') THEN
   EXECUTE format('REVOKE ALL ON FUNCTION %s FROM service_role',signature);
  END IF;
 END LOOP;
END $candidate_rpc_acl$;
DO $$ BEGIN IF to_regprocedure('public.studio_restore_card_version(uuid,uuid,uuid,integer)') IS NULL OR md5(replace(pg_get_functiondef('public.studio_restore_card_version(uuid,uuid,uuid,integer)'::regprocedure),chr(13),''))<>'84761f181f2742091139598ecc217e85' OR pg_get_userbyid((SELECT proowner FROM pg_proc WHERE oid='public.studio_restore_card_version(uuid,uuid,uuid,integer)'::regprocedure))<>'postgres' THEN RAISE EXCEPTION 'STOP: version-restore baseline drift: studio_restore_card_version'; END IF; END $$;
CREATE OR REPLACE FUNCTION public.studio_restore_card_version(target_project_id uuid, target_card_id uuid, source_version_id uuid, expected_current_version integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  current_record public.studio_cards%rowtype;
  source_record public.studio_card_versions%rowtype;
  new_version integer;
  marked integer;
begin
  if auth.uid() is null
     or not public.studio_project_can_edit_v1(target_project_id)
     or not exists (select 1 from public.studio_projects where id = target_project_id and owner_id = auth.uid()) then
    raise exception 'Studio write access is required' using errcode = '42501';
  end if;

  select * into current_record from public.studio_cards
  where id = target_card_id and project_id = target_project_id and deleted_at is null for update;
  if not found then raise exception 'Card not found' using errcode = 'P0002'; end if;
  if current_record.version_number <> expected_current_version then
    raise exception 'Card changed since the version was reviewed' using errcode = '40001';
  end if;

  select * into source_record from public.studio_card_versions
  where id = source_version_id and card_id = target_card_id and project_id = target_project_id;
  if not found or source_record.version_number >= current_record.version_number then
    raise exception 'Choose an earlier version of this card' using errcode = '22023';
  end if;

  update public.studio_cards set
    title = source_record.snapshot->>'title',
    card_number = source_record.snapshot->>'card_number',
    family_id = nullif(source_record.snapshot->>'family_id', '')::uuid,
    sort_order = (source_record.snapshot->>'sort_order')::integer,
    status = source_record.snapshot->>'status',
    content = source_record.snapshot->'content'
  where id = target_card_id and project_id = target_project_id
  returning version_number into new_version;

  update public.studio_card_versions
  set restored_from_version_id = source_version_id
  where card_id = target_card_id and version_number = new_version;
  get diagnostics marked = row_count;
  if marked <> 1 then raise exception 'Card version provenance could not be recorded'; end if;
  return new_version;
end;
$function$;
DO $$ BEGIN IF to_regprocedure('public.studio_restore_guidebook_version(uuid,uuid,uuid,integer)') IS NULL OR md5(replace(pg_get_functiondef('public.studio_restore_guidebook_version(uuid,uuid,uuid,integer)'::regprocedure),chr(13),''))<>'807872b3cf744a5a33c13dc4219ac8da' OR pg_get_userbyid((SELECT proowner FROM pg_proc WHERE oid='public.studio_restore_guidebook_version(uuid,uuid,uuid,integer)'::regprocedure))<>'postgres' THEN RAISE EXCEPTION 'STOP: version-restore baseline drift: studio_restore_guidebook_version'; END IF; END $$;
CREATE OR REPLACE FUNCTION public.studio_restore_guidebook_version(target_project_id uuid, target_section_id uuid, source_version_id uuid, expected_current_version integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  current_record public.studio_guidebook_sections%rowtype;
  source_record public.studio_guidebook_versions%rowtype;
  new_version integer;
  marked integer;
begin
  if auth.uid() is null
     or not public.studio_project_can_edit_v1(target_project_id)
     or not exists (select 1 from public.studio_projects where id = target_project_id and owner_id = auth.uid()) then
    raise exception 'Studio write access is required' using errcode = '42501';
  end if;

  select * into current_record from public.studio_guidebook_sections
  where id = target_section_id and project_id = target_project_id for update;
  if not found then raise exception 'Section not found' using errcode = 'P0002'; end if;
  if current_record.version_number <> expected_current_version then
    raise exception 'Section changed since the version was reviewed' using errcode = '40001';
  end if;

  select * into source_record from public.studio_guidebook_versions
  where id = source_version_id and section_id = target_section_id and project_id = target_project_id;
  if not found or source_record.version_number >= current_record.version_number then
    raise exception 'Choose an earlier version of this section' using errcode = '22023';
  end if;

  update public.studio_guidebook_sections set
    title = source_record.snapshot->>'title',
    section_type = source_record.snapshot->>'section_type',
    sort_order = (source_record.snapshot->>'sort_order')::integer,
    status = source_record.snapshot->>'status',
    body_markdown = source_record.snapshot->>'body_markdown',
    card_id = nullif(source_record.snapshot->>'card_id', '')::uuid,
    metadata = coalesce(source_record.snapshot->'metadata', '{}'::jsonb)
  where id = target_section_id and project_id = target_project_id
  returning version_number into new_version;

  update public.studio_guidebook_versions
  set restored_from_version_id = source_version_id
  where section_id = target_section_id and version_number = new_version;
  get diagnostics marked = row_count;
  if marked <> 1 then raise exception 'Section version provenance could not be recorded'; end if;
  return new_version;
end;
$function$;

DO $postflight$
DECLARE signature text; f oid;
BEGIN
 FOREACH signature IN ARRAY ARRAY['public.studio_project_can_read_v1(uuid)','public.studio_project_can_edit_v1(uuid)','public.studio_project_can_manage_lifecycle_v1(uuid)','public.studio_has_write_access()','public.studio_capture_atomic_v1(uuid,timestamptz,jsonb,jsonb)','public.studio_remove_deleted_project_card_v1(uuid,uuid)','public.studio_explore_inspiration_link_v1(uuid,uuid)','public.studio_complimentary_exchange_export_snapshot_v1(uuid)','public.studio_complimentary_develop_workspace_active_v1()','public.studio_inspect_complimentary_develop_workspace_v1(uuid)','public.studio_manage_complimentary_develop_workspace_v1(uuid,text,timestamptz)'] LOOP
  f:=to_regprocedure(signature); IF f IS NULL OR pg_get_userbyid((SELECT proowner FROM pg_catalog.pg_proc WHERE oid=f))<>'postgres' OR has_function_privilege('anon',f,'EXECUTE') OR has_function_privilege('public',f,'EXECUTE') OR NOT has_function_privilege('authenticated',f,'EXECUTE') THEN RAISE EXCEPTION 'STOP: function owner or ACL mismatch: %',signature; END IF;
 END LOOP;
 IF NOT has_function_privilege('dcs_service_executor','studio_private.creator_workspace_full_access_v1()','EXECUTE') OR NOT has_function_privilege('dcs_service_executor','studio_private.explore_bound_v1(uuid)','EXECUTE') THEN RAISE EXCEPTION 'STOP: service executor cannot evaluate policies'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='studio_private' AND c.relname='complimentary_develop_workspace_v1' AND c.relrowsecurity AND pg_get_userbyid(c.relowner)='postgres') THEN RAISE EXCEPTION 'STOP: private grant ownership/RLS mismatch'; END IF;
END $postflight$;
-- Remaining schema, policy and export prerequisites still require hosted reconciliation.

DO $installed_contracts$ BEGIN IF to_regprocedure('"public"."studio_capture_atomic_v1"(uuid, timestamp with time zone, jsonb, jsonb)') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_capture_atomic_v1"(uuid, timestamp with time zone, jsonb, jsonb)'::regprocedure),chr(13),''))<>'798fdbc15742293b1cc9ecc8aa1f5ff5' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_capture_atomic_v1'; END IF;
IF to_regprocedure('"public"."studio_complimentary_develop_workspace_active_v1"()') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_complimentary_develop_workspace_active_v1"()'::regprocedure),chr(13),''))<>'9dba4cea3580a1476562ba58738b47a7' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_complimentary_develop_workspace_active_v1'; END IF;
IF to_regprocedure('"public"."studio_complimentary_exchange_export_snapshot_v1"(uuid)') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_complimentary_exchange_export_snapshot_v1"(uuid)'::regprocedure),chr(13),''))<>'25977ed487c1d162107294fe617cfc86' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_complimentary_exchange_export_snapshot_v1'; END IF;
IF to_regprocedure('"public"."studio_explore_inspiration_link_v1"(uuid, uuid)') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_explore_inspiration_link_v1"(uuid, uuid)'::regprocedure),chr(13),''))<>'ef1f44c0c41d43f2c395703c0d35f51c' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_explore_inspiration_link_v1'; END IF;
IF to_regprocedure('"public"."studio_has_write_access"()') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_has_write_access"()'::regprocedure),chr(13),''))<>'23089e29469e753eed113929aacf8841' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_has_write_access'; END IF;
IF to_regprocedure('"public"."studio_inspect_complimentary_develop_workspace_v1"(uuid)') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_inspect_complimentary_develop_workspace_v1"(uuid)'::regprocedure),chr(13),''))<>'0c781599a43cdd537a0e10bd5783c2d8' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_inspect_complimentary_develop_workspace_v1'; END IF;
IF to_regprocedure('"public"."studio_manage_complimentary_develop_workspace_v1"(uuid, text, timestamp with time zone)') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_manage_complimentary_develop_workspace_v1"(uuid, text, timestamp with time zone)'::regprocedure),chr(13),''))<>'cc8500b6a0f62a27acba74bf339fe0b9' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_manage_complimentary_develop_workspace_v1'; END IF;
IF to_regprocedure('"public"."studio_project_can_edit_v1"(uuid)') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_project_can_edit_v1"(uuid)'::regprocedure),chr(13),''))<>'eec48b097061d98296634e65aff5b2f0' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_project_can_edit_v1'; END IF;
IF to_regprocedure('"public"."studio_project_can_manage_lifecycle_v1"(uuid)') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_project_can_manage_lifecycle_v1"(uuid)'::regprocedure),chr(13),''))<>'222eb918cc63ce1060937031a9e4fe65' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_project_can_manage_lifecycle_v1'; END IF;
IF to_regprocedure('"public"."studio_project_can_read_v1"(uuid)') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_project_can_read_v1"(uuid)'::regprocedure),chr(13),''))<>'85c3f74c8c23ff45ec8644af24767a4e' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_project_can_read_v1'; END IF;
IF to_regprocedure('"public"."studio_remove_deleted_project_card_v1"(uuid, uuid)') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_remove_deleted_project_card_v1"(uuid, uuid)'::regprocedure),chr(13),''))<>'e6d004f5b1d49f05294c8a0319da1a42' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_remove_deleted_project_card_v1'; END IF;
IF to_regprocedure('"public"."studio_restore_card_version"(uuid, uuid, uuid, integer)') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_restore_card_version"(uuid, uuid, uuid, integer)'::regprocedure),chr(13),''))<>'4ec749064ecb7d1f0870304d3875f72f' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_restore_card_version'; END IF;
IF to_regprocedure('"public"."studio_restore_guidebook_version"(uuid, uuid, uuid, integer)') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_restore_guidebook_version"(uuid, uuid, uuid, integer)'::regprocedure),chr(13),''))<>'5f9e5cb4ad0ccbae825dceaf5dc04320' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_restore_guidebook_version'; END IF;
IF to_regprocedure('"studio_private"."bind_new_explore_project_v1"()') IS NULL OR md5(replace(pg_get_functiondef('"studio_private"."bind_new_explore_project_v1"()'::regprocedure),chr(13),''))<>'e78bb88f892a5471282673735e68e1fe' THEN RAISE EXCEPTION 'STOP: installed contract drift: studio_private.bind_new_explore_project_v1'; END IF;
IF to_regprocedure('"studio_private"."creator_workspace_full_access_v1"()') IS NULL OR md5(replace(pg_get_functiondef('"studio_private"."creator_workspace_full_access_v1"()'::regprocedure),chr(13),''))<>'8a792ed20bc546326d20e339baeac59a' THEN RAISE EXCEPTION 'STOP: installed contract drift: studio_private.creator_workspace_full_access_v1'; END IF;
IF to_regprocedure('"studio_private"."explore_active_project_v1"(uuid)') IS NULL OR md5(replace(pg_get_functiondef('"studio_private"."explore_active_project_v1"(uuid)'::regprocedure),chr(13),''))<>'f7a3e02a817b1151e0c3f6a82e405f76' THEN RAISE EXCEPTION 'STOP: installed contract drift: studio_private.explore_active_project_v1'; END IF;
IF to_regprocedure('"studio_private"."explore_active_v1"()') IS NULL OR md5(replace(pg_get_functiondef('"studio_private"."explore_active_v1"()'::regprocedure),chr(13),''))<>'9d6b7c57e3a47c84f5a788d541502642' THEN RAISE EXCEPTION 'STOP: installed contract drift: studio_private.explore_active_v1'; END IF;
IF to_regprocedure('"studio_private"."explore_bound_v1"(uuid)') IS NULL OR md5(replace(pg_get_functiondef('"studio_private"."explore_bound_v1"(uuid)'::regprocedure),chr(13),''))<>'b75284a195c85479d844f47f07daef8b' THEN RAISE EXCEPTION 'STOP: installed contract drift: studio_private.explore_bound_v1'; END IF;
IF to_regprocedure('"studio_private"."explore_capacity_v1"()') IS NULL OR md5(replace(pg_get_functiondef('"studio_private"."explore_capacity_v1"()'::regprocedure),chr(13),''))<>'e313db4c84b3bd61a09d3def5943fc81' THEN RAISE EXCEPTION 'STOP: installed contract drift: studio_private.explore_capacity_v1'; END IF;
IF to_regprocedure('"studio_private"."explore_journal_object_v1"(text)') IS NULL OR md5(replace(pg_get_functiondef('"studio_private"."explore_journal_object_v1"(text)'::regprocedure),chr(13),''))<>'57e1913ae35f1b8fa2e5b81ae2a28160' THEN RAISE EXCEPTION 'STOP: installed contract drift: studio_private.explore_journal_object_v1'; END IF;
IF to_regprocedure('"studio_private"."has_complimentary_develop_workspace_v1"()') IS NULL OR md5(replace(pg_get_functiondef('"studio_private"."has_complimentary_develop_workspace_v1"()'::regprocedure),chr(13),''))<>'110da00d1e7408ca67b918460d8aec41' THEN RAISE EXCEPTION 'STOP: installed contract drift: studio_private.has_complimentary_develop_workspace_v1'; END IF;
IF to_regprocedure('"studio_private"."mark_explore_paid_write_v1"()') IS NULL OR md5(replace(pg_get_functiondef('"studio_private"."mark_explore_paid_write_v1"()'::regprocedure),chr(13),''))<>'4595bafbb52db7cadecaba7c0520f666' THEN RAISE EXCEPTION 'STOP: installed contract drift: studio_private.mark_explore_paid_write_v1'; END IF; END $installed_contracts$;
NOTIFY pgrst,'reload schema';
COMMIT;
