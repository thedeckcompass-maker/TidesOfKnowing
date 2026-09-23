-- Creator-owned production and publication record. No administrative manuscript access.
create table if not exists public.studio_production_plans (
  project_id uuid primary key references public.studio_projects(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'review', 'ready')),
  planned_quantity integer check (planned_quantity between 1 and 100000),
  target_release_date date,
  component_specifications text not null default '' check (char_length(component_specifications) <= 10000),
  artwork_delivery_specifications text not null default '' check (char_length(artwork_delivery_specifications) <= 10000),
  rights_and_permissions text not null default '' check (char_length(rights_and_permissions) <= 10000),
  prototype_results text not null default '' check (char_length(prototype_results) <= 10000),
  supplier_quotes text not null default '' check (char_length(supplier_quotes) <= 10000),
  costing_and_pricing text not null default '' check (char_length(costing_and_pricing) <= 10000),
  fulfilment_plan text not null default '' check (char_length(fulfilment_plan) <= 10000),
  publication_assets text not null default '' check (char_length(publication_assets) <= 10000),
  launch_decision text not null default '' check (char_length(launch_decision) <= 10000),
  next_action text not null default '' check (char_length(next_action) <= 2000),
  version_number integer not null default 1 check (version_number >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_production_plan_versions (
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (project_id, version_number)
);

create or replace function public.studio_production_plan_version()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.studio_production_plan_versions (project_id, version_number, snapshot, created_by)
  values (new.project_id, new.version_number, to_jsonb(new) - 'created_at' - 'updated_at', auth.uid());
  return new;
end;
$$;

revoke all on function public.studio_production_plan_version() from public;

drop trigger if exists studio_production_plan_bump_version on public.studio_production_plans;
create trigger studio_production_plan_bump_version before update on public.studio_production_plans
for each row execute function public.studio_bump_version();
drop trigger if exists studio_production_plan_set_updated_at on public.studio_production_plans;
create trigger studio_production_plan_set_updated_at before update on public.studio_production_plans
for each row execute function public.set_updated_at();
drop trigger if exists studio_production_plan_capture_version on public.studio_production_plans;
create trigger studio_production_plan_capture_version after insert or update on public.studio_production_plans
for each row execute function public.studio_production_plan_version();

alter table public.studio_production_plans enable row level security;
alter table public.studio_production_plan_versions enable row level security;

revoke all on public.studio_production_plans, public.studio_production_plan_versions from anon;
grant select, insert, update on public.studio_production_plans to authenticated;
grant select on public.studio_production_plan_versions to authenticated;

drop policy if exists "Creators can read own production plan" on public.studio_production_plans;
create policy "Creators can read own production plan" on public.studio_production_plans for select
using (public.studio_owns_project(project_id) and public.studio_has_read_access());
drop policy if exists "Creators can create own production plan" on public.studio_production_plans;
create policy "Creators can create own production plan" on public.studio_production_plans for insert
with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
drop policy if exists "Creators can update own production plan" on public.studio_production_plans;
create policy "Creators can update own production plan" on public.studio_production_plans for update
using (public.studio_owns_project(project_id) and public.studio_has_write_access())
with check (public.studio_owns_project(project_id) and public.studio_has_write_access());
drop policy if exists "Creators can read own production plan history" on public.studio_production_plan_versions;
create policy "Creators can read own production plan history" on public.studio_production_plan_versions for select
using (public.studio_owns_project(project_id) and public.studio_has_read_access());

comment on table public.studio_production_plans is 'Private, versioned production and publication plan owned by the project creator.';
