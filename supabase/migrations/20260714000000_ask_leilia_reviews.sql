-- Ask Leilia reviews: moderation, verification, and secure review tokens.
--
-- Safety: intended to run as a single transaction (Supabase default).
-- Does not alter existing reading or payment columns.
--
-- Rollback (manual):
--   drop table if exists public.ask_leilia_reviews;
--   drop table if exists public.ask_leilia_review_tokens;

create table if not exists public.ask_leilia_review_tokens (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.ask_leilia_requests(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

create index if not exists ask_leilia_review_tokens_request_idx
on public.ask_leilia_review_tokens(request_id);

create table if not exists public.ask_leilia_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.ask_leilia_requests(id) on delete set null,
  review_token_id uuid references public.ask_leilia_review_tokens(id) on delete set null,
  reviewer_email text not null check (char_length(reviewer_email) between 5 and 320),
  display_name text not null check (char_length(display_name) between 1 and 80),
  reading_type text not null check (
    reading_type in ('one-question', 'in-depth', 'personal-guidance', 'complimentary')
  ),
  rating smallint not null check (rating between 1 and 5),
  title text check (title is null or char_length(title) between 1 and 120),
  body_original text not null check (char_length(body_original) between 40 and 4000),
  body_public text check (body_public is null or char_length(body_public) between 40 and 4000),
  consent_publish boolean not null,
  consent_marketing boolean not null default false,
  verification_status text not null default 'unverified' check (
    verification_status in ('unverified', 'verified_completed_reading', 'manually_verified')
  ),
  moderation_status text not null default 'pending' check (
    moderation_status in ('pending', 'approved', 'archived')
  ),
  is_featured boolean not null default false,
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint ask_leilia_reviews_publish_consent_required check (consent_publish = true),
  constraint ask_leilia_reviews_featured_requires_approved check (
    is_featured = false or moderation_status = 'approved'
  )
);

create unique index if not exists ask_leilia_reviews_token_once_idx
on public.ask_leilia_reviews(review_token_id)
where review_token_id is not null;

create index if not exists ask_leilia_reviews_moderation_submitted_idx
on public.ask_leilia_reviews(moderation_status, submitted_at desc);

create index if not exists ask_leilia_reviews_public_carousel_idx
on public.ask_leilia_reviews(is_featured desc, approved_at desc)
where moderation_status = 'approved';

create index if not exists ask_leilia_reviews_email_submitted_idx
on public.ask_leilia_reviews(lower(reviewer_email), submitted_at desc);

alter table public.ask_leilia_review_tokens enable row level security;
alter table public.ask_leilia_reviews enable row level security;

-- Service-role access only (anon/authenticated have no policies = denied).
-- Public reads are performed via the service client in SSR with an explicit public projection.

revoke all on table public.ask_leilia_review_tokens from anon, authenticated;
revoke all on table public.ask_leilia_reviews from anon, authenticated;

grant select, insert, update, delete on table public.ask_leilia_review_tokens to service_role;
grant select, insert, update, delete on table public.ask_leilia_reviews to service_role;
