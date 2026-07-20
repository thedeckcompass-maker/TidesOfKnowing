-- COMPASS enrolment simplification: retain only fields needed for cohort selection,
-- Stripe association, paid status, and capacity. Remove student-email and exception
-- automation. Do not apply remotely until the matching application deploy is ready
-- (inserts no longer write dropped columns).

-- Normalise any non-core statuses before tightening the check constraint.
update public.compass_enrolments
set status = 'pending_payment'
where status is distinct from 'paid'
  and status is distinct from 'pending_payment';

alter table public.compass_enrolments
  drop constraint if exists compass_enrolments_status_check;

alter table public.compass_enrolments
  add constraint compass_enrolments_status_check
  check (status in ('pending_payment', 'paid'));

drop index if exists public.compass_enrolments_stripe_payment_intent_uidx;

alter table public.compass_enrolments
  drop column if exists session_dates,
  drop column if exists timezone,
  drop column if exists price_usd,
  drop column if exists offer_id,
  drop column if exists source_page,
  drop column if exists stripe_payment_intent,
  drop column if exists payment_id,
  drop column if exists admin_notes,
  drop column if exists student_confirmation_sent_at,
  drop column if exists internal_notification_sent_at,
  drop column if exists stripe_event_id;

-- Replace the fulfilment RPC: atomic paid mark + capacity only.
drop function if exists public.mark_compass_enrolment_paid(uuid, text, text, text, integer);

create or replace function public.mark_compass_enrolment_paid(
  p_enrolment_id uuid,
  p_stripe_checkout_session_id text,
  p_max_paid integer default 6
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.compass_enrolments%rowtype;
  v_paid_count integer;
begin
  select * into v_row
  from public.compass_enrolments
  where id = p_enrolment_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_row.status = 'paid' then
    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'enrolment', to_jsonb(v_row)
    );
  end if;

  if v_row.status is distinct from 'pending_payment' then
    return jsonb_build_object(
      'ok', false,
      'error', 'invalid_status',
      'status', v_row.status,
      'enrolment', to_jsonb(v_row)
    );
  end if;

  select count(*)::integer into v_paid_count
  from public.compass_enrolments
  where cohort_id = v_row.cohort_id
    and status = 'paid';

  if v_paid_count >= p_max_paid then
    return jsonb_build_object(
      'ok', false,
      'error', 'capacity',
      'enrolment', to_jsonb(v_row)
    );
  end if;

  update public.compass_enrolments
  set
    status = 'paid',
    paid_at = now(),
    stripe_checkout_session_id = p_stripe_checkout_session_id
  where id = p_enrolment_id
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'enrolment', to_jsonb(v_row)
  );
end;
$$;

revoke all on function public.mark_compass_enrolment_paid(uuid, text, integer) from public;
revoke all on function public.mark_compass_enrolment_paid(uuid, text, integer) from anon;
revoke all on function public.mark_compass_enrolment_paid(uuid, text, integer) from authenticated;
grant execute on function public.mark_compass_enrolment_paid(uuid, text, integer) to service_role;
