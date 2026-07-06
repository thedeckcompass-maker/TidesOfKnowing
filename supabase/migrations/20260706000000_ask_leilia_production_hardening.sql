-- Ask Leilia production hardening: reading_type, payment exceptions, PDF delivery.

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

-- Backfill reading_type from legacy admin_notes before constraints.
update public.ask_leilia_requests
set reading_type = 'complimentary'
where reading_type is null
  and admin_notes ilike '%Complimentary invitation%';

update public.ask_leilia_requests
set reading_type = 'personal-guidance'
where reading_type is null
  and admin_notes ilike '%Reading type: Personal Guidance%';

update public.ask_leilia_requests
set reading_type = 'in-depth'
where reading_type is null
  and admin_notes ilike '%Reading type: In-Depth%';

update public.ask_leilia_requests
set reading_type = 'one-question'
where reading_type is null
  and admin_notes ilike '%Reading type: One Question%';

update public.ask_leilia_requests
set reading_type = 'one-question'
where reading_type is null;

-- Remove structured reading-type lines from editorial notes.
update public.ask_leilia_requests
set admin_notes = nullif(
  trim(
    regexp_replace(
      coalesce(admin_notes, ''),
      '(^|\n)Reading type: [^\n]+',
      '',
      'g'
    )
  ),
  ''
)
where admin_notes ilike '%Reading type:%';

update public.ask_leilia_requests
set admin_notes = null
where admin_notes = 'Complimentary invitation (Leilia Gift)';

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
