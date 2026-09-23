import type { APIRoute } from "astro";
import Stripe from "stripe";
import { json } from "../../../../lib/community/api";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { accessModeForSubscriptionStatus, assertStripeTestMode, entitlementStatusForSubscription, isStudioPlanCode, STUDIO_PLANS, studioStripeTestConfig } from "../../../../lib/studio/billing";

export const prerender = false;

function subscriptionId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) return String((value as { id: unknown }).id);
  return "";
}

export const POST: APIRoute = async ({ request, locals }) => {
  const config = studioStripeTestConfig(locals);
  if (!config.webhookSecret) return json({ ok: false, error: "Studio test webhook is not configured." }, 503);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ ok: false, error: "Missing Stripe signature." }, 400);
  const stripe = new Stripe("sk_test_placeholder_for_signature_verification");
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await request.text(), signature, config.webhookSecret);
  } catch {
    return json({ ok: false, error: "Invalid Stripe signature." }, 400);
  }
  if (event.livemode) return json({ ok: false, error: "Live Stripe events are not accepted by the Studio test endpoint." }, 400);
  const service = createCommunityServiceClient(locals);
  const object = event.data.object as { id?: string };
  const { error: eventError } = await service.from("studio_billing_events").insert({ stripe_event_id: event.id, event_type: event.type, object_id: object.id ?? null, livemode: false });
  if (eventError?.code === "23505") {
    const { data: previous, error: lookupError } = await service.from("studio_billing_events")
      .select("outcome").eq("stripe_event_id", event.id).maybeSingle();
    if (lookupError || !previous) return json({ ok: false, error: "Billing event status could not be verified." }, 500);
    if (previous.outcome === "completed" || previous.outcome === "ignored") return json({ ok: true, idempotent: true });
    // Partial writes need reconciliation before replay; never acknowledge them as complete.
    return json({ ok: false, error: "Billing event requires reconciliation before replay." }, 500);
  }
  if (eventError) return json({ ok: false, error: "Billing event could not be recorded." }, 500);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.studio_user_id ?? "";
      const planCode = session.metadata?.studio_plan_code;
      const reservationId = session.metadata?.studio_reservation_id ?? session.client_reference_id ?? "";
      if (!userId || !isStudioPlanCode(planCode) || session.mode !== "subscription") throw new Error("Checkout metadata is incomplete.");
      const { error: entitlementError } = await service.from("studio_entitlements").upsert({
        user_id: userId,
        plan_code: planCode,
        status: "active",
        access_mode: "write",
        stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
        stripe_subscription_id: subscriptionId(session.subscription),
        stripe_price_id: config.prices[planCode],
        minimum_payments: STUDIO_PLANS[planCode].minimumPayments,
        manual_grant: false,
      }, { onConflict: "user_id" });
      if (entitlementError) throw entitlementError;
      const { data: reservation, error: reservationError } = await service.from("studio_checkout_reservations")
        .update({ status: "completed", stripe_checkout_session_id: session.id })
        .eq("id", reservationId).eq("user_id", userId).eq("plan_code", planCode)
        .select("id").maybeSingle();
      if (reservationError) throw reservationError;
      if (!reservation) throw new Error("Checkout reservation was not found for this session.");
      const { error: auditError } = await service.from("studio_entitlement_audit").insert({ user_id: userId, action: "checkout_completed", plan_code: planCode, detail: { stripe_event_id: event.id, stripe_session_id: session.id } });
      if (auditError) throw auditError;
      const { error: analyticsError } = await service.from("studio_analytics_events").insert({ event_name: "purchase", user_id: userId, plan_code: planCode, source: "stripe_test_webhook" });
      if (analyticsError) throw analyticsError;
    } else if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.studio_user_id ?? "";
      const planCode = subscription.metadata?.studio_plan_code;
      if (!userId || !isStudioPlanCode(planCode)) throw new Error("Subscription metadata is incomplete.");
      const status = entitlementStatusForSubscription(event.type === "customer.subscription.deleted" ? "canceled" : subscription.status);
      const accessMode = accessModeForSubscriptionStatus(status);
      const periodEnd = (subscription.items.data[0] as Stripe.SubscriptionItem | undefined)?.current_period_end;
      const readOnlyUntil = accessMode === "read_only" && periodEnd
        ? new Date((periodEnd + config.readOnlyRetentionDays * 86400) * 1000).toISOString()
        : null;
      const { error: entitlementError } = await service.from("studio_entitlements").upsert({
        user_id: userId,
        plan_code: planCode,
        status,
        access_mode: accessMode,
        stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : null,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id ?? null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        read_only_until: readOnlyUntil,
        minimum_payments: Number(subscription.metadata?.minimum_payments ?? STUDIO_PLANS[planCode].minimumPayments),
        manual_grant: false,
      }, { onConflict: "user_id" });
      if (entitlementError) throw entitlementError;
      const { error: auditError } = await service.from("studio_entitlement_audit").insert({ user_id: userId, action: event.type, plan_code: planCode, detail: { stripe_event_id: event.id, status } });
      if (auditError) throw auditError;
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = subscriptionId(invoice.parent?.subscription_details?.subscription);
      if (subId) {
        if (event.type === "invoice.paid") {
          const { data: entitlement, error: lookupError } = await service.from("studio_entitlements").select("user_id, plan_code, paid_invoice_count").eq("stripe_subscription_id", subId).maybeSingle();
          if (lookupError) throw lookupError;
          if (entitlement) {
            const paidInvoiceCount = Number(entitlement.paid_invoice_count ?? 0) + 1;
            const completesCircle = entitlement.plan_code === "circle" && paidInvoiceCount >= STUDIO_PLANS.circle.minimumPayments;
            if (completesCircle) {
              assertStripeTestMode(config.secretKey);
              await new Stripe(config.secretKey).subscriptions.update(subId, { cancel_at_period_end: true });
            }
            const { error: updateError } = await service.from("studio_entitlements").update({ status: "active", access_mode: "write", paid_invoice_count: paidInvoiceCount }).eq("user_id", entitlement.user_id);
            if (updateError) throw updateError;
            const { error: auditError } = await service.from("studio_entitlement_audit").insert({ user_id: entitlement.user_id, action: "invoice_paid", plan_code: entitlement.plan_code, detail: { stripe_event_id: event.id, invoice_id: invoice.id, paid_invoice_count: paidInvoiceCount, cancel_at_period_end: completesCircle } });
            if (auditError) throw auditError;
          }
        } else {
          const { data: entitlement, error: lookupError } = await service.from("studio_entitlements").select("user_id, plan_code").eq("stripe_subscription_id", subId).maybeSingle();
          if (lookupError) throw lookupError;
          if (entitlement) {
            const { error: updateError } = await service.from("studio_entitlements").update({ status: "past_due", access_mode: "read_only", read_only_until: null }).eq("user_id", entitlement.user_id);
            if (updateError) throw updateError;
            const { error: auditError } = await service.from("studio_entitlement_audit").insert({ user_id: entitlement.user_id, action: "invoice_payment_failed", plan_code: entitlement.plan_code, detail: { stripe_event_id: event.id, invoice_id: invoice.id } });
            if (auditError) throw auditError;
          }
        }
      }
    }
    const { error: completionError } = await service.from("studio_billing_events")
      .update({ outcome: "completed", processed_at: new Date().toISOString() }).eq("stripe_event_id", event.id);
    if (completionError) throw completionError;
    return json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Studio billing error.";
    await service.from("studio_billing_events").update({ outcome: "failed", error_message: message, processed_at: new Date().toISOString() }).eq("stripe_event_id", event.id);
    console.error("Studio test webhook failed:", { eventId: event.id, eventType: event.type, message });
    return json({ ok: false, error: "Studio billing event failed." }, 500);
  }
};
