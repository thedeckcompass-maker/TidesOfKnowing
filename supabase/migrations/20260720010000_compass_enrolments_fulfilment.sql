-- COMPASS enrolment fulfilment extensions (capacity, paid timestamps, email idempotency).
-- Do not apply remotely from this task.

alter table public.compass_enrolments
  add column if not exists paid_at timestamptz,
  add column if not exists student_confirmation_sent_at timestamptz,
  add column if not exists internal_notification_sent_at timestamptz,
  add column if not exists stripe_event_id text;

create unique index if not exists compass_enrolments_stripe_payment_intent_uidx
  on public.compass_enrolments (stripe_payment_intent)
  where stripe_payment_intent is not null;

create unique index if not exists compass_enrolments_stripe_checkout_session_uidx
  on public.compass_enrolments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create or replace function public.compass_paid_count(p_cohort_id text)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.compass_enrolments
  where cohort_id = p_cohort_id
    and status = 'paid';
$$;

/**
 * Atomically mark a pending COMPASS enrolment as paid when capacity remains.
 * Returns jsonb: { ok, idempotent?, error?, enrolment? }
 */
create or replace function public.mark_compass_enrolment_paid(
  p_enrolment_id uuid,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent text,
  p_stripe_event_id text default null,
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
    update public.compass_enrolments
    set
      status = 'payment_exception',
      stripe_checkout_session_id = coalesce(p_stripe_checkout_session_id, stripe_checkout_session_id),
      stripe_payment_intent = coalesce(p_stripe_payment_intent, stripe_payment_intent),
      stripe_event_id = coalesce(p_stripe_event_id, stripe_event_id),
      admin_notes = trim(both from concat_ws(
        E'\n',
        nullif(admin_notes, ''),
        'Capacity exceeded at payment time (max ' || p_max_paid || ' paid enrolments).'
      ))
    where id = p_enrolment_id
    returning * into v_row;

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
    stripe_checkout_session_id = p_stripe_checkout_session_id,
    stripe_payment_intent = p_stripe_payment_intent,
    stripe_event_id = p_stripe_event_id
  where id = p_enrolment_id
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'enrolment', to_jsonb(v_row)
  );
end;
$$;

revoke all on function public.mark_compass_enrolment_paid(uuid, text, text, text, integer) from public;
revoke all on function public.mark_compass_enrolment_paid(uuid, text, text, text, integer) from anon;
revoke all on function public.mark_compass_enrolment_paid(uuid, text, text, text, integer) from authenticated;
grant execute on function public.mark_compass_enrolment_paid(uuid, text, text, text, integer) to service_role;

revoke all on function public.compass_paid_count(text) from public;
revoke all on function public.compass_paid_count(text) from anon;
revoke all on function public.compass_paid_count(text) from authenticated;
grant execute on function public.compass_paid_count(text) to service_role;
