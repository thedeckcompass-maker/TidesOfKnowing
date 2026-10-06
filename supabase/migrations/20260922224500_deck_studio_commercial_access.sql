create table if not exists public.studio_plan_capacity (
  plan_code text primary key check (plan_code in ('studio','circle','private')),
  capacity_limit integer check (capacity_limit is null or capacity_limit >= 0),
  reservation_minutes integer not null default 30 check (reservation_minutes between 5 and 120),
  updated_at timestamptz not null default now()
);

insert into public.studio_plan_capacity (plan_code, capacity_limit)
values ('studio', null), ('circle', 10), ('private', null)
on conflict (plan_code) do nothing;

create table if not exists public.studio_checkout_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_code text not null references public.studio_plan_capacity(plan_code),
  status text not null default 'pending' check (status in ('pending','completed','failed','expired','cancelled')),
  stripe_checkout_session_id text unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_entitlements (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan_code text not null references public.studio_plan_capacity(plan_code),
  status text not null check (status in ('incomplete','trialing','active','past_due','unpaid','canceled','expired','manual')),
  access_mode text not null default 'none' check (access_mode in ('write','read_only','none')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_end timestamptz,
  read_only_until timestamptz,
  paid_invoice_count integer not null default 0 check (paid_invoice_count >= 0),
  minimum_payments integer not null default 1 check (minimum_payments between 1 and 12),
  onboarding_completed_at timestamptz,
  manual_grant boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_onboarding (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  pathway text not null check (pathway in ('personal','independent','commercial')),
  deck_stage text not null check (deck_stage in ('idea','structure','writing','artwork','production','launch')),
  primary_goal text not null check (char_length(primary_goal) between 10 and 1000),
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_billing_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  object_id text,
  livemode boolean not null check (livemode = false),
  outcome text not null default 'processing' check (outcome in ('processing','completed','ignored','failed')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_entitlement_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  plan_code text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in ('offer_view','checkout_start','purchase','onboarding_complete','portal_open')),
  user_id uuid references public.profiles(id) on delete set null,
  plan_code text check (plan_code is null or plan_code in ('studio','circle','private')),
  source text not null default 'studio',
  occurred_at timestamptz not null default now()
);

create or replace function public.studio_has_read_access()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active'
  ) or exists (
    select 1 from public.studio_entitlements
    where user_id = auth.uid()
      and access_mode in ('write','read_only')
      and (access_mode = 'write' or read_only_until is null or read_only_until > now())
  );
$$;

create or replace function public.studio_has_write_access()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active'
  ) or exists (
    select 1 from public.studio_entitlements
    where user_id = auth.uid() and access_mode = 'write' and status in ('active','trialing','manual')
  );
$$;

revoke all on function public.studio_has_read_access() from public;
revoke all on function public.studio_has_write_access() from public;
grant execute on function public.studio_has_read_access() to authenticated;
grant execute on function public.studio_has_write_access() to authenticated;

create or replace function public.studio_reserve_checkout(target_plan text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  capacity integer;
  reservation_window integer;
  used_count integer;
  reservation_id uuid;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'authentication'); end if;
  if target_plan not in ('studio','circle','private') then return jsonb_build_object('ok', false, 'error', 'plan'); end if;
  update public.studio_checkout_reservations set status = 'expired', updated_at = now()
    where status = 'pending' and expires_at <= now();
  select capacity_limit, reservation_minutes into capacity, reservation_window
    from public.studio_plan_capacity where plan_code = target_plan for update;
  if capacity is not null then
    select (
      (select count(*) from public.studio_entitlements where plan_code = target_plan and status in ('active','trialing','past_due','manual')) +
      (select count(*) from public.studio_checkout_reservations where plan_code = target_plan and status = 'pending' and expires_at > now())
    ) into used_count;
    if used_count >= capacity then return jsonb_build_object('ok', false, 'error', 'capacity'); end if;
  end if;
  insert into public.studio_checkout_reservations (user_id, plan_code, expires_at)
    values (auth.uid(), target_plan, now() + make_interval(mins => reservation_window)) returning id into reservation_id;
  return jsonb_build_object('ok', true, 'reservation_id', reservation_id, 'expires_at', now() + make_interval(mins => reservation_window));
end;
$$;

revoke all on function public.studio_reserve_checkout(text) from public;
grant execute on function public.studio_reserve_checkout(text) to authenticated;

alter table public.studio_plan_capacity enable row level security;
alter table public.studio_checkout_reservations enable row level security;
alter table public.studio_entitlements enable row level security;
alter table public.studio_onboarding enable row level security;
alter table public.studio_billing_events enable row level security;
alter table public.studio_entitlement_audit enable row level security;
alter table public.studio_analytics_events enable row level security;

