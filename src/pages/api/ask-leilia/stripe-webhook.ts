import type { APIRoute } from "astro";
import Stripe from "stripe";
import { json } from "../../../lib/community/api";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import {
  notifyAskLeiliaPaymentCompleted,
  notifyAskLeiliaPaymentException,
} from "../../../lib/ask-leilia/notifications";
import { expectedPaymentCents, paymentAmountMatches } from "../../../lib/ask-leilia/paymentAmounts";
import { isAskLeiliaDbReadingType } from "../../../lib/ask-leilia/readingTypes";
import type { AskLeiliaCardPreference } from "../../../lib/ask-leilia/types";

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

function requestIdFromSession(session: Stripe.Checkout.Session): string {
  const metadataRequestId = session.metadata?.ask_leilia_request_id;
  if (metadataRequestId) return metadataRequestId;
  return session.client_reference_id ?? "";
}

type LinkedRequestRow = {
  id: string;
  name: string;
  email: string;
  question: string;
  context: string | null;
  card_preference: AskLeiliaCardPreference;
  image_url: string | null;
  reading_type: string;
  status: string;
};

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

  const { data: paymentRecord, error } = await service
    .from("ask_leilia_payments")
    .upsert(
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
    )
    .select("id")
    .single();

  if (error || !paymentRecord) {
    console.error("Unable to store Ask Leilia payment:", error);
    return json({ ok: false, error: "Unable to store payment." }, 500);
  }

  const askLeiliaRequestId = requestIdFromSession(session);
  let linkedRequest: LinkedRequestRow | null = null;

  if (askLeiliaRequestId) {
    const { data: pendingRequest, error: pendingError } = await service
      .from("ask_leilia_requests")
      .select(
        "id, name, email, question, context, card_preference, image_url, reading_type, status",
      )
      .eq("id", askLeiliaRequestId)
      .maybeSingle();

    if (pendingError || !pendingRequest) {
      console.error("Unable to load Ask Leilia request for payment linking:", {
        error: pendingError,
        askLeiliaRequestId,
        paymentIntent,
      });
      return json({ ok: false, error: "Unable to link paid request." }, 500);
    }

    const requestRow = pendingRequest as LinkedRequestRow;
    if (!isAskLeiliaDbReadingType(requestRow.reading_type)) {
      console.error("Ask Leilia request has invalid reading_type:", {
        askLeiliaRequestId,
        readingType: requestRow.reading_type,
      });
      return json({ ok: false, error: "Unable to validate reading type." }, 500);
    }

    const expectedAmount = expectedPaymentCents(requestRow.reading_type);
    const amountMatches = paymentAmountMatches(requestRow.reading_type, amount, currency);

    if (amountMatches) {
      const { data: requestRecord, error: requestError } = await service
        .from("ask_leilia_requests")
        .update({
          payment_id: (paymentRecord as { id: string }).id,
          status: "Paid",
          payment_expected_amount: null,
          payment_actual_amount: null,
          payment_exception_reference: null,
        })
        .eq("id", askLeiliaRequestId)
        .select(
          "id, name, email, question, context, card_preference, image_url, reading_type, status",
        )
        .maybeSingle();

      if (requestError || !requestRecord) {
        console.error("Unable to link paid Ask Leilia request:", {
          error: requestError,
          askLeiliaRequestId,
          paymentIntent,
        });
        return json({ ok: false, error: "Unable to link paid request." }, 500);
      }

      linkedRequest = requestRecord as LinkedRequestRow;

      await notifyAskLeiliaPaymentCompleted(
        {
          customerEmail,
          amount,
          currency,
          paymentIntent,
          request: {
            id: linkedRequest.id,
            name: linkedRequest.name,
            email: linkedRequest.email,
            question: linkedRequest.question,
            context: linkedRequest.context,
            cardPreference: linkedRequest.card_preference,
            imageUrl: linkedRequest.image_url,
            readingType: requestRow.reading_type,
          },
        },
        locals,
      );
    } else {
      const { data: requestRecord, error: requestError } = await service
        .from("ask_leilia_requests")
        .update({
          payment_id: (paymentRecord as { id: string }).id,
          status: "Payment Exception",
          payment_expected_amount: expectedAmount,
          payment_actual_amount: amount,
          payment_exception_reference: paymentIntent,
        })
        .eq("id", askLeiliaRequestId)
        .select(
          "id, name, email, question, context, card_preference, image_url, reading_type, status",
        )
        .maybeSingle();

      if (requestError || !requestRecord) {
        console.error("Unable to record Ask Leilia payment exception:", {
          error: requestError,
          askLeiliaRequestId,
          paymentIntent,
        });
        return json({ ok: false, error: "Unable to record payment exception." }, 500);
      }

      linkedRequest = requestRecord as LinkedRequestRow;

      await notifyAskLeiliaPaymentException(
        {
          requestId: linkedRequest.id,
          customerName: linkedRequest.name,
          customerEmail: linkedRequest.email,
          readingType: requestRow.reading_type,
          expectedAmountCents: expectedAmount,
          actualAmountCents: amount,
          currency,
          paymentReference: paymentIntent,
        },
        locals,
      );
    }
  } else {
    await notifyAskLeiliaPaymentCompleted(
      {
        customerEmail,
        amount,
        currency,
        paymentIntent,
        request: null,
      },
      locals,
    );
  }

  return json({ ok: true });
};
