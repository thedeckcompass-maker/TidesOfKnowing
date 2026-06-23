create table if not exists public.ask_leilia_payments (
  id uuid primary key default gen_random_uuid(),
  stripe_payment_intent text not null unique,
  stripe_customer_id text,
  customer_email text not null check (char_length(customer_email) between 5 and 320),
  amount integer not null,
  currency text not null,
  payment_status text not null,
  stripe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ask_leilia_requests (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.ask_leilia_payments(id) on delete set null,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 320),
  question text not null check (char_length(question) between 10 and 2000),
  context text,
  card_preference text not null check (card_preference in ('pull_for_me', 'own_cards_attached')),
  image_url text,
  status text not null default 'Paid' check (status in ('Paid', 'In Progress', 'Delivered')),
  admin_notes text,
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists ask_leilia_payments_email_created_idx
on public.ask_leilia_payments(lower(customer_email), created_at desc);

create index if not exists ask_leilia_payments_status_created_idx
on public.ask_leilia_payments(payment_status, created_at desc);

create index if not exists ask_leilia_requests_status_created_idx
on public.ask_leilia_requests(status, created_at desc);

create index if not exists ask_leilia_requests_email_created_idx
on public.ask_leilia_requests(lower(email), created_at desc);

drop trigger if exists ask_leilia_requests_set_updated_at on public.ask_leilia_requests;
create trigger ask_leilia_requests_set_updated_at
before update on public.ask_leilia_requests
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('ask-leilia-uploads', 'ask-leilia-uploads', false)
on conflict (id) do nothing;

alter table public.ask_leilia_requests enable row level security;
alter table public.ask_leilia_payments enable row level security;

drop policy if exists "Admins can read ask leilia payments" on public.ask_leilia_payments;
create policy "Admins can read ask leilia payments"
on public.ask_leilia_payments for select
using (public.is_admin());

drop policy if exists "Admins can read ask leilia requests" on public.ask_leilia_requests;
create policy "Admins can read ask leilia requests"
on public.ask_leilia_requests for select
using (public.is_admin());

drop policy if exists "Admins can update ask leilia requests" on public.ask_leilia_requests;
create policy "Admins can update ask leilia requests"
on public.ask_leilia_requests for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read ask leilia uploads" on storage.objects;
create policy "Admins can read ask leilia uploads"
on storage.objects for select
using (bucket_id = 'ask-leilia-uploads' and public.is_admin());
