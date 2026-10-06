insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studio-journal-photos', 'studio-journal-photos', false, 6291456, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 6291456, allowed_mime_types = array['image/jpeg'];

create table if not exists public.studio_journal_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  journal_entry_id uuid not null references public.studio_journal_entries(id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) between 1 and 500),
  caption text not null default '' check (char_length(caption) <= 240),
  sort_order integer not null check (sort_order between 0 and 4),
  created_at timestamptz not null default now(),
  unique (journal_entry_id, sort_order)
);

create table if not exists public.studio_journal_excerpts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  journal_entry_id uuid not null references public.studio_journal_entries(id) on delete cascade,
  purpose text not null check (purpose in ('kickstarter', 'newsletter', 'social', 'case_study', 'private_record')),
  title text not null check (char_length(title) between 1 and 160),
  excerpt_text text not null check (char_length(excerpt_text) between 1 and 5000),
  photo_id uuid references public.studio_journal_photos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.studio_validate_journal_media_links()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.studio_journal_entries where id = new.journal_entry_id and project_id = new.project_id) then
    raise exception 'Journal media must belong to the same Studio project and entry';
  end if;
  if tg_table_name = 'studio_journal_excerpts' then
    if nullif(to_jsonb(new)->>'photo_id', '') is not null and not exists (
      select 1 from public.studio_journal_photos
      where id = (to_jsonb(new)->>'photo_id')::uuid
        and project_id = new.project_id
        and journal_entry_id = new.journal_entry_id
    ) then
      raise exception 'Excerpt photograph must belong to the same Studio journal entry';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists studio_journal_photos_validate_links on public.studio_journal_photos;
create trigger studio_journal_photos_validate_links before insert or update on public.studio_journal_photos
for each row execute function public.studio_validate_journal_media_links();
drop trigger if exists studio_journal_excerpts_validate_links on public.studio_journal_excerpts;
create trigger studio_journal_excerpts_validate_links before insert or update on public.studio_journal_excerpts
for each row execute function public.studio_validate_journal_media_links();
drop trigger if exists studio_journal_excerpts_set_updated_at on public.studio_journal_excerpts;
create trigger studio_journal_excerpts_set_updated_at before update on public.studio_journal_excerpts
for each row execute function public.set_updated_at();

alter table public.studio_journal_photos enable row level security;
alter table public.studio_journal_excerpts enable row level security;
drop policy if exists "Creators can manage own Studio journal photos" on public.studio_journal_photos;
create policy "Creators can manage own Studio journal photos" on public.studio_journal_photos for all
using (public.studio_owns_project(project_id)) with check (public.studio_owns_project(project_id));
drop policy if exists "Creators can manage own Studio journal excerpts" on public.studio_journal_excerpts;
create policy "Creators can manage own Studio journal excerpts" on public.studio_journal_excerpts for all
using (public.studio_owns_project(project_id)) with check (public.studio_owns_project(project_id));

drop policy if exists "Creators can read own Studio journal photo objects" on storage.objects;
create policy "Creators can read own Studio journal photo objects" on storage.objects for select
using (bucket_id = 'studio-journal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Creators can upload own Studio journal photo objects" on storage.objects;
create policy "Creators can upload own Studio journal photo objects" on storage.objects for insert
with check (bucket_id = 'studio-journal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Creators can delete own Studio journal photo objects" on storage.objects;
create policy "Creators can delete own Studio journal photo objects" on storage.objects for delete
using (bucket_id = 'studio-journal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

comment on table public.studio_journal_excerpts is 'Separate controlled copies for deliberate export. Creating one never changes source journal privacy or publishes content.';
