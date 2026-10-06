-- Studio test-mode webhook effects are committed with their event record.
-- Apply only to the isolated Studio staging database until the release gate passes.
alter table public.studio_entitlements
  add column if not exists last_subscription_event_at bigint,
  add column if not exists last_subscription_event_kind text,
  add column if not exists last_invoice_event_at bigint;

update public.studio_entitlements
  set last_subscription_event_at = extract(epoch from updated_at)::bigint,
      last_subscription_event_kind = 'customer.subscription.updated'
  where stripe_subscription_id is not null and manual_grant = false
    and last_subscription_event_at is null;

alter table public.studio_billing_events
  add column if not exists effect jsonb not null default '{}'::jsonb;

create table if not exists public.studio_paid_invoices (
  stripe_invoice_id text primary key,
  stripe_subscription_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_event_id text not null,
  created_at timestamptz not null default now()
);
alter table public.studio_paid_invoices enable row level security;
revoke all on public.studio_paid_invoices from public, anon, authenticated;
grant select, insert on public.studio_paid_invoices to service_role;

-- The earlier webhook incremented the entitlement before recording an audit row.
-- Backfill known invoice IDs so a later delivery cannot count one of them again.
insert into public.studio_paid_invoices (stripe_invoice_id, stripe_subscription_id, user_id, stripe_event_id)
select distinct on (a.detail->>'invoice_id')
  a.detail->>'invoice_id', e.stripe_subscription_id, a.user_id, a.detail->>'stripe_event_id'
from public.studio_entitlement_audit a
join public.studio_entitlements e on e.user_id = a.user_id
where a.action = 'invoice_paid'
  and nullif(a.detail->>'invoice_id', '') is not null
  and nullif(a.detail->>'stripe_event_id', '') is not null
  and nullif(e.stripe_subscription_id, '') is not null
order by a.detail->>'invoice_id', a.created_at
on conflict (stripe_invoice_id) do nothing;

