create table if not exists public.studio_support_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  plan_code text not null check (plan_code in ('circle','private')),
  support_kind text not null check (support_kind in ('circle_weekly','private_weekly')),
  support_week date not null,
  focus_question text not null check (char_length(focus_question) between 10 and 1200),
  context_excerpt text not null default '' check (char_length(context_excerpt) <= 5000),
  review_scopes text[] not null default '{}'::text[] check (
    review_scopes <@ array['project','cards','guidebook']::text[]
  ),
  group_share_confirmed boolean not null default false,
  consent_granted_at timestamptz not null default now(),
  consent_withdrawn_at timestamptz,
  facilitator_id uuid references public.profiles(id) on delete set null,
  status text not null default 'requested' check (
    status in ('requested','accepted','completed','withdrawn','expired')
  ),
  accepted_at timestamptz,
  access_expires_at timestamptz,
  session_scheduled_for timestamptz,
  facilitator_response text not null default '' check (char_length(facilitator_response) <= 5000),
  next_step text not null default '' check (char_length(next_step) <= 1200),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, support_week)
);

create index if not exists studio_support_project_week_idx
  on public.studio_support_requests(project_id, support_week desc);
create index if not exists studio_support_facilitator_active_idx
  on public.studio_support_requests(facilitator_id, status, access_expires_at);

create or replace function public.studio_validate_support_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  entitled_plan text;
begin
  if not exists (
    select 1 from public.studio_projects
    where id = new.project_id and owner_id = new.owner_id
  ) then
    raise exception 'Support request owner must own the Studio project';
  end if;

  if extract(isodow from new.support_week) <> 1 then
    raise exception 'Support week must begin on Monday';
  end if;

  if tg_op = 'INSERT' then
    select plan_code into entitled_plan
    from public.studio_entitlements
    where user_id = new.owner_id
      and access_mode = 'write'
      and status in ('active','trialing','manual');

    if entitled_plan is null or entitled_plan <> new.plan_code then
      raise exception 'An active matching support entitlement is required';
    end if;
  end if;

  if new.plan_code = 'circle' then
    if new.support_kind <> 'circle_weekly' or cardinality(new.review_scopes) <> 0 or not new.group_share_confirmed then
      raise exception 'Circle support accepts a group-safe submission and never grants manuscript access';
    end if;
  elsif new.plan_code = 'private' then
    if new.support_kind <> 'private_weekly'
      or not ('project' = any(new.review_scopes))
      or new.group_share_confirmed then
      raise exception 'Private support requires explicit project review scope';
    end if;
  end if;

  if new.accepted_at is not null and (
    new.access_expires_at is null
    or new.access_expires_at > new.accepted_at + interval '14 days'
  ) then
    raise exception 'Private support access cannot exceed 14 days';
  end if;

  if new.status in ('completed','withdrawn','expired') and (
    new.access_expires_at is null or new.access_expires_at > now()
  ) then
    raise exception 'Closed support requests cannot retain active workspace access';
  end if;

  return new;
end;
$$;

