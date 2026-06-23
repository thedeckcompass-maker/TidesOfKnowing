import type { APIRoute } from "astro";
import Stripe from "stripe";
import { json } from "../../../lib/community/api";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import { notifyAskLeiliaPaymentCompleted } from "../../../lib/ask-leilia/notifications";

export const prerender = false;

function stripeWebhookSecret(locals?: unknown): string {
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string | undefined> } } | undefined)
    ?.runtime?.env;
  return (
    runtimeEnv?.STRIPE_WEBHOOK_SECRET ??
    (import.meta.env.STRIPE_WEBHOOK_SECRET as string | undefined) ??
    ""
  );
}

export const POST: APIRoute = async ({ request, locals }) => {
  const secret = stripeWebhookSecret(locals);
  if (!secret) {
    return json({ ok: false, error: "Stripe webhook secret is not configured." }, 500);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return json({ ok: false, error: "Missing Stripe signature." }, 400);
  }

  const stripe = new Stripe("sk_placeholder_not_used_for_webhook_verification");
  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return json({ ok: false, error: "Invalid Stripe signature." }, 400);
  }

  if (event.type !== "checkout.session.completed") {
    return json({ ok: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : session.id;
  const customerId = typeof session.customer === "string" ? session.customer : null;
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? "";

  if (!customerEmail) {
    console.error("Stripe checkout session completed without customer email", {
      sessionId: session.id,
    });
    return json({ ok: false, error: "Missing customer email." }, 400);
  }

  const amount = session.amount_total ?? 0;
  const currency = session.currency ?? "usd";
  const paymentStatus = session.payment_status ?? "paid";
  const service = createCommunityServiceClient(locals);

  const { error } = await service.from("ask_leilia_payments").upsert(
    {
      stripe_payment_intent: paymentIntent,
      stripe_customer_id: customerId,
      customer_email: customerEmail.toLowerCase(),
      amount,
      currency,
      payment_status: paymentStatus,
      stripe_metadata: {
        checkout_session_id: session.id,
        payment_link: typeof session.payment_link === "string" ? session.payment_link : null,
        metadata: session.metadata ?? {},
      },
    },
    { onConflict: "stripe_payment_intent" },
  );

  if (error) {
    console.error("Unable to store Ask Leilia payment:", error);
    return json({ ok: false, error: "Unable to store payment." }, 500);
  }

  await notifyAskLeiliaPaymentCompleted(
    {
      customerEmail,
      amount,
      currency,
      paymentIntent,
    },
    locals,
  );

  return json({ ok: true });
};
