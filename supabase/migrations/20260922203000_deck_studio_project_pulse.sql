create table if not exists public.studio_pulse_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  billing_month date not null,
  priority_question text not null check (char_length(priority_question) between 10 and 1200),
  consent_granted_at timestamptz not null default now(),
  consent_withdrawn_at timestamptz,
  reviewer_id uuid references public.profiles(id) on delete set null,
  status text not null default 'requested' check (status in ('requested','accepted','completed','withdrawn','expired')),
  accepted_at timestamptz,
  access_expires_at timestamptz,
  observations text[] not null default '{}'::text[] check (cardinality(observations) <= 3),
  response_summary text not null default '',
  next_step text not null default '',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, billing_month)
);

create or replace function public.studio_validate_pulse_request()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.studio_projects where id = new.project_id and owner_id = new.owner_id) then
    raise exception 'Project Pulse owner must own the Studio project';
  end if;
  if new.billing_month <> date_trunc('month', new.billing_month)::date then
    raise exception 'Project Pulse billing month must be the first day of the month';
  end if;
  if new.accepted_at is not null and (new.access_expires_at is null or new.access_expires_at > new.accepted_at + interval '14 days') then
    raise exception 'Project Pulse reviewer access cannot exceed 14 days';
  end if;
  return new;
end;
$$;

create or replace function public.studio_protect_pulse_owner_update()
returns trigger language plpgsql as $$
begin
  if auth.uid() = old.owner_id then
    if new.project_id <> old.project_id
      or new.owner_id <> old.owner_id
      or new.billing_month <> old.billing_month
      or new.priority_question <> old.priority_question
      or new.consent_granted_at <> old.consent_granted_at
      or new.reviewer_id is distinct from old.reviewer_id
      or new.accepted_at is distinct from old.accepted_at
      or new.observations is distinct from old.observations
      or new.response_summary <> old.response_summary
      or new.next_step <> old.next_step
      or new.completed_at is distinct from old.completed_at
      or new.status <> 'withdrawn'
      or new.consent_withdrawn_at is null
      or new.access_expires_at is null
      or new.access_expires_at > now() then
      raise exception 'Creators may only withdraw Project Pulse consent';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists studio_pulse_validate on public.studio_pulse_requests;
create trigger studio_pulse_validate before insert or update on public.studio_pulse_requests
for each row execute function public.studio_validate_pulse_request();
drop trigger if exists studio_pulse_protect_owner_update on public.studio_pulse_requests;
create trigger studio_pulse_protect_owner_update before update on public.studio_pulse_requests
for each row execute function public.studio_protect_pulse_owner_update();
drop trigger if exists studio_pulse_set_updated_at on public.studio_pulse_requests;
create trigger studio_pulse_set_updated_at before update on public.studio_pulse_requests
for each row execute function public.set_updated_at();

alter table public.studio_pulse_requests enable row level security;
drop policy if exists "Creators can read own Project Pulse requests" on public.studio_pulse_requests;
create policy "Creators can read own Project Pulse requests" on public.studio_pulse_requests for select
using (owner_id = auth.uid());
drop policy if exists "Creators can submit own Project Pulse requests" on public.studio_pulse_requests;
create policy "Creators can submit own Project Pulse requests" on public.studio_pulse_requests for insert
with check (owner_id = auth.uid() and public.studio_owns_project(project_id));
drop policy if exists "Creators can withdraw own Project Pulse requests" on public.studio_pulse_requests;
create policy "Creators can withdraw own Project Pulse requests" on public.studio_pulse_requests for update
using (owner_id = auth.uid()) with check (owner_id = auth.uid() and public.studio_owns_project(project_id));
drop policy if exists "Assigned reviewers can read active Project Pulse requests" on public.studio_pulse_requests;
create policy "Assigned reviewers can read active Project Pulse requests" on public.studio_pulse_requests for select
using (reviewer_id = auth.uid() and status = 'accepted' and consent_withdrawn_at is null and access_expires_at > now());

comment on table public.studio_pulse_requests is 'Purpose-specific, time-limited Project Pulse consent. No detailed manuscript editing, production verification or automatic rewriting.';
