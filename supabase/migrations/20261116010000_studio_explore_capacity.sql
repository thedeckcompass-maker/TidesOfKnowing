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
  with check (bucket_id <> 'studio-journal-photos' or studio_private.has_access() or studio_private.explore_journal_object_v1(name));
alter policy "Manual Studio journal media update" on storage.objects
  using (bucket_id <> 'studio-journal-photos' or studio_private.has_access() or studio_private.explore_journal_object_v1(name))
  with check (bucket_id <> 'studio-journal-photos' or studio_private.has_access() or studio_private.explore_journal_object_v1(name));
alter policy "Manual Studio journal media delete" on storage.objects
  using (bucket_id <> 'studio-journal-photos' or studio_private.has_access() or studio_private.explore_journal_object_v1(name));

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
 if actor is null or not studio_private.explore_active_project_v1(project_id) then
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
  with check (studio_private.has_access() or studio_private.explore_active_v1());
alter policy "Studio entitlement required for editing" on public.studio_projects
  using (studio_private.has_access() or studio_private.explore_active_v1())
  with check (studio_private.has_access() or studio_private.explore_active_v1());
alter policy "Studio entitlement required insert" on public.studio_cards
  with check (studio_private.has_access() or studio_private.explore_active_project_v1(project_id));
alter policy "Studio entitlement required update" on public.studio_cards
  using (studio_private.has_access() or studio_private.explore_active_project_v1(project_id))
  with check (studio_private.has_access() or studio_private.explore_active_project_v1(project_id));

-- Narrow creator-owned data needed by cards, guidebooks and journals. Existing
-- permissive owner policies still apply and physical deletes stay paid-only.
do $$ declare t text; prefix text; begin
  foreach t in array array['studio_card_families','studio_guidebook_sections','studio_journal_entries','studio_journal_photos','studio_journal_excerpts','studio_production_plans'] loop
    prefix := case when t like 'studio_journal_%' or t='studio_production_plans' then 'Manual Studio access required ' else 'Studio entitlement required ' end;
    execute format('alter policy %I on public.%I with check (studio_private.has_access() or studio_private.explore_active_project_v1(project_id))',prefix||'insert',t);
    execute format('alter policy %I on public.%I using (studio_private.has_access() or studio_private.explore_active_project_v1(project_id)) with check (studio_private.has_access() or studio_private.explore_active_project_v1(project_id))',prefix||'update',t);
  end loop;
end $$;
