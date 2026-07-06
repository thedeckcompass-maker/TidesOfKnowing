create table if not exists public.reading_library_publications (
  id uuid primary key default gen_random_uuid(),
  ask_leilia_request_id uuid unique references public.ask_leilia_requests(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 4 and 200),
  reading_type text not null check (char_length(reading_type) between 2 and 80),
  question text not null check (char_length(question) between 10 and 2000),
  summary text not null check (char_length(summary) between 20 and 500),
  body text not null check (char_length(body) >= 100),
  life_areas text[] not null default '{}'::text[],
  primary_cards text[] not null default '{}'::text[],
  spread_used text,
  spread_image_paths text[] not null default '{}'::text[],
  seo_description text not null check (char_length(seo_description) between 40 and 320),
  pdf_storage_path text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_library_publications_publish_consistency
    check (is_published = false or published_at is not null)
);

create index if not exists reading_library_publications_published_idx
on public.reading_library_publications (published_at desc)
where is_published = true;

create index if not exists reading_library_publications_request_idx
on public.reading_library_publications (ask_leilia_request_id);

drop trigger if exists reading_library_publications_set_updated_at on public.reading_library_publications;
create trigger reading_library_publications_set_updated_at
before update on public.reading_library_publications
for each row execute function public.set_updated_at();

alter table public.reading_library_publications enable row level security;

drop policy if exists "Anyone can read published library readings" on public.reading_library_publications;
create policy "Anyone can read published library readings"
on public.reading_library_publications for select
using (is_published = true);

drop policy if exists "Admins can manage library readings" on public.reading_library_publications;
create policy "Admins can manage library readings"
on public.reading_library_publications for all
using (public.is_admin())
with check (public.is_admin());
