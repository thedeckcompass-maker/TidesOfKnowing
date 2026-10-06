create table if not exists public.studio_artist_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  professional_name text not null check (char_length(professional_name) between 2 and 120),
  location text not null default '' check (char_length(location) <= 160),
  time_zone text not null default '' check (char_length(time_zone) <= 80),
  languages text[] not null default '{}'::text[] check (cardinality(languages) between 1 and 12),
  biography text not null check (char_length(biography) between 40 and 3000),
  artistic_statement text not null check (char_length(artistic_statement) between 40 and 3000),
  mediums text[] not null default '{}'::text[] check (cardinality(mediums) between 1 and 16),
  techniques text[] not null default '{}'::text[] check (cardinality(techniques) <= 16),
  styles text[] not null default '{}'::text[] check (cardinality(styles) between 1 and 16),
  subjects text[] not null default '{}'::text[] check (cardinality(subjects) <= 16),
  publishing_experience text not null default '' check (char_length(publishing_experience) <= 2000),
  availability text not null check (char_length(availability) between 10 and 1200),
  budget_approach text not null check (char_length(budget_approach) between 10 and 1200),
  licensing_preferences text not null check (char_length(licensing_preferences) between 10 and 1200),
  collaboration_models text[] not null default '{}'::text[] check (cardinality(collaboration_models) between 1 and 8),
  process_disclosure text not null check (
    process_disclosure in ('human_created','digital_non_generative','ai_assisted','generative_ai')
  ),
  portfolio_examples jsonb not null check (
    jsonb_typeof(portfolio_examples) = 'array'
    and jsonb_array_length(portfolio_examples) between 6 and 8
  ),
  display_rights_confirmed_at timestamptz not null,
  status text not null default 'submitted' check (status in ('submitted','approved','declined','withdrawn')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_artist_contacts (
  artist_profile_id uuid primary key references public.studio_artist_profiles(id) on delete cascade,
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  contact_email text not null check (contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  website_url text not null default '' check (char_length(website_url) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_artist_shortlists (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  artist_profile_id uuid not null references public.studio_artist_profiles(id) on delete cascade,
  note text not null default '' check (char_length(note) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creator_id, project_id, artist_profile_id)
);

create table if not exists public.studio_artist_introductions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  artist_profile_id uuid not null references public.studio_artist_profiles(id) on delete cascade,
  brief text not null check (char_length(brief) between 50 and 5000),
  timeline text not null default '' check (char_length(timeline) <= 800),
  budget_context text not null default '' check (char_length(budget_context) <= 800),
  status text not null default 'requested' check (
    status in ('requested','accepted','declined','more_information','withdrawn')
  ),
  artist_message text not null default '' check (char_length(artist_message) <= 2000),
  creator_reply text not null default '' check (char_length(creator_reply) <= 2000),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creator_id, project_id, artist_profile_id)
);

create index if not exists studio_artist_profiles_directory_idx
  on public.studio_artist_profiles(status, published_at desc);
create index if not exists studio_artist_introductions_artist_idx
  on public.studio_artist_introductions(artist_profile_id, status, created_at desc);
create index if not exists studio_artist_introductions_creator_idx
  on public.studio_artist_introductions(creator_id, status, created_at desc);

create or replace function public.studio_artist_is_owner(target_profile_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.studio_artist_profiles
    where id = target_profile_id and user_id = auth.uid()
  );
$$;

create or replace function public.studio_validate_artist_introduction()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.creator_id <> auth.uid()
      or not exists (
        select 1 from public.studio_projects
        where id = new.project_id and owner_id = new.creator_id
      )
      or not exists (
        select 1 from public.studio_artist_profiles
        where id = new.artist_profile_id and status = 'approved'
      ) then
      raise exception 'Introduction requests require an owned project and an approved artist';
    end if;
  elsif auth.uid() = old.creator_id then
    if new.id <> old.id
      or new.created_at <> old.created_at
      or new.creator_id <> old.creator_id
      or new.project_id <> old.project_id
      or new.artist_profile_id <> old.artist_profile_id
      or new.brief <> old.brief
      or new.timeline <> old.timeline
      or new.budget_context <> old.budget_context
      or new.artist_message <> old.artist_message
      or new.responded_at is distinct from old.responded_at
      or (
        new.status = 'withdrawn'
        and old.status not in ('requested','more_information')
      )
      or (
        new.status <> 'withdrawn'
        and not (old.status = 'more_information' and new.status = 'requested')
      ) then
      raise exception 'Creators may only reply to an information request or withdraw';
    end if;
  elsif public.studio_artist_is_owner(old.artist_profile_id) then
    if new.id <> old.id
      or new.created_at <> old.created_at
      or new.creator_id <> old.creator_id
      or new.project_id <> old.project_id
      or new.artist_profile_id <> old.artist_profile_id
      or new.brief <> old.brief
      or new.timeline <> old.timeline
      or new.budget_context <> old.budget_context
      or new.creator_reply <> old.creator_reply
      or old.status <> 'requested'
      or new.status not in ('accepted','declined','more_information')
      or new.responded_at is null then
      raise exception 'Artists may accept, decline or request more information';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.studio_artist_is_owner(uuid) from public;
grant execute on function public.studio_artist_is_owner(uuid) to authenticated;

drop trigger if exists studio_artist_profiles_set_updated_at on public.studio_artist_profiles;
create trigger studio_artist_profiles_set_updated_at before update on public.studio_artist_profiles
for each row execute function public.set_updated_at();
drop trigger if exists studio_artist_contacts_set_updated_at on public.studio_artist_contacts;
create trigger studio_artist_contacts_set_updated_at before update on public.studio_artist_contacts
for each row execute function public.set_updated_at();
drop trigger if exists studio_artist_shortlists_set_updated_at on public.studio_artist_shortlists;
create trigger studio_artist_shortlists_set_updated_at before update on public.studio_artist_shortlists
for each row execute function public.set_updated_at();
drop trigger if exists studio_artist_introductions_set_updated_at on public.studio_artist_introductions;
create trigger studio_artist_introductions_set_updated_at before update on public.studio_artist_introductions
for each row execute function public.set_updated_at();
drop trigger if exists studio_artist_introductions_validate on public.studio_artist_introductions;
create trigger studio_artist_introductions_validate before insert or update on public.studio_artist_introductions
for each row execute function public.studio_validate_artist_introduction();

alter table public.studio_artist_profiles enable row level security;
alter table public.studio_artist_contacts enable row level security;
alter table public.studio_artist_shortlists enable row level security;
alter table public.studio_artist_introductions enable row level security;

do $$
declare policy_record record;
begin
  for policy_record in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'studio_artist_profiles', 'studio_artist_contacts',
        'studio_artist_shortlists', 'studio_artist_introductions'
      ])
  loop
    execute format('drop policy if exists %I on public.%I', policy_record.policyname, policy_record.tablename);
  end loop;
