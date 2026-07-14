-- Ask Leilia fulfilment dashboard: delivery/review metadata + manual payment override.
--
-- Dashboard includes all submitted questionnaires (Pending Payment, Payment Exception,
-- Paid, In Progress, Delivered). Stripe remains authoritative for Stripe results.
-- Effective payment = verified Stripe/complimentary workflow OR active manual override.
--
-- Fulfilment UI derives: new | in_progress | ready_to_send | delivered | archived
-- from status + delivery_pdf_path + archived_at (ready_to_send is derived, not stored).
--
-- Safety: single transaction (Supabase default). Additive only; does not delete rows.
-- Does NOT invent historical paid outcomes for failed/incomplete Stripe attempts.
--
-- Rollback (manual):
--   alter table public.ask_leilia_requests
--     drop constraint if exists ask_leilia_requests_delivery_method_check,
--     drop constraint if exists ask_leilia_requests_review_status_check,
--     drop constraint if exists ask_leilia_requests_manual_payment_method_check;
--   drop index if exists ask_leilia_requests_fulfilment_queue_idx;
--   drop index if exists ask_leilia_requests_review_status_idx;
--   drop index if exists ask_leilia_requests_manual_paid_idx;
--   alter table public.ask_leilia_requests
--     drop column if exists started_at,
--     drop column if exists delivered_to,
--     drop column if exists delivery_method,
--     drop column if exists manually_delivered,
--     drop column if exists delivery_note,
--     drop column if exists delivery_pdf_filename,
--     drop column if exists delivery_pdf_uploaded_at,
--     drop column if exists delivery_pdf_size_bytes,
--     drop column if exists delivery_attempt_count,
--     drop column if exists last_resent_at,
--     drop column if exists review_status,
--     drop column if exists review_requested_at,
--     drop column if exists review_request_recipient,
--     drop column if exists linked_review_id,
--     drop column if exists manually_marked_paid,
--     drop column if exists manual_payment_method,
--     drop column if exists manual_payment_reference,
--     drop column if exists manual_payment_note,
--     drop column if exists manual_payment_recorded_at,
--     drop column if exists manual_payment_recorded_by,
--     drop column if exists manual_payment_reversed_at,
--     drop column if exists manual_payment_reversed_by;

alter table public.ask_leilia_requests
  add column if not exists started_at timestamptz,
  add column if not exists delivered_to text,
  add column if not exists delivery_method text,
  add column if not exists manually_delivered boolean not null default false,
  add column if not exists delivery_note text,
  add column if not exists delivery_pdf_filename text,
  add column if not exists delivery_pdf_uploaded_at timestamptz,
  add column if not exists delivery_pdf_size_bytes integer,
  add column if not exists delivery_attempt_count integer not null default 0,
  add column if not exists last_resent_at timestamptz,
  add column if not exists review_status text not null default 'not_requested',
  add column if not exists review_requested_at timestamptz,
  add column if not exists review_request_recipient text,
  add column if not exists linked_review_id uuid,
  add column if not exists manually_marked_paid boolean not null default false,
  add column if not exists manual_payment_method text,
  add column if not exists manual_payment_reference text,
  add column if not exists manual_payment_note text,
  add column if not exists manual_payment_recorded_at timestamptz,
  add column if not exists manual_payment_recorded_by uuid,
  add column if not exists manual_payment_reversed_at timestamptz,
  add column if not exists manual_payment_reversed_by uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ask_leilia_requests_delivery_method_check'
  ) then
    alter table public.ask_leilia_requests
      add constraint ask_leilia_requests_delivery_method_check
      check (
        delivery_method is null
        or delivery_method in (
          'system_email',
          'personal_email',
          'messaging_service',
          'other'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'ask_leilia_requests_review_status_check'
  ) then
    alter table public.ask_leilia_requests
      add constraint ask_leilia_requests_review_status_check
      check (
        review_status in ('not_requested', 'requested', 'provided')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'ask_leilia_requests_manual_payment_method_check'
  ) then
    alter table public.ask_leilia_requests
      add constraint ask_leilia_requests_manual_payment_method_check
      check (
        manual_payment_method is null
        or manual_payment_method in (
          'paypal',
          'bank_transfer',
          'cash',
          'other',
          'waived_complimentary'
        )
      );
  end if;
end $$;

-- Link FK after column exists (nullable; historical review rows may lack request_id).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ask_leilia_requests_linked_review_id_fkey'
  ) then
    alter table public.ask_leilia_requests
      add constraint ask_leilia_requests_linked_review_id_fkey
      foreign key (linked_review_id)
      references public.ask_leilia_reviews(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'ask_leilia_requests_manual_payment_recorded_by_fkey'
  ) then
    alter table public.ask_leilia_requests
      add constraint ask_leilia_requests_manual_payment_recorded_by_fkey
      foreign key (manual_payment_recorded_by)
      references public.profiles(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'ask_leilia_requests_manual_payment_reversed_by_fkey'
  ) then
    alter table public.ask_leilia_requests
      add constraint ask_leilia_requests_manual_payment_reversed_by_fkey
      foreign key (manual_payment_reversed_by)
      references public.profiles(id)
      on delete set null;
  end if;
