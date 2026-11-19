-- Local review: fix existing version restoration to use accepted project authorization.
BEGIN; SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='30s';
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
ROLLBACK;
