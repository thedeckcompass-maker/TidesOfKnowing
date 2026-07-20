import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { sendCompassInternalNotification } from "./notifications";
import {
  isCompassPublicPaymentLink,
  isUuid,
  verifyCompassCheckoutOffer,
  type CompassEnrolmentRow,
} from "./offer";

export type CompassFulfilmentResult =
  | { handled: false }
  | { handled: true; ok: true; idempotent?: boolean }
  | { handled: true; ok: false; error: string; httpStatus: number };

const ENROLMENT_SELECT =
  "id, first_name, last_name, email, cohort_id, cohort_label, start_date, status, stripe_checkout_session_id, stripe_payment_link_id, paid_at, created_at";

function paymentLinkFromSession(session: Stripe.Checkout.Session): string | null {
  const link = session.payment_link;
  if (typeof link === "string") return link;
  if (link && typeof link === "object" && typeof link.id === "string") return link.id;
  return null;
}

/** Positive COMPASS Payment Link match from the public URL slug (not a `plink_…` id). */
function isCompassPaymentLink(session: Stripe.Checkout.Session): boolean {
  return isCompassPublicPaymentLink(paymentLinkFromSession(session));
}

async function loadCompassEnrolment(
  service: SupabaseClient,
  id: string,
): Promise<CompassEnrolmentRow | null> {
  const { data, error } = await service
    .from("compass_enrolments")
    .select(ENROLMENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("COMPASS enrolment load failed:", error);
    return null;
  }

  return (data as CompassEnrolmentRow | null) ?? null;
}

/**
 * Mark paid + notify Leigh. No student confirmation email or Deck Compass automation.
 * Idempotent: already-paid rows skip a second internal email.
 */
export async function tryFulfillCompassEnrolment(
  service: SupabaseClient,
  session: Stripe.Checkout.Session,
  event: Stripe.Event,
  locals?: unknown,
): Promise<CompassFulfilmentResult> {
  const enrolmentId = session.client_reference_id ?? "";
  if (!enrolmentId || !isUuid(enrolmentId)) {
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

  const amount = session.amount_total ?? 0;
  const currency = session.currency ?? "usd";
  const paymentStatus = session.payment_status ?? "paid";

  const offerCheck = verifyCompassCheckoutOffer({
    amountTotal: amount,
    currency,
    paymentLink: paymentLinkFromSession(session),
    paymentStatus,
  });

  if (!offerCheck.ok) {
    console.error("COMPASS payment offer mismatch:", offerCheck.reason, {
      enrolmentId,
      amount,
      currency,
      paymentStatus,
    });
    return { handled: true, ok: false, error: offerCheck.reason, httpStatus: 400 };
  }

  // Already paid: acknowledge retry without sending another email.
  if (existing.status === "paid") {
    return { handled: true, ok: true, idempotent: true };
  }

  const marked = await markCompassPaid(service, existing, session);
  if (!marked.ok) {
    return { handled: true, ok: false, error: marked.error, httpStatus: marked.httpStatus };
  }

  const enrolment = marked.enrolment;
  if (!marked.idempotent) {
    const internal = await sendCompassInternalNotification(
      enrolment,
      session.id,
      paymentStatus,
      locals,
    );
    if (!internal.ok) {
      console.error("COMPASS internal email failed after payment; enrolment remains paid.", {
        enrolmentId: enrolment.id,
        error: internal.error,
      });
    }
  }

  return { handled: true, ok: true, idempotent: marked.idempotent };
}

/**
 * Prefer the atomic RPC (capacity + paid in one transaction). Fall back to app-level
 * count + update if the RPC is unavailable.
 */
async function markCompassPaid(
  service: SupabaseClient,
  existing: CompassEnrolmentRow,
  session: Stripe.Checkout.Session,
): Promise<
  | { ok: true; idempotent: boolean; enrolment: CompassEnrolmentRow }
  | { ok: false; error: string; httpStatus: number }
> {
  const { data: rpcData, error: rpcError } = await service.rpc("mark_compass_enrolment_paid", {
    p_enrolment_id: existing.id,
    p_stripe_checkout_session_id: session.id,
    p_max_paid: 6,
  });

  if (!rpcError) {
    const result = rpcData as {
      ok?: boolean;
      idempotent?: boolean;
      error?: string;
      enrolment?: CompassEnrolmentRow;
    };

    if (!result?.ok) {
      if (result?.error === "capacity") {
        return { ok: false, error: "Cohort is full.", httpStatus: 409 };
      }
      return {
        ok: false,
        error: result?.error ?? "Unable to mark enrolment paid.",
        httpStatus: 500,
      };
    }

    const enrolment =
      (result.enrolment as CompassEnrolmentRow | undefined) ??
      (await loadCompassEnrolment(service, existing.id));
    if (!enrolment) {
      return { ok: false, error: "Enrolment missing after paid update.", httpStatus: 500 };
    }
    return { ok: true, idempotent: Boolean(result.idempotent), enrolment };
  }

  console.warn("COMPASS mark_compass_enrolment_paid RPC unavailable, using fallback:", rpcError.message);
  return markCompassPaidFallback(service, existing, session);
}

async function markCompassPaidFallback(
  service: SupabaseClient,
  existing: CompassEnrolmentRow,
  session: Stripe.Checkout.Session,
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
    return { ok: false, error: "Cohort is full.", httpStatus: 409 };
  }

  const paidAt = new Date().toISOString();
  const { data, error } = await service
    .from("compass_enrolments")
    .update({
      status: "paid",
      paid_at: paidAt,
      stripe_checkout_session_id: session.id,
    })
    .eq("id", existing.id)
    .eq("status", "pending_payment")
    .select(ENROLMENT_SELECT)
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
