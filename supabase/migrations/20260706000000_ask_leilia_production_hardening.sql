-- Ask Leilia production hardening: reading_type, payment exceptions, PDF delivery.
--
-- Safety: intended to run as a single transaction (Supabase default). Any failure rolls back entirely.
--
-- Rollback (manual, only if applied and you need to revert schema — data in new columns is lost):
--   alter table public.ask_leilia_requests drop constraint if exists ask_leilia_requests_reading_type_check;
--   alter table public.ask_leilia_requests drop constraint if exists ask_leilia_requests_status_check;
--   alter table public.ask_leilia_requests
--     add constraint ask_leilia_requests_status_check
--     check (status in ('Pending Payment', 'Paid', 'In Progress', 'Delivered'));
--   drop index if exists ask_leilia_requests_reading_type_created_idx;
--   drop index if exists ask_leilia_requests_payment_exception_idx;
--   alter table public.ask_leilia_requests drop column if exists reading_type;
--   alter table public.ask_leilia_requests drop column if exists delivery_pdf_path;
--   alter table public.ask_leilia_requests drop column if exists delivery_sent_at;
--   alter table public.ask_leilia_requests drop column if exists payment_expected_amount;
--   alter table public.ask_leilia_requests drop column if exists payment_actual_amount;
--   alter table public.ask_leilia_requests drop column if exists payment_exception_reference;

alter table public.ask_leilia_requests
add column if not exists reading_type text;

alter table public.ask_leilia_requests
add column if not exists delivery_pdf_path text;

alter table public.ask_leilia_requests
add column if not exists delivery_sent_at timestamptz;

alter table public.ask_leilia_requests
add column if not exists payment_expected_amount integer;

alter table public.ask_leilia_requests
add column if not exists payment_actual_amount integer;

alter table public.ask_leilia_requests
add column if not exists payment_exception_reference text;

-- Backfill reading_type from legacy admin_notes (most specific matches first).
update public.ask_leilia_requests
set reading_type = 'complimentary'
where reading_type is null
  and admin_notes = 'Complimentary invitation (Leilia Gift)';

update public.ask_leilia_requests
set reading_type = 'personal-guidance'
where reading_type is null
  and admin_notes ~ '(^|\n)Reading type: Personal Guidance Reading(\n|$)';

update public.ask_leilia_requests
set reading_type = 'in-depth'
where reading_type is null
  and admin_notes ~ '(^|\n)Reading type: In-Depth Reading(\n|$)';

update public.ask_leilia_requests
set reading_type = 'one-question'
where reading_type is null
  and admin_notes ~ '(^|\n)Reading type: One Question Reading(\n|$)';

-- Infer reading_type from linked Stripe payment when notes did not record it.
update public.ask_leilia_requests as r
set reading_type = case
  when p.amount = 7500 and lower(p.currency) = 'usd' then 'in-depth'
  when p.amount = 15000 and lower(p.currency) = 'usd' then 'personal-guidance'
  when p.amount = 2500 and lower(p.currency) = 'usd' then 'one-question'
  else r.reading_type
end
from public.ask_leilia_payments as p
where r.payment_id = p.id
  and r.reading_type is null
  and p.amount in (2500, 7500, 15000);

-- Remaining requests default to one-question (legacy single-tier flow).
update public.ask_leilia_requests
set reading_type = 'one-question'
where reading_type is null;

-- Remove only legacy structured reading-type lines; preserve other editorial content.
update public.ask_leilia_requests
set admin_notes = nullif(
  trim(
    regexp_replace(
      regexp_replace(
        coalesce(admin_notes, ''),
        '(^|\n)Reading type: (One Question Reading|In-Depth Reading|Personal Guidance Reading)\s*(\n)?',
        '',
        'g'
      ),
      '\n{3,}',
      E'\n\n',
      'g'
    )
  ),
  ''
)
where admin_notes ~ '(^|\n)Reading type: (One Question Reading|In-Depth Reading|Personal Guidance Reading)';

update public.ask_leilia_requests
set admin_notes = null
where admin_notes = 'Complimentary invitation (Leilia Gift)';

do $$
begin
  if exists (select 1 from public.ask_leilia_requests where reading_type is null) then
    raise exception 'Ask Leilia migration aborted: reading_type backfill left NULL values.';
  end if;

  if exists (
    select 1
    from public.ask_leilia_requests
    where reading_type not in ('one-question', 'in-depth', 'personal-guidance', 'complimentary')
  ) then
    raise exception 'Ask Leilia migration aborted: invalid reading_type values remain.';
  end if;

  if exists (
    select 1
    from public.ask_leilia_requests
    where status not in ('Pending Payment', 'Paid', 'In Progress', 'Delivered', 'Payment Exception')
  ) then
    raise exception 'Ask Leilia migration aborted: invalid status values remain.';
  end if;
end $$;

alter table public.ask_leilia_requests
alter column reading_type set not null;

alter table public.ask_leilia_requests
drop constraint if exists ask_leilia_requests_reading_type_check;

alter table public.ask_leilia_requests
add constraint ask_leilia_requests_reading_type_check
check (reading_type in ('one-question', 'in-depth', 'personal-guidance', 'complimentary'));

alter table public.ask_leilia_requests
drop constraint if exists ask_leilia_requests_status_check;

alter table public.ask_leilia_requests
add constraint ask_leilia_requests_status_check
check (status in ('Pending Payment', 'Paid', 'In Progress', 'Delivered', 'Payment Exception'));

create index if not exists ask_leilia_requests_reading_type_created_idx
on public.ask_leilia_requests(reading_type, created_at desc);

create index if not exists ask_leilia_requests_payment_exception_idx
on public.ask_leilia_requests(status)
where status = 'Payment Exception';
