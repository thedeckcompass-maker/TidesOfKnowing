-- GUARDED COMPENSATING RECOVERY for vbdqvjvhjleqdadiiqjx; separately approve before execution.
-- Restore previous compatible Worker/Pages or pause DCS writes first.
-- Preserves all tables, data, tombstones, private grants/audit/bindings and owner-read RPCs.
-- Restores original restrictive policies/version routines; disables new binding/capacity triggers
-- and new mutation RPCs. New Explore/complimentary writes pause; historical finite rights remain.
-- This is not a schema uninstall. No DROP TABLE, DROP COLUMN, CASCADE or creator-row changes.
BEGIN; SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='60s';
DO $release_target$ BEGIN IF current_setting('dcs.release_target_ref',true) IS DISTINCT FROM 'vbdqvjvhjleqdadiiqjx' OR current_setting('dcs.owner_approved_recovery',true) IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'STOP: explicit approved recovery context for vbdqvjvhjleqdadiiqjx required'; END IF; END $release_target$;
DO $expected_contracts$ BEGIN IF to_regprocedure('"public"."studio_capture_atomic_v1"(uuid, timestamp with time zone, jsonb, jsonb)') IS NULL OR md5(replace(pg_get_functiondef('"public"."studio_capture_atomic_v1"(uuid, timestamp with time zone, jsonb, jsonb)'::regprocedure),chr(13),''))<>'798fdbc15742293b1cc9ecc8aa1f5ff5' THEN RAISE EXCEPTION 'STOP: installed contract drift: public.studio_capture_atomic_v1'; END IF;
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
IF to_regprocedure('"studio_private"."mark_explore_paid_write_v1"()') IS NULL OR md5(replace(pg_get_functiondef('"studio_private"."mark_explore_paid_write_v1"()'::regprocedure),chr(13),''))<>'4595bafbb52db7cadecaba7c0520f666' THEN RAISE EXCEPTION 'STOP: installed contract drift: studio_private.mark_explore_paid_write_v1'; END IF; END $expected_contracts$;
ALTER POLICY "Studio entitlement required insert" ON "public"."studio_card_families" TO PUBLIC WITH CHECK (studio_private.has_access());
ALTER POLICY "Studio entitlement required update" ON "public"."studio_card_families" TO PUBLIC USING (studio_private.has_access()) WITH CHECK (studio_private.has_access());
ALTER POLICY "Manual Studio access required insert" ON "public"."studio_journal_excerpts" TO "authenticated" WITH CHECK (studio_private.has_access());
ALTER POLICY "Manual Studio access required update" ON "public"."studio_journal_excerpts" TO "authenticated" USING (studio_private.has_access()) WITH CHECK (studio_private.has_access());
ALTER POLICY "Studio entitlement required for creating" ON "public"."studio_projects" TO PUBLIC WITH CHECK (studio_private.has_access());
ALTER POLICY "Studio entitlement required for editing" ON "public"."studio_projects" TO PUBLIC USING (studio_private.has_access()) WITH CHECK (studio_private.has_access());
ALTER POLICY "Studio entitlement required insert" ON "public"."studio_cards" TO PUBLIC WITH CHECK (studio_private.has_access());
ALTER POLICY "Studio entitlement required update" ON "public"."studio_cards" TO PUBLIC USING (studio_private.has_access()) WITH CHECK (studio_private.has_access());
ALTER POLICY "Studio entitlement required insert" ON "public"."studio_guidebook_sections" TO PUBLIC WITH CHECK (studio_private.has_access());
ALTER POLICY "Studio entitlement required update" ON "public"."studio_guidebook_sections" TO PUBLIC USING (studio_private.has_access()) WITH CHECK (studio_private.has_access());
ALTER POLICY "Manual Studio access required insert" ON "public"."studio_journal_entries" TO "authenticated" WITH CHECK (studio_private.has_access());
ALTER POLICY "Manual Studio access required update" ON "public"."studio_journal_entries" TO "authenticated" USING (studio_private.has_access()) WITH CHECK (studio_private.has_access());
ALTER POLICY "Manual Studio access required insert" ON "public"."studio_journal_photos" TO "authenticated" WITH CHECK (studio_private.has_access());
ALTER POLICY "Manual Studio access required update" ON "public"."studio_journal_photos" TO "authenticated" USING (studio_private.has_access()) WITH CHECK (studio_private.has_access());
ALTER POLICY "Manual Studio access required insert" ON "public"."studio_production_plans" TO "authenticated" WITH CHECK (studio_private.has_access());
ALTER POLICY "Manual Studio access required update" ON "public"."studio_production_plans" TO "authenticated" USING (studio_private.has_access()) WITH CHECK (studio_private.has_access());
ALTER POLICY "Manual Studio journal media insert" ON "storage"."objects" TO "authenticated" WITH CHECK (((bucket_id <> 'studio-journal-photos'::text) OR studio_private.has_access()));
ALTER POLICY "Manual Studio journal media update" ON "storage"."objects" TO "authenticated" USING (((bucket_id <> 'studio-journal-photos'::text) OR studio_private.has_access())) WITH CHECK (((bucket_id <> 'studio-journal-photos'::text) OR studio_private.has_access()));
ALTER POLICY "Manual Studio journal media delete" ON "storage"."objects" TO "authenticated" USING (((bucket_id <> 'studio-journal-photos'::text) OR studio_private.has_access()));
ALTER TABLE public."studio_projects" DISABLE TRIGGER "studio_explore_project_capacity";
ALTER TABLE public."studio_projects" DISABLE TRIGGER "studio_bind_new_explore_project";
ALTER TABLE public."studio_cards" DISABLE TRIGGER "studio_explore_card_capacity";
ALTER TABLE public."studio_card_families" DISABLE TRIGGER "studio_mark_explore_paid_write";
ALTER TABLE public."studio_guidebook_sections" DISABLE TRIGGER "studio_mark_explore_paid_write";
ALTER TABLE public."studio_journal_entries" DISABLE TRIGGER "studio_mark_explore_paid_write";
ALTER TABLE public."studio_journal_photos" DISABLE TRIGGER "studio_mark_explore_paid_write";
ALTER TABLE public."studio_journal_excerpts" DISABLE TRIGGER "studio_mark_explore_paid_write";
ALTER TABLE public."studio_production_plans" DISABLE TRIGGER "studio_mark_explore_paid_write";
ALTER TABLE public."studio_import_records" DISABLE TRIGGER "studio_mark_explore_paid_write";
-- Captured original definitions for isolated fixtures and guarded recovery only. Not a production installation.
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
     or not studio_private.has_access()
     or not exists (select 1 from public.studio_projects where id = target_project_id and owner_id = auth.uid()) then
    raise exception 'Studio write access is required' using errcode = '42501';
  end if;

  select * into current_record from public.studio_cards
  where id = target_card_id and project_id = target_project_id for update;
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
     or not studio_private.has_access()
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

REVOKE ALL ON FUNCTION "public"."studio_capture_atomic_v1"(uuid, timestamp with time zone, jsonb, jsonb) FROM PUBLIC,anon,authenticated,service_role,dcs_service_executor;
REVOKE ALL ON FUNCTION "public"."studio_explore_inspiration_link_v1"(uuid, uuid) FROM PUBLIC,anon,authenticated,service_role,dcs_service_executor;
REVOKE ALL ON FUNCTION "public"."studio_manage_complimentary_develop_workspace_v1"(uuid, text, timestamp with time zone) FROM PUBLIC,anon,authenticated,service_role,dcs_service_executor;
REVOKE ALL ON FUNCTION "public"."studio_remove_deleted_project_card_v1"(uuid, uuid) FROM PUBLIC,anon,authenticated,service_role,dcs_service_executor;

NOTIFY pgrst,'reload schema'; COMMIT;
