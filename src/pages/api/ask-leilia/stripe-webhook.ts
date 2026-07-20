import type { APIRoute } from "astro";
import Stripe from "stripe";
import { json } from "../../../lib/community/api";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import {
  notifyAskLeiliaPaymentCompleted,
  notifyAskLeiliaPaymentException,
  sendAskLeiliaCustomerPaymentConfirmation,
} from "../../../lib/ask-leilia/notifications";
import {
  validateCheckoutSessionPayment,
  type CheckoutPaymentAudit,
} from "../../../lib/ask-leilia/checkoutPaymentValidation";
import { logAskLeiliaPipeline } from "../../../lib/ask-leilia/pipelineLog";
import { isAskLeiliaDbReadingType, type AskLeiliaDbReadingType } from "../../../lib/ask-leilia/readingTypes";
import type { AskLeiliaCardPreference } from "../../../lib/ask-leilia/types";
import { tryFulfillCompassEnrolment } from "../../../lib/compass/fulfilment";

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
  payment_id: string | null;
};

function paymentAuditMetadata(
  session: Stripe.Checkout.Session,
  validationPath: "normal" | "fully_discounted" | "payment_exception",
  audit: CheckoutPaymentAudit,
): Record<string, unknown> {
  return {
    checkout_session_id: session.id,
    payment_link: typeof session.payment_link === "string" ? session.payment_link : null,
    metadata: session.metadata ?? {},
    payment_validation: {
      path: validationPath,
      catalogue_amount_cents: audit.catalogueAmountCents,
      paid_amount_cents: audit.paidAmountCents,
      discount_amount_cents: audit.discountAmountCents,
      amount_subtotal_cents: audit.amountSubtotalCents,
      promotion_code_id: audit.promotionCodeId,
      coupon_id: audit.couponId,
      amount_discount: session.total_details?.amount_discount ?? null,
      payment_status: session.payment_status ?? null,
      discounts: session.discounts ?? [],
    },
  };
}