-- Remove the legacy combined policies and any split policies from an interrupted
-- or deliberately repeated migration before recreating the complete policy set.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where (
      schemaname = 'public'
      and tablename = any (array[
        'studio_plan_capacity', 'studio_checkout_reservations', 'studio_entitlements',
        'studio_onboarding', 'studio_billing_events', 'studio_entitlement_audit',
        'studio_projects', 'studio_card_families', 'studio_cards', 'studio_card_versions',
        'studio_guidebook_sections', 'studio_guidebook_versions', 'studio_import_records',
        'studio_journal_entries', 'studio_journal_photos', 'studio_journal_excerpts',
        'studio_pulse_requests'
      ])
      and (policyname like 'Creators can %' or policyname in (
        'Administrators can read Studio capacity',
        'Administrators can read Studio billing events',
        'Administrators can read Studio entitlement audit'
      ))
    ) or (
      schemaname = 'storage' and tablename = 'objects' and policyname in (
        'Creators can read own Studio journal photo objects',
        'Creators can upload own Studio journal photo objects',
        'Creators can delete own Studio journal photo objects'
      )
    )
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end;
$$;

create policy "Creators can read own Studio checkout reservations" on public.studio_checkout_reservations for select using (user_id = auth.uid());
create policy "Creators can read own Studio entitlement" on public.studio_entitlements for select using (user_id = auth.uid());
create policy "Creators can manage own Studio onboarding" on public.studio_onboarding for all using (user_id = auth.uid() and public.studio_has_read_access()) with check (user_id = auth.uid() and public.studio_has_write_access());
create policy "Administrators can read Studio capacity" on public.studio_plan_capacity for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active'));
create policy "Administrators can read Studio billing events" on public.studio_billing_events for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active'));
create policy "Administrators can read Studio entitlement audit" on public.studio_entitlement_audit for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active'));

drop trigger if exists studio_checkout_reservations_set_updated_at on public.studio_checkout_reservations;
create trigger studio_checkout_reservations_set_updated_at before update on public.studio_checkout_reservations for each row execute function public.set_updated_at();
drop trigger if exists studio_entitlements_set_updated_at on public.studio_entitlements;
create trigger studio_entitlements_set_updated_at before update on public.studio_entitlements for each row execute function public.set_updated_at();
drop trigger if exists studio_onboarding_set_updated_at on public.studio_onboarding;
create trigger studio_onboarding_set_updated_at before update on public.studio_onboarding for each row execute function public.set_updated_at();

-- Paid entitlement state also applies at the database boundary. Owners keep
-- SELECT access while read-only, but direct REST writes are rejected.
drop policy if exists "Creators can read own studio projects" on public.studio_projects;
create policy "Creators can read own studio projects" on public.studio_projects for select
using (owner_id = auth.uid() and public.studio_has_read_access());
drop policy if exists "Creators can create own studio projects" on public.studio_projects;
create policy "Creators can create own studio projects" on public.studio_projects for insert
with check (owner_id = auth.uid() and public.studio_has_write_access());
drop policy if exists "Creators can update own studio projects" on public.studio_projects;
create policy "Creators can update own studio projects" on public.studio_projects for update
using (owner_id = auth.uid() and public.studio_has_write_access()) with check (owner_id = auth.uid() and public.studio_has_write_access());
drop policy if exists "Creators can delete own studio projects" on public.studio_projects;
create policy "Creators can delete own studio projects" on public.studio_projects for delete
using (owner_id = auth.uid() and public.studio_has_write_access());

drop policy if exists "Creators can manage own studio card families" on public.studio_card_families;
create policy "Creators can read own studio card families" on public.studio_card_families for select using (public.studio_owns_project(project_id) and public.studio_has_read_access());
create policy "Creators can insert own studio card families" on public.studio_card_families for insert with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can update own studio card families" on public.studio_card_families for update using (public.studio_owns_project(project_id) and public.studio_has_write_access()) with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can delete own studio card families" on public.studio_card_families for delete using (public.studio_owns_project(project_id) and public.studio_has_write_access());

drop policy if exists "Creators can manage own studio cards" on public.studio_cards;
create policy "Creators can read own studio cards" on public.studio_cards for select using (public.studio_owns_project(project_id) and public.studio_has_read_access());
create policy "Creators can insert own studio cards" on public.studio_cards for insert with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can update own studio cards" on public.studio_cards for update using (public.studio_owns_project(project_id) and public.studio_has_write_access()) with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can delete own studio cards" on public.studio_cards for delete using (public.studio_owns_project(project_id) and public.studio_has_write_access());
drop policy if exists "Creators can read own studio card versions" on public.studio_card_versions;
create policy "Creators can read own studio card versions" on public.studio_card_versions for select using (public.studio_owns_project(project_id) and public.studio_has_read_access());