end $$;

-- Backfill delivery metadata from verified sends only (delivery_sent_at / delivered_at).
-- Do NOT infer delivery success from PDF presence alone.
-- Do NOT invent manual payment confirmations for failed or incomplete Stripe rows.
update public.ask_leilia_requests
set
  delivered_to = coalesce(delivered_to, email),
  delivery_method = coalesce(delivery_method, 'system_email'),
  manually_delivered = coalesce(manually_delivered, false),
  delivery_attempt_count = greatest(coalesce(delivery_attempt_count, 0), 1)
where status = 'Delivered'
  and delivery_sent_at is not null;

update public.ask_leilia_requests
set
  delivery_pdf_uploaded_at = coalesce(delivery_pdf_uploaded_at, updated_at),
  delivery_pdf_filename = coalesce(delivery_pdf_filename, 'Ask-Leilia-Reading.pdf')
where delivery_pdf_path is not null
  and (delivery_pdf_uploaded_at is null or delivery_pdf_filename is null);

-- Started readings that were already in progress.
update public.ask_leilia_requests
set started_at = coalesce(started_at, updated_at)
where status = 'In Progress'
  and started_at is null
  and archived_at is null;

-- Reviews linked by request_id → provided.
update public.ask_leilia_requests as r
set
  review_status = 'provided',
  linked_review_id = rev.id
from (
  select distinct on (request_id)
    id,
    request_id
  from public.ask_leilia_reviews
  where request_id is not null
  order by request_id, submitted_at desc
) as rev
where r.id = rev.request_id;

-- Tokens exist but no review yet → request was previously offered (delivery-era links).
-- Only mark requested when delivered and still not_requested / no linked review.
update public.ask_leilia_requests as r
set
  review_status = 'requested',
  review_requested_at = coalesce(r.review_requested_at, t.created_at),
  review_request_recipient = coalesce(r.review_request_recipient, r.email)
from public.ask_leilia_review_tokens as t
where t.request_id = r.id
  and t.consumed_at is null
  and r.status = 'Delivered'
  and r.review_status = 'not_requested'
  and r.linked_review_id is null;

-- All questionnaire statuses (including unpaid) appear in the admin queue.
create index if not exists ask_leilia_requests_fulfilment_queue_idx
on public.ask_leilia_requests (archived_at, created_at desc);

create index if not exists ask_leilia_requests_review_status_idx
on public.ask_leilia_requests (review_status, status)
where status = 'Delivered';

create index if not exists ask_leilia_requests_manual_paid_idx
on public.ask_leilia_requests (manually_marked_paid, status)
where manually_marked_paid = true;