function paidRequestUpdateFields(
  paymentId: string,
  validationPath: "normal" | "fully_discounted",
  audit: CheckoutPaymentAudit,
): Record<string, unknown> {
  if (validationPath === "fully_discounted") {
    return {
      payment_id: paymentId,
      status: "Paid",
      payment_expected_amount: audit.catalogueAmountCents,
      payment_actual_amount: audit.paidAmountCents,
      payment_exception_reference: null,
    };
  }

  return {
    payment_id: paymentId,
    status: "Paid",
    payment_expected_amount: null,
    payment_actual_amount: null,
    payment_exception_reference: null,
  };
}

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

  // COMPASS enrolments share this webhook endpoint via client_reference_id.
  const compassResult = await tryFulfillCompassEnrolment(service, session, event, locals);
  if (compassResult.handled) {
    logAskLeiliaPipeline("WEBHOOK_COMPLETE", {
      ...baseFields,
      paymentAmount: amount,
      currency,
      requestStatus: compassResult.ok ? "compass_paid" : "compass_error",
      error: compassResult.ok ? undefined : compassResult.error,
    });
    if (!compassResult.ok) {
      return json({ ok: false, error: compassResult.error }, compassResult.httpStatus);
    }
    return json({ ok: true, product: "compass", idempotent: compassResult.idempotent ?? false });
  }

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
        "id, name, email, question, context, card_preference, image_url, reading_type, status, payment_id",
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

    const validation = validateCheckoutSessionPayment(readingType, session);
    const expectedAmount = validation.audit.catalogueAmountCents;
    const paymentId = (paymentRecord as { id: string }).id;
    const wasAlreadyPaid = requestRow.status === "Paid";
    const wasPaymentException = requestRow.status === "Payment Exception";

    await service
      .from("ask_leilia_payments")
      .update({
        stripe_metadata: paymentAuditMetadata(session, validation.path, validation.audit),
      })
      .eq("id", paymentId);

    if (validation.accepted) {
      logAskLeiliaPipeline("PAYMENT_VALIDATED", {
        ...baseFields,
        requestId: askLeiliaRequestId,
        readingType,
        requestStatus: requestRow.status,
        paymentAmount: amount,
        currency,
        validationPath: validation.path,
        catalogueAmountCents: validation.audit.catalogueAmountCents,
        discountAmountCents: validation.audit.discountAmountCents,
        promotionCodeId: validation.audit.promotionCodeId ?? undefined,
        couponId: validation.audit.couponId ?? undefined,
      });

      if (wasAlreadyPaid) {
        logAskLeiliaPipeline("STATUS_UPDATED_TO_PAID", {
          ...baseFields,
          requestId: askLeiliaRequestId,
          readingType,
          requestStatus: requestRow.status,
          paymentAmount: amount,
          currency,
          paymentId,
          validationPath: validation.path,
          idempotentSkip: true,
        });
        linkedRequest = requestRow;
      } else {
        const { data: requestRecord, error: requestError } = await service
          .from("ask_leilia_requests")
          .update(paidRequestUpdateFields(paymentId, validation.path, validation.audit))
          .eq("id", askLeiliaRequestId)
          .select(
            "id, name, email, question, context, card_preference, image_url, reading_type, status, payment_id",
          )
          .maybeSingle();

        if (requestError || !requestRecord) {
          logAskLeiliaPipeline("STATUS_UPDATE_FAILED", {
            ...baseFields,
            requestId: askLeiliaRequestId,
            readingType,
            paymentAmount: amount,
            currency,
            validationPath: validation.path,
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
          paymentId,
          validationPath: validation.path,
          catalogueAmountCents: validation.audit.catalogueAmountCents,
          discountAmountCents: validation.audit.discountAmountCents,
          promotionCodeId: validation.audit.promotionCodeId ?? undefined,
          couponId: validation.audit.couponId ?? undefined,
        });

        const paymentAudit =
          validation.path === "fully_discounted"
            ? {
                catalogueAmountCents: validation.audit.catalogueAmountCents,
                paidAmountCents: validation.audit.paidAmountCents,
                discountAmountCents: validation.audit.discountAmountCents,
                promotionCodeId: validation.audit.promotionCodeId,
                couponId: validation.audit.couponId,
                fullyDiscounted: true as const,
              }
            : undefined;

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
            paymentAudit,
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
      }
    } else {
      logAskLeiliaPipeline("PAYMENT_EXCEPTION", {
        ...baseFields,
        requestId: askLeiliaRequestId,
        readingType,
        requestStatus: requestRow.status,
        paymentAmount: amount,
        currency,
        validationPath: "payment_exception",
        catalogueAmountCents: validation.audit.catalogueAmountCents,
        discountAmountCents: validation.audit.discountAmountCents,
        promotionCodeId: validation.audit.promotionCodeId ?? undefined,
        couponId: validation.audit.couponId ?? undefined,
        error: validation.reason,
      });

      if (wasAlreadyPaid) {
        linkedRequest = requestRow;
      } else {
        const { data: requestRecord, error: requestError } = await service
          .from("ask_leilia_requests")
          .update({
            payment_id: paymentId,
            status: "Payment Exception",
            payment_expected_amount: expectedAmount,
            payment_actual_amount: amount,
            payment_exception_reference: paymentIntent,
          })
          .eq("id", askLeiliaRequestId)
          .select(
            "id, name, email, question, context, card_preference, image_url, reading_type, status, payment_id",
          )
          .maybeSingle();

        if (requestError || !requestRecord) {
          logAskLeiliaPipeline("STATUS_UPDATE_FAILED", {
            ...baseFields,
            requestId: askLeiliaRequestId,
            readingType,
            paymentAmount: amount,
            currency,
            validationPath: "payment_exception",
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

        if (!wasPaymentException) {
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
      }
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
