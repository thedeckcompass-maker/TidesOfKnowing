alter table public.studio_guidebook_sections
  add column if not exists card_id uuid references public.studio_cards(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.studio_guidebook_sections
  drop constraint if exists studio_guidebook_metadata_object_check;
alter table public.studio_guidebook_sections
  add constraint studio_guidebook_metadata_object_check
  check (jsonb_typeof(metadata) = 'object');

create index if not exists studio_guidebook_card_idx
  on public.studio_guidebook_sections(card_id)
  where card_id is not null;

create or replace function public.studio_validate_guidebook_card_link()
returns trigger
language plpgsql
as $$
begin
  if new.card_id is not null and not exists (
    select 1
    from public.studio_cards
    where id = new.card_id
      and project_id = new.project_id
  ) then
    raise exception 'Guidebook card link must belong to the same Studio project';
  end if;
  return new;
end;
$$;

drop trigger if exists studio_guidebook_validate_card_link on public.studio_guidebook_sections;
create trigger studio_guidebook_validate_card_link
before insert or update on public.studio_guidebook_sections
for each row execute function public.studio_validate_guidebook_card_link();

create or replace function public.studio_capture_guidebook_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.studio_guidebook_versions (
    section_id,
    project_id,
    version_number,
    snapshot,
    created_by
  )
  values (
    new.id,
    new.project_id,
    new.version_number,
    jsonb_build_object(
      'title', new.title,
      'section_type', new.section_type,
      'sort_order', new.sort_order,
      'status', new.status,
      'body_markdown', new.body_markdown,
      'card_id', new.card_id,
      'metadata', new.metadata
    ),
    auth.uid()
  );
  return new;
end;
$$;

create table if not exists public.studio_import_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  source_system text not null check (char_length(source_system) between 2 and 80),
  source_key text not null check (char_length(source_key) between 2 and 240),
  source_path text not null,
  source_checksum text not null check (source_checksum ~ '^[a-f0-9]{64}$'),
  source_archive_checksum text check (
    source_archive_checksum is null or source_archive_checksum ~ '^[a-f0-9]{64}$'
  ),
  target_type text not null check (target_type in ('card_family', 'card', 'guidebook_section')),
  target_id uuid not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  imported_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (project_id, source_system, source_key)
);

create index if not exists studio_import_records_project_target_idx
  on public.studio_import_records(project_id, target_type, target_id);

alter table public.studio_import_records enable row level security;

drop policy if exists "Creators can read own Studio import records" on public.studio_import_records;
create policy "Creators can read own Studio import records"
on public.studio_import_records for select
using (public.studio_owns_project(project_id));

comment on table public.studio_import_records is
  'Idempotent source-to-Studio reconciliation ledger. Writes are reserved for the service-role importer.';
