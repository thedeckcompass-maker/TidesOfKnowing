-- Server-only Stripe test webhook and billing operations. Row level security
-- still governs authenticated creator access; service_role bypasses RLS as intended.
-- Apply in the isolated Studio staging project before retrying failed sandbox events.
grant select, insert, update on
  public.studio_billing_events,
  public.studio_entitlements,
  public.studio_checkout_reservations,
  public.studio_entitlement_audit,
  public.studio_analytics_events
to service_role;
