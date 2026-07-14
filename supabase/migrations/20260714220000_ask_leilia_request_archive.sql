-- Ask Leilia request archive visibility (administrative, non-destructive).
-- Does not alter lifecycle status or payment fields.
--
-- Rollback (manual):
--   drop index if exists public.ask_leilia_requests_archived_created_idx;
--   drop index if exists public.ask_leilia_requests_active_created_idx;
--   alter table public.ask_leilia_requests drop column if exists archived_by;
--   alter table public.ask_leilia_requests drop column if exists archived_at;

alter table public.ask_leilia_requests
add column if not exists archived_at timestamptz;

alter table public.ask_leilia_requests
add column if not exists archived_by uuid references public.profiles(id) on delete set null;

create index if not exists ask_leilia_requests_archived_created_idx
on public.ask_leilia_requests(archived_at desc, created_at desc)
where archived_at is not null;

create index if not exists ask_leilia_requests_active_created_idx
on public.ask_leilia_requests(created_at desc)
where archived_at is null;
