-- REVIEW ONLY. Reinstates the previous broader read/write policy; not safe for production without independent review.
BEGIN;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM studio_private.explore_project_bindings_v1) THEN RAISE EXCEPTION 'Rollback stopped: preserve or reconcile Explore project bindings first'; END IF; END $$;
DROP TRIGGER studio_bind_new_explore_project ON public.studio_projects;
create or replace function studio_private.explore_active_project_v1(target uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public
as $$ select studio_private.explore_active_v1() and exists (
  select 1 from public.studio_projects p where p.id=target and p.owner_id=auth.uid()
    and p.deleted_at is null and p.status <> 'archived') $$;
revoke all on function studio_private.explore_active_project_v1(uuid) from public;
grant execute on function studio_private.explore_active_project_v1(uuid) to authenticated;
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

CREATE OR REPLACE FUNCTION studio_private.owner_download_grace_v1() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.status='active') $$;
ALTER POLICY "Studio entitlement required for editing" ON public.studio_projects USING (studio_private.has_access() OR studio_private.explore_active_v1()) WITH CHECK (studio_private.has_access() OR studio_private.explore_active_v1());
ALTER POLICY "Studio entitlement required for reading" ON public.studio_projects USING (studio_private.has_access() OR (owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.status='active')));
ALTER POLICY "Manual Studio journal media read" ON storage.objects USING (bucket_id<>'studio-journal-photos' OR studio_private.has_access() OR ((storage.foldername(name))[1]=auth.uid()::text AND studio_private.owner_download_grace_v1()));
ALTER POLICY "Owner or assigned editorial recipient only" ON public.studio_editorial_requests USING (studio_private.editorial_actor_active_v1() AND (studio_private.editorial_owner_read_v1(owner_id) OR studio_private.editorial_staff_v1(recipient_id)));
CREATE OR REPLACE FUNCTION studio_private.editorial_history_access_v1(p_project uuid,p_allow_expired boolean) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.studio_projects WHERE id=p_project AND owner_id=auth.uid()) AND EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND status='active') AND (studio_private.has_access() OR (coalesce(p_allow_expired,false) AND studio_private.owner_download_grace_v1())) $$;
DO $$ DECLARE t text; prefix text; BEGIN
 FOREACH t IN ARRAY ARRAY['studio_card_families','studio_cards','studio_card_versions','studio_guidebook_sections','studio_guidebook_versions','studio_import_records','studio_journal_entries','studio_journal_excerpts','studio_journal_photos','studio_production_plans','studio_production_plan_versions'] LOOP
  prefix:=CASE WHEN t LIKE 'studio_journal_%' OR t LIKE 'studio_production_%' THEN 'Manual Studio access required ' ELSE 'Studio entitlement required ' END;
  EXECUTE format('ALTER POLICY %I ON public.%I USING (studio_private.has_access() OR (public.studio_owns_project(project_id) AND studio_private.owner_download_grace_v1()))',prefix||'read',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['studio_production_plans','studio_production_plan_versions'] LOOP
  prefix:=CASE WHEN t='studio_production_plans' THEN 'Creators can read own production plan' ELSE 'Creators can read own production plan history' END;
  EXECUTE format('ALTER POLICY %I ON public.%I USING (public.studio_owns_project(project_id) AND (studio_private.has_access() OR studio_private.owner_download_grace_v1()))',prefix,t);
 END LOOP;
END $$;

DROP FUNCTION public.studio_project_can_manage_lifecycle_v1(uuid);
DROP FUNCTION public.studio_project_can_read_v1(uuid);
DROP FUNCTION public.studio_project_can_edit_v1(uuid);
DROP FUNCTION studio_private.bind_new_explore_project_v1();
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['studio_card_families','studio_guidebook_sections','studio_journal_entries','studio_journal_photos','studio_journal_excerpts','studio_production_plans','studio_import_records'] LOOP
  EXECUTE format('DROP TRIGGER studio_mark_explore_paid_write ON public.%I',t);
 END LOOP;
END $$;
DROP FUNCTION studio_private.mark_explore_paid_write_v1();
DROP FUNCTION studio_private.explore_bound_v1(uuid);
DROP TABLE studio_private.explore_project_bindings_v1;
ROLLBACK;
