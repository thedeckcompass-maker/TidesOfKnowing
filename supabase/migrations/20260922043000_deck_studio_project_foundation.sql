create table if not exists public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  deck_type text not null check (deck_type in ('oracle', 'tarot', 'hybrid')),
  pathway text not null check (pathway in ('personal', 'independent', 'commercial')),
  status text not null default 'planning' check (
    status in ('planning', 'writing', 'artwork', 'production', 'complete', 'archived')
  ),
  deck_size integer check (deck_size between 1 and 240),
  purpose text not null default '',
  intended_reader text not null default '',
  promise text not null default '',
  description text not null default '',
  next_action text not null default '',
  current_risk text not null default '',
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (id, owner_id)
);

create table if not exists public.studio_card_families (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id),
  unique (project_id, name)
);

create table if not exists public.studio_cards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  family_id uuid,
  title text not null check (char_length(title) between 1 and 120),
  card_number text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  status text not null default 'outline' check (
    status in ('outline', 'draft', 'review', 'complete')
  ),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  version_number integer not null default 1 check (version_number >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id),
  constraint studio_cards_family_project_fk
    foreign key (family_id, project_id)
    references public.studio_card_families(id, project_id)
    on delete restrict
);

create table if not exists public.studio_card_versions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.studio_cards(id) on delete cascade,
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (card_id, version_number)
);

create table if not exists public.studio_guidebook_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  section_type text not null check (
    section_type in ('front_matter', 'card_entry', 'instructions', 'chapter', 'closing', 'other')
  ),
  title text not null check (char_length(title) between 1 and 160),
  sort_order integer not null default 0 check (sort_order >= 0),
  status text not null default 'outline' check (
    status in ('outline', 'draft', 'review', 'complete')
  ),
  body_markdown text not null default '',
  version_number integer not null default 1 check (version_number >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id)
);

create table if not exists public.studio_guidebook_versions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.studio_guidebook_sections(id) on delete cascade,
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (section_id, version_number)
);

create index if not exists studio_projects_owner_updated_idx
  on public.studio_projects(owner_id, updated_at desc);
create index if not exists studio_card_families_project_order_idx
  on public.studio_card_families(project_id, sort_order, created_at);
create index if not exists studio_cards_project_order_idx
  on public.studio_cards(project_id, sort_order, created_at);
create index if not exists studio_card_versions_card_version_idx
  on public.studio_card_versions(card_id, version_number desc);
create index if not exists studio_guidebook_project_order_idx
  on public.studio_guidebook_sections(project_id, sort_order, created_at);
create index if not exists studio_guidebook_versions_section_version_idx
  on public.studio_guidebook_versions(section_id, version_number desc);

drop trigger if exists studio_projects_set_updated_at on public.studio_projects;
create trigger studio_projects_set_updated_at
before update on public.studio_projects
for each row execute function public.set_updated_at();

drop trigger if exists studio_card_families_set_updated_at on public.studio_card_families;
create trigger studio_card_families_set_updated_at
before update on public.studio_card_families
for each row execute function public.set_updated_at();

create or replace function public.studio_bump_version()
returns trigger
language plpgsql
as $$
begin
  new.version_number = old.version_number + 1;
  return new;
end;
$$;

create or replace function public.studio_capture_card_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.studio_card_versions (
    card_id,
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
      'card_number', new.card_number,
      'family_id', new.family_id,
      'sort_order', new.sort_order,
      'status', new.status,
      'content', new.content
    ),
    auth.uid()
  );
  return new;
end;
$$;

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
      'body_markdown', new.body_markdown
    ),
    auth.uid()
  );
  return new;
end;
$$;

drop trigger if exists studio_cards_bump_version on public.studio_cards;
create trigger studio_cards_bump_version
before update on public.studio_cards
for each row execute function public.studio_bump_version();

drop trigger if exists studio_cards_set_updated_at on public.studio_cards;
create trigger studio_cards_set_updated_at
before update on public.studio_cards
for each row execute function public.set_updated_at();

drop trigger if exists studio_cards_capture_version on public.studio_cards;
create trigger studio_cards_capture_version
after insert or update on public.studio_cards
for each row execute function public.studio_capture_card_version();

drop trigger if exists studio_guidebook_bump_version on public.studio_guidebook_sections;
create trigger studio_guidebook_bump_version
before update on public.studio_guidebook_sections
for each row execute function public.studio_bump_version();

drop trigger if exists studio_guidebook_set_updated_at on public.studio_guidebook_sections;
create trigger studio_guidebook_set_updated_at
before update on public.studio_guidebook_sections
for each row execute function public.set_updated_at();

drop trigger if exists studio_guidebook_capture_version on public.studio_guidebook_sections;
create trigger studio_guidebook_capture_version
after insert or update on public.studio_guidebook_sections
for each row execute function public.studio_capture_guidebook_version();

create or replace function public.studio_owns_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.studio_projects
    where id = target_project_id
      and owner_id = auth.uid()
  );
$$;

revoke all on function public.studio_owns_project(uuid) from public;
grant execute on function public.studio_owns_project(uuid) to authenticated;

alter table public.studio_projects enable row level security;
alter table public.studio_card_families enable row level security;
alter table public.studio_cards enable row level security;
alter table public.studio_card_versions enable row level security;
alter table public.studio_guidebook_sections enable row level security;
alter table public.studio_guidebook_versions enable row level security;

drop policy if exists "Creators can read own studio projects" on public.studio_projects;
create policy "Creators can read own studio projects"
on public.studio_projects for select
using (owner_id = auth.uid());

drop policy if exists "Creators can create own studio projects" on public.studio_projects;
create policy "Creators can create own studio projects"
on public.studio_projects for insert
with check (owner_id = auth.uid());

drop policy if exists "Creators can update own studio projects" on public.studio_projects;
create policy "Creators can update own studio projects"
on public.studio_projects for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Creators can delete own studio projects" on public.studio_projects;
create policy "Creators can delete own studio projects"
on public.studio_projects for delete
using (owner_id = auth.uid());

drop policy if exists "Creators can manage own studio card families" on public.studio_card_families;
create policy "Creators can manage own studio card families"
on public.studio_card_families for all
using (public.studio_owns_project(project_id))
with check (public.studio_owns_project(project_id));

drop policy if exists "Creators can manage own studio cards" on public.studio_cards;
create policy "Creators can manage own studio cards"
on public.studio_cards for all
using (public.studio_owns_project(project_id))
with check (public.studio_owns_project(project_id));

drop policy if exists "Creators can read own studio card versions" on public.studio_card_versions;
create policy "Creators can read own studio card versions"
on public.studio_card_versions for select
using (public.studio_owns_project(project_id));

drop policy if exists "Creators can manage own guidebook sections" on public.studio_guidebook_sections;
create policy "Creators can manage own guidebook sections"
on public.studio_guidebook_sections for all
using (public.studio_owns_project(project_id))
with check (public.studio_owns_project(project_id));

drop policy if exists "Creators can read own guidebook versions" on public.studio_guidebook_versions;
create policy "Creators can read own guidebook versions"
on public.studio_guidebook_versions for select
using (public.studio_owns_project(project_id));
