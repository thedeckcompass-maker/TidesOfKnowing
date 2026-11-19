-- REVIEW ONLY. Do not discard soft-deletion state: restore or separately
-- preserve every deleted row before running this rollback.
do $$ begin
  if exists(select 1 from public.studio_projects where deleted_at is not null)
     or exists(select 1 from public.studio_cards where deleted_at is not null) then
    raise exception 'Rollback stopped: soft-deleted projects or cards exist';
  end if;
end $$;
alter policy "Studio entitlement required for creating" on public.studio_projects with check (studio_private.has_access());
alter policy "Studio entitlement required for editing" on public.studio_projects using (studio_private.has_access()) with check (studio_private.has_access());
alter policy "Studio entitlement required insert" on public.studio_cards with check (studio_private.has_access());
alter policy "Studio entitlement required update" on public.studio_cards using (studio_private.has_access()) with check (studio_private.has_access());
alter policy "Manual Studio journal media insert" on storage.objects with check (bucket_id <> 'studio-journal-photos' or studio_private.has_access());
alter policy "Manual Studio journal media update" on storage.objects using (bucket_id <> 'studio-journal-photos' or studio_private.has_access()) with check (bucket_id <> 'studio-journal-photos' or studio_private.has_access());
alter policy "Manual Studio journal media delete" on storage.objects using (bucket_id <> 'studio-journal-photos' or studio_private.has_access());
do $$ declare t text; prefix text; begin
  foreach t in array array['studio_card_families','studio_guidebook_sections','studio_journal_entries','studio_journal_photos','studio_journal_excerpts','studio_production_plans'] loop
    prefix := case when t like 'studio_journal_%' or t='studio_production_plans' then 'Manual Studio access required ' else 'Studio entitlement required ' end;
    execute format('alter policy %I on public.%I with check (studio_private.has_access())',prefix||'insert',t);
    execute format('alter policy %I on public.%I using (studio_private.has_access()) with check (studio_private.has_access())',prefix||'update',t);
  end loop;
end $$;
drop trigger studio_explore_card_capacity on public.studio_cards;
drop trigger studio_explore_project_capacity on public.studio_projects;
drop function public.studio_capture_atomic_v1(uuid,timestamptz,jsonb,jsonb);
drop function public.studio_explore_inspiration_link_v1(uuid,uuid);
drop function public.studio_remove_deleted_project_card_v1(uuid,uuid);
drop function studio_private.explore_capacity_v1();
drop function studio_private.explore_journal_object_v1(text);
drop function studio_private.explore_active_project_v1(uuid);
drop function studio_private.explore_active_v1();
alter table public.studio_cards drop column deleted_at;
alter table public.studio_projects drop column deleted_at;
