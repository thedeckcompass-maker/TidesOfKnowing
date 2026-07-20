import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import {
  sendCompassInternalNotification,
  sendCompassStudentConfirmation,
} from "./notifications";
import {
  COMPASS_STRIPE_PAYMENT_LINK_ID,
  isUuid,
  verifyCompassCheckoutOffer,
  type CompassEnrolmentRow,
} from "./offer";

export type CompassFulfilmentResult =
  | { handled: false }
  | { handled: true; ok: true; idempotent?: boolean }
  | { handled: true; ok: false; error: string; httpStatus: number };

function paymentLinkFromSession(session: Stripe.Checkout.Session): string | null {
  if (typeof session.payment_link === "string") return session.payment_link;
  return null;
}

function isCompassPaymentLink(session: Stripe.Checkout.Session): boolean {
  const link = paymentLinkFromSession(session);
  return Boolean(link && link.includes(COMPASS_STRIPE_PAYMENT_LINK_ID));
}

async function loadCompassEnrolment(
  service: SupabaseClient,
  id: string,
): Promise<CompassEnrolmentRow | null> {
  const { data, error } = await service
    .from("compass_enrolments")
    .select(
      "id, first_name, last_name, email, cohort_id, cohort_label, start_date, session_dates, timezone, price_usd, offer_id, stripe_payment_link_id, status, stripe_checkout_session_id, stripe_payment_intent, paid_at, student_confirmation_sent_at, internal_notification_sent_at, created_at, admin_notes",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("COMPASS enrolment load failed:", error);
    return null;
  }

  return (data as CompassEnrolmentRow | null) ?? null;
}

async function markEmailTimestamps(
  service: SupabaseClient,
  enrolmentId: string,
  fields: {
    student_confirmation_sent_at?: string;
    internal_notification_sent_at?: string;
  },
): Promise<void> {
  const { error } = await service.from("compass_enrolments").update(fields).eq("id", enrolmentId);
  if (error) {
    console.error("COMPASS email timestamp update failed:", error);
  }
}

async function markPaymentException(
  service: SupabaseClient,
  enrolmentId: string,
  note: string,
  session: Stripe.Checkout.Session,
  paymentIntent: string,
  eventId: string,
): Promise<void> {
  const existing = await loadCompassEnrolment(service, enrolmentId);
  const adminNotes = [existing?.admin_notes, note].filter(Boolean).join("\n");
  await service
    .from("compass_enrolments")
    .update({
      status: "payment_exception",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent: paymentIntent,
      stripe_event_id: eventId,
      admin_notes: adminNotes,
    })
    .eq("id", enrolmentId);
}

/**
 * Attempt COMPASS fulfilment for a checkout.session.completed event.
 * Returns handled:false when client_reference_id is not a COMPASS enrolment.
 */
export async function tryFulfillCompassEnrolment(
  service: SupabaseClient,
  session: Stripe.Checkout.Session,
  event: Stripe.Event,
  locals?: unknown,
): Promise<CompassFulfilmentResult> {
  const enrolmentId = session.client_reference_id ?? "";
  if (!enrolmentId || !isUuid(enrolmentId)) {
    // COMPASS Payment Link without a valid enrolment reference.
    if (isCompassPaymentLink(session)) {
      console.error("COMPASS checkout completed without a valid client_reference_id", {
        checkoutSessionId: session.id,
        stripeEventId: event.id,
      });
      return {
        handled: true,
        ok: false,
        error: "Missing COMPASS enrolment reference.",
        httpStatus: 400,
      };
    }
    return { handled: false };
  }

  const existing = await loadCompassEnrolment(service, enrolmentId);
  if (!existing) {
    if (isCompassPaymentLink(session)) {
      console.error("COMPASS checkout completed but enrolment row was not found", {
        enrolmentId,
        checkoutSessionId: session.id,
      });
      return {
        handled: true,
        ok: false,
        error: "COMPASS enrolment not found.",
        httpStatus: 404,
      };
    }
    return { handled: false };
  }

  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : session.id;
  const amount = session.amount_total ?? 0;
  const currency = session.currency ?? "usd";

  console.info("COMPASS webhook fulfilment start", {
    enrolmentId,
    stripeEventId: event.id,
    checkoutSessionId: session.id,
    status: existing.status,
  });

  const offerCheck = verifyCompassCheckoutOffer({
    amountTotal: amount,
    currency,
    paymentLink: paymentLinkFromSession(session),
    offerIdOnRecord: existing.offer_id,
  });

  if (!offerCheck.ok) {
    console.error("COMPASS payment offer mismatch:", offerCheck.reason, {
      enrolmentId,
      amount,
      currency,
    });
    if (existing.status !== "paid") {
      await markPaymentException(
        service,
        enrolmentId,
        `Offer validation failed: ${offerCheck.reason}`,
        session,
        paymentIntent,
        event.id,
      );
    }
    return { handled: true, ok: false, error: offerCheck.reason, httpStatus: 400 };
  }

  // Idempotent path: already paid
  if (existing.status === "paid") {
    await maybeSendCompassEmails(service, existing, paymentIntent, session.id, locals);
    return { handled: true, ok: true, idempotent: true };
  }

  const { data: rpcData, error: rpcError } = await service.rpc("mark_compass_enrolment_paid", {
    p_enrolment_id: enrolmentId,
    p_stripe_checkout_session_id: session.id,
    p_stripe_payment_intent: paymentIntent,
    p_stripe_event_id: event.id,
    p_max_paid: 6,
  });

  if (rpcError) {
    // Fallback when RPC is not yet applied: update with capacity recheck in application code.
    console.warn("COMPASS mark_compass_enrolment_paid RPC unavailable, using fallback:", rpcError.message);
    const fallback = await markCompassPaidFallback(
      service,
      existing,
      session,
      paymentIntent,
      event.id,
    );
    if (!fallback.ok) {
      return { handled: true, ok: false, error: fallback.error, httpStatus: fallback.httpStatus };
    }
    await maybeSendCompassEmails(service, fallback.enrolment, paymentIntent, session.id, locals);
    return { handled: true, ok: true, idempotent: fallback.idempotent };
  }

  const result = rpcData as {
    ok?: boolean;
    idempotent?: boolean;
    error?: string;
    enrolment?: CompassEnrolmentRow;
  };

  if (!result?.ok) {
    if (result?.error === "capacity") {
      console.error("COMPASS capacity exceeded at webhook:", { enrolmentId });
      return {
        handled: true,
        ok: false,
        error: "Cohort is full.",
        httpStatus: 409,
      };
    }
    console.error("COMPASS mark paid failed:", result);
    return {
      handled: true,
      ok: false,
      error: result?.error ?? "Unable to mark enrolment paid.",
      httpStatus: 500,
    };
  }

  const enrolment = (result.enrolment as CompassEnrolmentRow) ?? (await loadCompassEnrolment(service, enrolmentId));
  if (!enrolment) {
    return { handled: true, ok: false, error: "Enrolment missing after paid update.", httpStatus: 500 };
  }

  await maybeSendCompassEmails(service, enrolment, paymentIntent, session.id, locals);
  return { handled: true, ok: true, idempotent: Boolean(result.idempotent) };
}

