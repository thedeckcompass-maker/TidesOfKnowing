import type { APIRoute } from "astro";
import Stripe from "stripe";
import { json } from "../../../lib/community/api";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import {
  notifyAskLeiliaPaymentCompleted,
  notifyAskLeiliaPaymentException,
  sendAskLeiliaCustomerPaymentConfirmation,
} from "../../../lib/ask-leilia/notifications";
import { expectedPaymentCents, paymentAmountMatches } from "../../../lib/ask-leilia/paymentAmounts";
import { logAskLeiliaPipeline } from "../../../lib/ask-leilia/pipelineLog";
import { isAskLeiliaDbReadingType, type AskLeiliaDbReadingType } from "../../../lib/ask-leilia/readingTypes";
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
  logAskLeiliaPipeline("WEBHOOK_RECEIVED");

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

  logAskLeiliaPipeline("WEBHOOK_SIGNATURE_VERIFIED", {
    stripeEventId: event.id,
    stripeEventType: event.type,
  });

  if (event.type !== "checkout.session.completed") {
    logAskLeiliaPipeline("WEBHOOK_COMPLETE", {
      stripeEventId: event.id,
      stripeEventType: event.type,
    });
    return json({ ok: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : session.id;
  const customerId = typeof session.customer === "string" ? session.customer : null;
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? "";

  const baseFields = {
    stripeSessionId: session.id,
    paymentIntent,
    customerEmail: customerEmail || undefined,
    stripeEventId: event.id,
    stripeEventType: event.type,
  };

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
    logAskLeiliaPipeline("PAYMENT_UPSERT_FAILURE", {
      ...baseFields,
      paymentAmount: amount,
      currency,
      error: error?.message ?? "Unable to store payment.",
    });
    console.error("Unable to store Ask Leilia payment:", error);
    return json({ ok: false, error: "Unable to store payment." }, 500);
  }

  logAskLeiliaPipeline("PAYMENT_UPSERT_SUCCESS", {
    ...baseFields,
    paymentId: (paymentRecord as { id: string }).id,
    paymentAmount: amount,
    currency,
  });

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
      logAskLeiliaPipeline("REQUEST_LINK_FAILURE", {
        ...baseFields,
        requestId: askLeiliaRequestId,
        paymentAmount: amount,
        currency,
        error: pendingError?.message ?? "Request not found.",
      });
      console.error("Unable to load Ask Leilia request for payment linking:", {
        error: pendingError,
        askLeiliaRequestId,
        paymentIntent,
      });
      return json({ ok: false, error: "Unable to link paid request." }, 500);
    }

    const requestRow = pendingRequest as LinkedRequestRow;
    if (!isAskLeiliaDbReadingType(requestRow.reading_type)) {
      logAskLeiliaPipeline("REQUEST_LINK_FAILURE", {
        ...baseFields,
        requestId: askLeiliaRequestId,
        readingType: requestRow.reading_type,
        requestStatus: requestRow.status,
        paymentAmount: amount,
        currency,
        error: "Invalid reading_type.",
      });
      console.error("Ask Leilia request has invalid reading_type:", {
        askLeiliaRequestId,
        readingType: requestRow.reading_type,
      });
      return json({ ok: false, error: "Unable to validate reading type." }, 500);
    }

    const readingType = requestRow.reading_type as AskLeiliaDbReadingType;

    logAskLeiliaPipeline("REQUEST_LINK_SUCCESS", {
      ...baseFields,
      requestId: askLeiliaRequestId,
      readingType,
      requestStatus: requestRow.status,
      paymentAmount: amount,
      currency,
    });

    const expectedAmount = expectedPaymentCents(readingType);
    const amountMatches = paymentAmountMatches(readingType, amount, currency);

    if (amountMatches) {
      logAskLeiliaPipeline("PAYMENT_VALIDATED", {
        ...baseFields,
        requestId: askLeiliaRequestId,
        readingType,
        requestStatus: requestRow.status,
        paymentAmount: amount,
        currency,
      });

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
        logAskLeiliaPipeline("STATUS_UPDATE_FAILED", {
          ...baseFields,
          requestId: askLeiliaRequestId,
          readingType,
          paymentAmount: amount,
          currency,
          error: requestError?.message ?? "Unable to link paid request.",
        });
        console.error("Unable to link paid Ask Leilia request:", {
          error: requestError,
          askLeiliaRequestId,
          paymentIntent,
        });
        return json({ ok: false, error: "Unable to link paid request." }, 500);
      }

      linkedRequest = requestRecord as LinkedRequestRow;

      logAskLeiliaPipeline("STATUS_UPDATED_TO_PAID", {
        ...baseFields,
        requestId: linkedRequest.id,
        readingType,
        requestStatus: linkedRequest.status,
        paymentAmount: amount,
        currency,
        paymentId: (paymentRecord as { id: string }).id,
      });

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
            readingType,
          },
        },
        locals,
      );

      await sendAskLeiliaCustomerPaymentConfirmation(
        {
          requestId: linkedRequest.id,
          name: linkedRequest.name,
          email: linkedRequest.email,
          readingType,
        },
        locals,
      );
    } else {
      logAskLeiliaPipeline("PAYMENT_EXCEPTION", {
        ...baseFields,
        requestId: askLeiliaRequestId,
        readingType,
        requestStatus: requestRow.status,
        paymentAmount: amount,
        currency,
        error: `Expected ${expectedAmount} ${currency}, received ${amount}.`,
      });

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
        logAskLeiliaPipeline("STATUS_UPDATE_FAILED", {
          ...baseFields,
          requestId: askLeiliaRequestId,
          readingType,
          paymentAmount: amount,
          currency,
          error: requestError?.message ?? "Unable to record payment exception.",
        });
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
          readingType,
          expectedAmountCents: expectedAmount,
          actualAmountCents: amount,
          currency,
          paymentReference: paymentIntent,
        },
        locals,
      );
    }
  } else {
    logAskLeiliaPipeline("REQUEST_LINK_FAILURE", {
      ...baseFields,
      paymentAmount: amount,
      currency,
      error: "No client_reference_id or metadata request id on checkout session.",
    });

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

  logAskLeiliaPipeline("WEBHOOK_COMPLETE", {
    ...baseFields,
    requestId: linkedRequest?.id ?? (askLeiliaRequestId || undefined),
    readingType: linkedRequest?.reading_type,
    requestStatus: linkedRequest?.status,
    paymentAmount: amount,
    currency,
    paymentId: (paymentRecord as { id: string }).id,
  });

  return json({ ok: true });
};
