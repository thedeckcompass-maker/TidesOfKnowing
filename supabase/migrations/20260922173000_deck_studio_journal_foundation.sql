create table if not exists public.studio_journal_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  entry_kind text not null default 'reflection' check (
    entry_kind in ('reflection', 'decision', 'milestone')
  ),
  title text not null check (char_length(title) between 1 and 160),
  body_markdown text not null default '',
  tags text[] not null default '{}'::text[] check (
    tags <@ array['research', 'artwork', 'resistance', 'breakthrough', 'testing', 'production', 'launch']::text[]
    and cardinality(tags) <= 7
  ),
  linked_card_id uuid references public.studio_cards(id) on delete set null,
  linked_section_id uuid references public.studio_guidebook_sections(id) on delete set null,
  selected_for_process boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id)
);

create index if not exists studio_journal_project_updated_idx
  on public.studio_journal_entries(project_id, updated_at desc);
create index if not exists studio_journal_process_idx
  on public.studio_journal_entries(project_id, updated_at desc)
  where selected_for_process;

create or replace function public.studio_validate_journal_links()
returns trigger
language plpgsql
as $$
begin
  if new.linked_card_id is not null and not exists (
    select 1
    from public.studio_cards
    where id = new.linked_card_id
      and project_id = new.project_id
  ) then
    raise exception 'Journal card link must belong to the same Studio project';
  end if;

  if new.linked_section_id is not null and not exists (
    select 1
    from public.studio_guidebook_sections
    where id = new.linked_section_id
      and project_id = new.project_id
  ) then
    raise exception 'Journal guidebook link must belong to the same Studio project';
  end if;

  return new;
end;
$$;

drop trigger if exists studio_journal_validate_links on public.studio_journal_entries;
create trigger studio_journal_validate_links
before insert or update on public.studio_journal_entries
for each row execute function public.studio_validate_journal_links();

drop trigger if exists studio_journal_set_updated_at on public.studio_journal_entries;
create trigger studio_journal_set_updated_at
before update on public.studio_journal_entries
for each row execute function public.set_updated_at();

alter table public.studio_journal_entries enable row level security;

drop policy if exists "Creators can manage own Studio journal" on public.studio_journal_entries;
create policy "Creators can manage own Studio journal"
on public.studio_journal_entries for all
using (public.studio_owns_project(project_id))
with check (public.studio_owns_project(project_id));

comment on table public.studio_journal_entries is
  'Private creator journal. Process selection remains private and does not publish source entries.';
