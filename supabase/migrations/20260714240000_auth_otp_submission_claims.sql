-- Atomic OTP submission claims for Practice Commons magic-link / signup emails.
-- Server-only via service_role RPC. Suppresses duplicate /auth/register handler
-- invocations that share the same client submission_id.
--
-- Stored columns are only: submission_id, auth_mode, status, timestamps.
-- No email address, token, IP address, user agent, or other personal data.

create table if not exists public.auth_otp_submission_claims (
  submission_id uuid primary key,
  auth_mode text not null
    check (auth_mode in ('join', 'sign-in', 'resend', 'account-sign-in-link')),
  status text not null default 'claimed'
    check (status in ('claimed', 'completed', 'failed')),
  claimed_at timestamptz not null default (pg_catalog.now()),
  completed_at timestamptz,
  expires_at timestamptz not null default (pg_catalog.now() + interval '10 minutes')
);

create index if not exists auth_otp_submission_claims_expires_at_idx
  on public.auth_otp_submission_claims (expires_at);

alter table public.auth_otp_submission_claims enable row level security;
alter table public.auth_otp_submission_claims force row level security;

revoke all on table public.auth_otp_submission_claims from public;
revoke all on table public.auth_otp_submission_claims from anon;
revoke all on table public.auth_otp_submission_claims from authenticated;
revoke all on table public.auth_otp_submission_claims from service_role;

-- No direct table DML for callers. Expired-row cleanup and status updates
-- happen only inside the security-definer RPCs below.

create or replace function public.claim_auth_otp_submission(
  p_submission_id uuid,
  p_auth_mode text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_id uuid;
begin
  if p_auth_mode is null or p_auth_mode not in ('join', 'sign-in', 'resend', 'account-sign-in-link') then
    raise exception 'invalid auth_mode';
  end if;

  -- Single-statement claim: remove expired row for this UUID (if any), then
  -- insert. Concurrent callers share the primary key; only one acquires.
  with expired as (
    delete from public.auth_otp_submission_claims
    where public.auth_otp_submission_claims.submission_id = p_submission_id
      and public.auth_otp_submission_claims.expires_at < pg_catalog.now()
    returning submission_id
  )
  insert into public.auth_otp_submission_claims (
    submission_id,
    auth_mode,
    status,
    claimed_at,
    completed_at,
    expires_at
  )
  values (
    p_submission_id,
    p_auth_mode,
    'claimed',
    pg_catalog.now(),
    null,
    pg_catalog.now() + interval '10 minutes'
  )
  on conflict (submission_id) do nothing
  returning submission_id into inserted_id;

  if inserted_id is not null then
    return 'acquired';
  end if;

  return 'duplicate';
end;
$$;

revoke all on function public.claim_auth_otp_submission(uuid, text) from public;
revoke all on function public.claim_auth_otp_submission(uuid, text) from anon;
revoke all on function public.claim_auth_otp_submission(uuid, text) from authenticated;
grant execute on function public.claim_auth_otp_submission(uuid, text) to service_role;

create or replace function public.finalize_auth_otp_submission(
  p_submission_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status is null or p_status not in ('completed', 'failed') then
    raise exception 'invalid status';
  end if;

  -- Never delete. Failed and completed claims remain until expires_at so the
  -- same submission_id cannot call signInWithOtp again while the claim exists.
  update public.auth_otp_submission_claims
  set
    status = p_status,
    completed_at = case
      when p_status = 'completed' then pg_catalog.now()
      else public.auth_otp_submission_claims.completed_at
    end
  where public.auth_otp_submission_claims.submission_id = p_submission_id
    and public.auth_otp_submission_claims.status = 'claimed';
end;
$$;

revoke all on function public.finalize_auth_otp_submission(uuid, text) from public;
revoke all on function public.finalize_auth_otp_submission(uuid, text) from anon;
revoke all on function public.finalize_auth_otp_submission(uuid, text) from authenticated;
grant execute on function public.finalize_auth_otp_submission(uuid, text) to service_role;