drop policy if exists "Creators can manage own guidebook sections" on public.studio_guidebook_sections;
create policy "Creators can read own guidebook sections" on public.studio_guidebook_sections for select using (public.studio_owns_project(project_id) and public.studio_has_read_access());
create policy "Creators can insert own guidebook sections" on public.studio_guidebook_sections for insert with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can update own guidebook sections" on public.studio_guidebook_sections for update using (public.studio_owns_project(project_id) and public.studio_has_write_access()) with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can delete own guidebook sections" on public.studio_guidebook_sections for delete using (public.studio_owns_project(project_id) and public.studio_has_write_access());
drop policy if exists "Creators can read own guidebook versions" on public.studio_guidebook_versions;
create policy "Creators can read own guidebook versions" on public.studio_guidebook_versions for select using (public.studio_owns_project(project_id) and public.studio_has_read_access());

drop policy if exists "Creators can read own Studio import records" on public.studio_import_records;
create policy "Creators can read own Studio import records" on public.studio_import_records for select using (public.studio_owns_project(project_id) and public.studio_has_read_access());

drop policy if exists "Creators can manage own Studio journal" on public.studio_journal_entries;
create policy "Creators can read own Studio journal" on public.studio_journal_entries for select using (public.studio_owns_project(project_id) and public.studio_has_read_access());
create policy "Creators can insert own Studio journal" on public.studio_journal_entries for insert with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can update own Studio journal" on public.studio_journal_entries for update using (public.studio_owns_project(project_id) and public.studio_has_write_access()) with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can delete own Studio journal" on public.studio_journal_entries for delete using (public.studio_owns_project(project_id) and public.studio_has_write_access());

drop policy if exists "Creators can manage own Studio journal photos" on public.studio_journal_photos;
create policy "Creators can read own Studio journal photos" on public.studio_journal_photos for select using (public.studio_owns_project(project_id) and public.studio_has_read_access());
create policy "Creators can insert own Studio journal photos" on public.studio_journal_photos for insert with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can update own Studio journal photos" on public.studio_journal_photos for update using (public.studio_owns_project(project_id) and public.studio_has_write_access()) with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can delete own Studio journal photos" on public.studio_journal_photos for delete using (public.studio_owns_project(project_id) and public.studio_has_write_access());
drop policy if exists "Creators can manage own Studio journal excerpts" on public.studio_journal_excerpts;
create policy "Creators can read own Studio journal excerpts" on public.studio_journal_excerpts for select using (public.studio_owns_project(project_id) and public.studio_has_read_access());
create policy "Creators can insert own Studio journal excerpts" on public.studio_journal_excerpts for insert with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can update own Studio journal excerpts" on public.studio_journal_excerpts for update using (public.studio_owns_project(project_id) and public.studio_has_write_access()) with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
create policy "Creators can delete own Studio journal excerpts" on public.studio_journal_excerpts for delete using (public.studio_owns_project(project_id) and public.studio_has_write_access());

drop policy if exists "Creators can read own Studio journal photo objects" on storage.objects;
create policy "Creators can read own Studio journal photo objects" on storage.objects for select using (bucket_id = 'studio-journal-photos' and (storage.foldername(name))[1] = auth.uid()::text and public.studio_has_read_access());
drop policy if exists "Creators can upload own Studio journal photo objects" on storage.objects;
create policy "Creators can upload own Studio journal photo objects" on storage.objects for insert with check (bucket_id = 'studio-journal-photos' and (storage.foldername(name))[1] = auth.uid()::text and public.studio_has_write_access());
drop policy if exists "Creators can delete own Studio journal photo objects" on storage.objects;
create policy "Creators can delete own Studio journal photo objects" on storage.objects for delete using (bucket_id = 'studio-journal-photos' and (storage.foldername(name))[1] = auth.uid()::text and public.studio_has_write_access());

drop policy if exists "Creators can read own Project Pulse requests" on public.studio_pulse_requests;
create policy "Creators can read own Project Pulse requests" on public.studio_pulse_requests for select using (owner_id = auth.uid() and public.studio_has_read_access());
drop policy if exists "Creators can submit own Project Pulse requests" on public.studio_pulse_requests;
create policy "Creators can submit own Project Pulse requests" on public.studio_pulse_requests for insert with check (owner_id = auth.uid() and public.studio_owns_project(project_id) and public.studio_has_write_access());
drop policy if exists "Creators can withdraw own Project Pulse requests" on public.studio_pulse_requests;
create policy "Creators can withdraw own Project Pulse requests" on public.studio_pulse_requests for update using (owner_id = auth.uid() and public.studio_has_write_access()) with check (owner_id = auth.uid() and public.studio_owns_project(project_id) and public.studio_has_write_access());

comment on table public.studio_entitlements is 'Stripe-test or audited manual Deck Creator Studio access. Webhooks govern paid entitlement state.';
comment on column public.studio_entitlements.read_only_until is 'Configured policy boundary for retained read-only and export access after paid write access ends.';
