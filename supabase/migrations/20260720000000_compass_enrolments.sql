-- COMPASS Live Practitioner Training — pre-payment enrolment records.
-- Associates cohort selection + contact details with Stripe via client_reference_id.
-- Do not apply remotely from this task; local/CI apply only when authorised.

create table if not exists public.compass_enrolments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email text not null check (char_length(email) between 5 and 320),
  cohort_id text not null check (char_length(cohort_id) between 3 and 40),
  cohort_label text not null check (char_length(cohort_label) between 3 and 120),
  start_date date not null,
  session_dates jsonb not null,
  timezone text not null default 'America/Mexico_City',
  price_usd integer not null check (price_usd = 997),
  offer_id text not null default 'compass-live-997',
  stripe_payment_link_id text not null,
  source_page text not null default '/compass/',
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'payment_exception', 'cancelled', 'refunded')),
  stripe_checkout_session_id text,
  stripe_payment_intent text,
  payment_id uuid,
  admin_notes text
);

create index if not exists compass_enrolments_status_created_idx
  on public.compass_enrolments (status, created_at desc);

create index if not exists compass_enrolments_email_created_idx
  on public.compass_enrolments (lower(email), created_at desc);

create index if not exists compass_enrolments_cohort_created_idx
  on public.compass_enrolments (cohort_id, created_at desc);

create index if not exists compass_enrolments_start_date_idx
  on public.compass_enrolments (start_date);

drop trigger if exists compass_enrolments_set_updated_at on public.compass_enrolments;
create trigger compass_enrolments_set_updated_at
before update on public.compass_enrolments
for each row execute function public.set_updated_at();

alter table public.compass_enrolments enable row level security;

drop policy if exists "Admins can read compass enrolments" on public.compass_enrolments;
create policy "Admins can read compass enrolments"
on public.compass_enrolments for select
using (public.is_admin());

drop policy if exists "Admins can update compass enrolments" on public.compass_enrolments;
create policy "Admins can update compass enrolments"
on public.compass_enrolments for update
using (public.is_admin())
with check (public.is_admin());