create or replace function public.studio_protect_support_owner_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.owner_id then
    if new.project_id <> old.project_id
      or new.owner_id <> old.owner_id
      or new.plan_code <> old.plan_code
      or new.support_kind <> old.support_kind
      or new.support_week <> old.support_week
      or new.focus_question <> old.focus_question
      or new.context_excerpt <> old.context_excerpt
      or new.review_scopes is distinct from old.review_scopes
      or new.group_share_confirmed <> old.group_share_confirmed
      or new.consent_granted_at <> old.consent_granted_at
      or new.facilitator_id is distinct from old.facilitator_id
      or new.accepted_at is distinct from old.accepted_at
      or new.session_scheduled_for is distinct from old.session_scheduled_for
      or new.facilitator_response <> old.facilitator_response
      or new.next_step <> old.next_step
      or new.completed_at is distinct from old.completed_at
      or new.status <> 'withdrawn'
      or new.consent_withdrawn_at is null
      or new.access_expires_at is null
      or new.access_expires_at > now() then
      raise exception 'Creators may only withdraw a support request';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.studio_support_scope_allows(target_project_id uuid, target_scope text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_scope in ('project','cards','guidebook') and exists (
    select 1
    from public.studio_support_requests
    where project_id = target_project_id
      and plan_code = 'private'
      and support_kind = 'private_weekly'
      and facilitator_id = auth.uid()
      and status = 'accepted'
      and consent_withdrawn_at is null
      and access_expires_at > now()
      and target_scope = any(review_scopes)
  );
$$;

revoke all on function public.studio_support_scope_allows(uuid, text) from public;
grant execute on function public.studio_support_scope_allows(uuid, text) to authenticated;

drop trigger if exists studio_support_validate on public.studio_support_requests;
create trigger studio_support_validate
before insert or update on public.studio_support_requests
for each row execute function public.studio_validate_support_request();

drop trigger if exists studio_support_protect_owner_update on public.studio_support_requests;
create trigger studio_support_protect_owner_update
before update on public.studio_support_requests
for each row execute function public.studio_protect_support_owner_update();

drop trigger if exists studio_support_set_updated_at on public.studio_support_requests;
create trigger studio_support_set_updated_at
before update on public.studio_support_requests
for each row execute function public.set_updated_at();

alter table public.studio_support_requests enable row level security;

drop policy if exists "Creators can read own Studio support requests" on public.studio_support_requests;
create policy "Creators can read own Studio support requests"
on public.studio_support_requests for select
using (owner_id = auth.uid() and public.studio_has_read_access());

drop policy if exists "Creators can submit own Studio support requests" on public.studio_support_requests;
create policy "Creators can submit own Studio support requests"
on public.studio_support_requests for insert
with check (
  owner_id = auth.uid()
  and public.studio_owns_project(project_id)
  and public.studio_has_write_access()
);

drop policy if exists "Creators can withdraw own Studio support requests" on public.studio_support_requests;
create policy "Creators can withdraw own Studio support requests"
on public.studio_support_requests for update
using (owner_id = auth.uid() and public.studio_has_write_access())
with check (
  owner_id = auth.uid()
  and public.studio_owns_project(project_id)
  and public.studio_has_write_access()
);

drop policy if exists "Assigned facilitators can read active Studio support requests" on public.studio_support_requests;
create policy "Assigned facilitators can read active Studio support requests"
on public.studio_support_requests for select
using (
  facilitator_id = auth.uid()
  and status = 'accepted'
  and consent_withdrawn_at is null
  and access_expires_at > now()
);

-- Private support grants only the scopes a creator selected. Circle support
-- never reaches these project-content policies.
drop policy if exists "Creators can read own studio projects" on public.studio_projects;
create policy "Creators can read own studio projects" on public.studio_projects for select
using (
  (owner_id = auth.uid() and public.studio_has_read_access())
  or public.studio_support_scope_allows(id, 'project')
);

drop policy if exists "Creators can read own studio card families" on public.studio_card_families;
create policy "Creators can read own studio card families" on public.studio_card_families for select
using (
  (public.studio_owns_project(project_id) and public.studio_has_read_access())
  or public.studio_support_scope_allows(project_id, 'project')
);

drop policy if exists "Creators can read own studio cards" on public.studio_cards;
create policy "Creators can read own studio cards" on public.studio_cards for select
using (
  (public.studio_owns_project(project_id) and public.studio_has_read_access())
  or public.studio_support_scope_allows(project_id, 'cards')
);

drop policy if exists "Creators can read own studio card versions" on public.studio_card_versions;
create policy "Creators can read own studio card versions" on public.studio_card_versions for select
using (
  (public.studio_owns_project(project_id) and public.studio_has_read_access())
  or public.studio_support_scope_allows(project_id, 'cards')
);

drop policy if exists "Creators can read own guidebook sections" on public.studio_guidebook_sections;
create policy "Creators can read own guidebook sections" on public.studio_guidebook_sections for select
using (
  (public.studio_owns_project(project_id) and public.studio_has_read_access())
  or public.studio_support_scope_allows(project_id, 'guidebook')
);

drop policy if exists "Creators can read own guidebook versions" on public.studio_guidebook_versions;
create policy "Creators can read own guidebook versions" on public.studio_guidebook_versions for select
using (
  (public.studio_owns_project(project_id) and public.studio_has_read_access())
  or public.studio_support_scope_allows(project_id, 'guidebook')
);

comment on table public.studio_support_requests is 'Plan-specific weekly support. Circle receives only deliberately submitted group-safe text; Private access is explicit, scoped and time-limited.';
comment on column public.studio_support_requests.review_scopes is 'Private support scopes only. Journal and private media are excluded from this launch workflow.';
