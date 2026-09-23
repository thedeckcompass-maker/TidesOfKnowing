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
  const verifier = new Stripe("sk_test_placeholder_for_signature_verification");
  let event: Stripe.Event;
  try {
    event = await verifier.webhooks.constructEventAsync(await request.text(), signature, config.webhookSecret);
  } catch {
    return json({ ok: false, error: "Invalid Stripe signature." }, 400);
  }
  if (event.livemode) return json({ ok: false, error: "Live Stripe events are not accepted by the Studio test endpoint." }, 400);

  const object = event.data.object as { id?: string };
  const payload: Record<string, string | number | boolean | null> = {
    event_id: event.id,
    type: event.type,
    object_id: object.id ?? "",
    event_created: event.created,
    livemode: event.livemode,
  };
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "subscription" || !isStudioPlanCode(session.metadata?.studio_plan_code)) {
      return json({ ok: false, error: "Studio checkout metadata is incomplete." }, 500);
    }
    const plan = session.metadata.studio_plan_code;
    Object.assign(payload, {
      user_id: session.metadata.studio_user_id ?? "",
      plan_code: plan,
      reservation_id: session.metadata.studio_reservation_id ?? session.client_reference_id ?? "",
      subscription_id: subscriptionId(session.subscription),
      customer_id: subscriptionId(session.customer),
      price_id: config.prices[plan],
      minimum_payments: STUDIO_PLANS[plan].minimumPayments,
    });
  } else if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const subscription = event.data.object as Stripe.Subscription;
    if (!isStudioPlanCode(subscription.metadata?.studio_plan_code)) {
      return json({ ok: false, error: "Studio subscription metadata is incomplete." }, 500);
    }
    const plan = subscription.metadata.studio_plan_code;
    const priceId = subscription.items.data[0]?.price.id;
    if (priceId && priceId !== config.prices[plan]) {
      return json({ ok: false, error: "Studio subscription price does not match its plan." }, 500);
    }
    const status = entitlementStatusForSubscription(event.type === "customer.subscription.deleted" ? "canceled" : subscription.status);
    const accessMode = accessModeForSubscriptionStatus(status);
    const periodEnd = (subscription.items.data[0] as Stripe.SubscriptionItem | undefined)?.current_period_end;
    Object.assign(payload, {
      user_id: subscription.metadata.studio_user_id ?? "",
      plan_code: plan,
      subscription_id: subscription.id,
      customer_id: subscriptionId(subscription.customer),
      price_id: priceId ?? "",
      status,
      access_mode: accessMode,
      period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      read_only_until: accessMode === "read_only" && periodEnd
        ? new Date((periodEnd + config.readOnlyRetentionDays * 86400) * 1000).toISOString() : null,
      minimum_payments: Number(subscription.metadata.minimum_payments ?? STUDIO_PLANS[plan].minimumPayments),
    });
  } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    Object.assign(payload, {
      invoice_id: invoice.id,
      subscription_id: subscriptionId(invoice.parent?.subscription_details?.subscription),
    });
  }

  const service = createCommunityServiceClient(locals);
  const { data, error } = await service.rpc("studio_apply_test_billing_event", { payload });
  if (error || !data || typeof data !== "object" || data.outcome === undefined) {
    console.error("Studio test billing transaction failed:", { eventId: event.id, eventType: event.type, message: error?.message ?? "Missing outcome" });
    return json({ ok: false, error: "Studio billing event failed." }, 500);
  }

  // The database event and payment count are already committed. A retry repeats
  // only this idempotent Stripe action, never the invoice accounting effect.
  if (data.cancel_circle === true) {
    try {
      assertStripeTestMode(config.secretKey);
      await new Stripe(config.secretKey).subscriptions.update(String(data.subscription_id),
        { cancel_at_period_end: true });
    } catch (error) {
      console.error("Studio Circle scheduled end failed:", { eventId: event.id, message: error instanceof Error ? error.message : "Unknown error" });
      return json({ ok: false, error: "Studio Circle scheduled end is pending." }, 500);
    }
  }
  return json({ ok: true, idempotent: data.duplicate === true });
};