async function markCompassPaidFallback(
  service: SupabaseClient,
  existing: CompassEnrolmentRow,
  session: Stripe.Checkout.Session,
  paymentIntent: string,
  eventId: string,
): Promise<
  | { ok: true; idempotent: boolean; enrolment: CompassEnrolmentRow }
  | { ok: false; error: string; httpStatus: number }
> {
  const { count, error: countError } = await service
    .from("compass_enrolments")
    .select("id", { count: "exact", head: true })
    .eq("cohort_id", existing.cohort_id)
    .eq("status", "paid");

  if (countError) {
    return { ok: false, error: "Unable to verify capacity.", httpStatus: 500 };
  }

  if ((count ?? 0) >= 6) {
    await markPaymentException(
      service,
      existing.id,
      "Capacity exceeded at payment time (fallback path).",
      session,
      paymentIntent,
      eventId,
    );
    return { ok: false, error: "Cohort is full.", httpStatus: 409 };
  }

  const paidAt = new Date().toISOString();
  const { data, error } = await service
    .from("compass_enrolments")
    .update({
      status: "paid",
      paid_at: paidAt,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent: paymentIntent,
      stripe_event_id: eventId,
    })
    .eq("id", existing.id)
    .eq("status", "pending_payment")
    .select(
      "id, first_name, last_name, email, cohort_id, cohort_label, start_date, session_dates, timezone, price_usd, offer_id, stripe_payment_link_id, status, stripe_checkout_session_id, stripe_payment_intent, paid_at, student_confirmation_sent_at, internal_notification_sent_at, created_at, admin_notes",
    )
    .maybeSingle();

  if (error) {
    console.error("COMPASS paid fallback update failed:", error);
    return { ok: false, error: "Unable to mark enrolment paid.", httpStatus: 500 };
  }

  if (!data) {
    const refreshed = await loadCompassEnrolment(service, existing.id);
    if (refreshed?.status === "paid") {
      return { ok: true, idempotent: true, enrolment: refreshed };
    }
    return { ok: false, error: "Unable to mark enrolment paid.", httpStatus: 500 };
  }

  return { ok: true, idempotent: false, enrolment: data as CompassEnrolmentRow };
}

async function maybeSendCompassEmails(
  service: SupabaseClient,
  enrolment: CompassEnrolmentRow,
  paymentReference: string,
  checkoutSessionId: string,
  locals?: unknown,
): Promise<void> {
  if (enrolment.status !== "paid") return;

  const updates: {
    student_confirmation_sent_at?: string;
    internal_notification_sent_at?: string;
  } = {};

  if (!enrolment.student_confirmation_sent_at) {
    const student = await sendCompassStudentConfirmation(enrolment, locals);
    if (student.ok) {
      updates.student_confirmation_sent_at = new Date().toISOString();
    } else {
      console.error("COMPASS student email failed after payment; enrolment remains paid.", {
        enrolmentId: enrolment.id,
        error: student.error,
      });
    }
  }

  if (!enrolment.internal_notification_sent_at) {
    const internal = await sendCompassInternalNotification(
      enrolment,
      paymentReference,
      checkoutSessionId,
      locals,
    );
    if (internal.ok) {
      updates.internal_notification_sent_at = new Date().toISOString();
    } else {
      console.error("COMPASS internal email failed after payment; enrolment remains paid.", {
        enrolmentId: enrolment.id,
        error: internal.error,
      });
    }
  }

  if (Object.keys(updates).length > 0) {
    await markEmailTimestamps(service, enrolment.id, updates);
  }
}