create or replace function public.studio_apply_test_billing_event(payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  kind text := payload->>'type';
  event_id text := payload->>'event_id';
  object_id text := payload->>'object_id';
  event_time bigint := nullif(payload->>'event_created', '')::bigint;
  owner_id uuid;
  plan text := payload->>'plan_code';
  sub_id text := payload->>'subscription_id';
  invoice_id text := payload->>'invoice_id';
  reservation_id uuid;
  plan_payments integer;
  previous public.studio_billing_events%rowtype;
  account public.studio_entitlements%rowtype;
  place public.studio_checkout_reservations%rowtype;
  new_payment boolean;
  new_event boolean;
  incoming_rank integer;
  previous_rank integer;
  final_count integer;
  circle_done boolean := false;
  event_effect jsonb := '{}'::jsonb;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Studio billing service role required';
  end if;
  if coalesce(event_id, '') = '' or coalesce(object_id, '') = '' or event_time is null
     or coalesce(payload->>'livemode', '') <> 'false' then
    raise exception 'Invalid Studio test billing event';
  end if;

  insert into public.studio_billing_events (stripe_event_id, event_type, object_id, livemode)
    values (event_id, kind, object_id, false)
    on conflict (stripe_event_id) do nothing;
  new_event := found;
  select * into previous from public.studio_billing_events
    where stripe_event_id = event_id for update;
  if previous.outcome in ('completed', 'ignored') then
    return previous.effect || jsonb_build_object('duplicate', true, 'outcome', previous.outcome);
  end if;
  -- Earlier non-atomic failures may have written some effects. Reconcile those
  -- separately instead of applying an unknown portion a second time.
  if not new_event then
    raise exception 'Legacy failed Studio billing event requires reconciliation';
  end if;

  if kind not in ('checkout.session.completed', 'customer.subscription.created',
                  'customer.subscription.updated', 'customer.subscription.deleted',
                  'invoice.paid', 'invoice.payment_failed') then
    update public.studio_billing_events set outcome = 'ignored', processed_at = now()
      where stripe_event_id = event_id;
    return jsonb_build_object('outcome', 'ignored');
  end if;

  if coalesce(payload->>'user_id', '') <> '' then owner_id := (payload->>'user_id')::uuid; end if;
  if kind like 'invoice.%' then
    if coalesce(sub_id, '') = '' or coalesce(invoice_id, '') = '' then
      raise exception 'Studio invoice is missing its subscription or invoice ID';
    end if;
    select * into account from public.studio_entitlements
      where stripe_subscription_id = sub_id for update;
    if not found then raise exception 'Studio invoice entitlement is not yet available'; end if;
    owner_id := account.user_id;
    plan := account.plan_code;
  else
    if owner_id is null or coalesce(plan, '') not in ('studio', 'circle', 'private')
       or coalesce(sub_id, '') = '' then
      raise exception 'Studio subscription or checkout metadata is incomplete';
    end if;
  end if;

  if kind = 'checkout.session.completed' then
    if coalesce(payload->>'reservation_id', '') = '' then
      raise exception 'Checkout reservation ID is missing';
    end if;
    reservation_id := (payload->>'reservation_id')::uuid;
    select * into place from public.studio_checkout_reservations
      where id = reservation_id and user_id = owner_id and plan_code = plan for update;
    if not found or (place.stripe_checkout_session_id is not null
      and place.stripe_checkout_session_id <> object_id) then
      raise exception 'Checkout reservation does not match the paid session';
    end if;
    update public.studio_checkout_reservations
      set status = 'completed', stripe_checkout_session_id = object_id
      where id = reservation_id;
    insert into public.studio_entitlements
      (user_id, plan_code, status, access_mode, stripe_customer_id,
       stripe_subscription_id, stripe_price_id, minimum_payments, manual_grant)
      values (owner_id, plan, 'active', 'write', payload->>'customer_id',
        sub_id, payload->>'price_id', (payload->>'minimum_payments')::integer, false)
      on conflict (user_id) do update set
        stripe_customer_id = coalesce(public.studio_entitlements.stripe_customer_id, excluded.stripe_customer_id),
        stripe_subscription_id = coalesce(public.studio_entitlements.stripe_subscription_id, excluded.stripe_subscription_id)
      where public.studio_entitlements.plan_code = excluded.plan_code
        and (public.studio_entitlements.stripe_subscription_id is null
          or public.studio_entitlements.stripe_subscription_id = excluded.stripe_subscription_id);
    if not found then raise exception 'Checkout conflicts with another Studio subscription'; end if;
    insert into public.studio_entitlement_audit (user_id, action, plan_code, detail)
      values (owner_id, 'checkout_completed', plan,
        jsonb_build_object('stripe_event_id', event_id, 'stripe_session_id', object_id));
    insert into public.studio_analytics_events (event_name, user_id, plan_code, source)
      values ('purchase', owner_id, plan, 'stripe_test_webhook');

  elsif kind like 'customer.subscription.%' then
    if payload->>'status' not in ('incomplete','trialing','active','past_due','unpaid','canceled','expired')
       or payload->>'access_mode' not in ('write','read_only','none') then
      raise exception 'Invalid Studio subscription status';
    end if;
    select * into account from public.studio_entitlements where user_id = owner_id for update;
    if found and account.stripe_subscription_id is not null
       and account.stripe_subscription_id <> sub_id then
      raise exception 'Subscription event conflicts with another Studio subscription';
    end if;
    incoming_rank := case kind when 'customer.subscription.deleted' then 3
      when 'customer.subscription.updated' then 2 else 1 end;
    previous_rank := case account.last_subscription_event_kind
      when 'customer.subscription.deleted' then 3
      when 'customer.subscription.updated' then 2 else 1 end;
    if not found or account.last_subscription_event_at is null
       or event_time > account.last_subscription_event_at
       or (event_time = account.last_subscription_event_at and incoming_rank > previous_rank) then
      insert into public.studio_entitlements
        (user_id, plan_code, status, access_mode, stripe_customer_id, stripe_subscription_id,
         stripe_price_id, current_period_end, read_only_until, minimum_payments,
         manual_grant, last_subscription_event_at, last_subscription_event_kind)
        values (owner_id, plan, payload->>'status', payload->>'access_mode',
          payload->>'customer_id', sub_id, payload->>'price_id',
          nullif(payload->>'period_end', '')::timestamptz,
          nullif(payload->>'read_only_until', '')::timestamptz,
          (payload->>'minimum_payments')::integer, false, event_time, kind)
        on conflict (user_id) do update set
          plan_code = excluded.plan_code, status = excluded.status,
          access_mode = excluded.access_mode,
          stripe_customer_id = excluded.stripe_customer_id,
          stripe_subscription_id = excluded.stripe_subscription_id,
          stripe_price_id = excluded.stripe_price_id,
          current_period_end = excluded.current_period_end,
          read_only_until = excluded.read_only_until,
          minimum_payments = excluded.minimum_payments,
          manual_grant = false,
          last_subscription_event_at = excluded.last_subscription_event_at,
          last_subscription_event_kind = excluded.last_subscription_event_kind;
      insert into public.studio_entitlement_audit (user_id, action, plan_code, detail)
        values (owner_id, kind, plan,
          jsonb_build_object('stripe_event_id', event_id, 'status', payload->>'status'));
    end if;

  elsif kind = 'invoice.paid' then
    insert into public.studio_paid_invoices
      (stripe_invoice_id, stripe_subscription_id, user_id, stripe_event_id)
      values (invoice_id, sub_id, owner_id, event_id)
      on conflict (stripe_invoice_id) do nothing;
    new_payment := found;
    if new_payment then
      final_count := account.paid_invoice_count + 1;
      update public.studio_entitlements
        set paid_invoice_count = final_count,
            status = case when status in ('canceled','expired')
              or (last_invoice_event_at is not null and event_time < last_invoice_event_at)
              then status else 'active' end,
            access_mode = case when status in ('canceled','expired')
              or (last_invoice_event_at is not null and event_time < last_invoice_event_at)
              then access_mode else 'write' end,
            last_invoice_event_at = greatest(coalesce(last_invoice_event_at, 0), event_time)
        where user_id = owner_id;
      insert into public.studio_entitlement_audit (user_id, action, plan_code, detail)
        values (owner_id, 'invoice_paid', plan,
          jsonb_build_object('stripe_event_id', event_id, 'invoice_id', invoice_id,
            'paid_invoice_count', final_count));
      plan_payments := account.minimum_payments;
      circle_done := plan = 'circle' and final_count >= plan_payments;
    end if;
    -- A second event for the same invoice still requests the scheduled end if
    -- an earlier attempt committed the payment but Stripe cancellation failed.
    if plan = 'circle' and (select paid_invoice_count from public.studio_entitlements
      where user_id = owner_id) >= account.minimum_payments then
      circle_done := true;
    end if;
    event_effect := jsonb_build_object('cancel_circle', circle_done, 'subscription_id', sub_id);

  elsif kind = 'invoice.payment_failed' then
    if not exists (select 1 from public.studio_paid_invoices
      where stripe_invoice_id = invoice_id)
      and (account.last_invoice_event_at is null or event_time >= account.last_invoice_event_at)
      and account.status not in ('canceled','expired') then
      update public.studio_entitlements
        set status = 'past_due', access_mode = 'read_only', read_only_until = null,
            last_invoice_event_at = event_time where user_id = owner_id;
      insert into public.studio_entitlement_audit (user_id, action, plan_code, detail)
        values (owner_id, 'invoice_payment_failed', plan,
          jsonb_build_object('stripe_event_id', event_id, 'invoice_id', invoice_id));
    end if;
  end if;

  update public.studio_billing_events
    set outcome = 'completed', effect = event_effect, processed_at = now(), error_message = null
    where stripe_event_id = event_id;
  return event_effect || jsonb_build_object('outcome', 'completed', 'duplicate', false);
end;
$$;

revoke all on function public.studio_apply_test_billing_event(jsonb) from public, anon, authenticated;
grant execute on function public.studio_apply_test_billing_event(jsonb) to service_role;