end;
$$;

create policy "Artists can read own Studio artist profile"
on public.studio_artist_profiles for select
using (user_id = auth.uid());
create policy "Studio creators can read approved artist profiles"
on public.studio_artist_profiles for select
using (status = 'approved' and public.studio_has_read_access());
create policy "Artists can submit own Studio artist profile"
on public.studio_artist_profiles for insert
with check (user_id = auth.uid() and status = 'submitted');
create policy "Artists can resubmit own Studio artist profile"
on public.studio_artist_profiles for update
using (user_id = auth.uid())
with check (user_id = auth.uid() and status in ('submitted','withdrawn'));

create policy "Artists can manage own private Studio contact"
on public.studio_artist_contacts for all
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Creators can read own private artist shortlists"
on public.studio_artist_shortlists for select
using (creator_id = auth.uid() and public.studio_has_read_access());
create policy "Creators can add approved artists to own shortlists"
on public.studio_artist_shortlists for insert
with check (
  creator_id = auth.uid()
  and public.studio_has_write_access()
  and public.studio_owns_project(project_id)
  and exists (select 1 from public.studio_artist_profiles where id = artist_profile_id and status = 'approved')
);
create policy "Creators can update own private artist shortlists"
on public.studio_artist_shortlists for update
using (creator_id = auth.uid() and public.studio_has_write_access())
with check (creator_id = auth.uid() and public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can remove own private artist shortlists"
on public.studio_artist_shortlists for delete
using (creator_id = auth.uid() and public.studio_has_write_access());

create policy "Creators can read own artist introductions"
on public.studio_artist_introductions for select
using (creator_id = auth.uid() and public.studio_has_read_access());
create policy "Artists can read introductions addressed to them"
on public.studio_artist_introductions for select
using (public.studio_artist_is_owner(artist_profile_id));
create policy "Creators can request artist introductions"
on public.studio_artist_introductions for insert
with check (creator_id = auth.uid() and public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can control own artist introductions"
on public.studio_artist_introductions for update
using (creator_id = auth.uid() and public.studio_has_write_access())
with check (creator_id = auth.uid() and public.studio_has_write_access());
create policy "Artists can answer introductions addressed to them"
on public.studio_artist_introductions for update
using (public.studio_artist_is_owner(artist_profile_id))
with check (public.studio_artist_is_owner(artist_profile_id));

comment on table public.studio_artist_profiles is 'Curated artist directory applications. Portfolio display requires explicit limited-rights confirmation.';
comment on table public.studio_artist_contacts is 'Private artist contact details. The application never exposes these in the directory.';
comment on table public.studio_artist_introductions is 'Consent-based creator briefs. Direct contact is disclosed by the server only after artist acceptance.';
