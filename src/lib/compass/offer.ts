import {
  COMPASS_OFFER_ID,
  COMPASS_PAYMENT_LINK,
  COMPASS_PRICE_USD,
  COMPASS_SESSION_TIME_LABEL,
  COMPASS_TIMEZONE,
  getCompassCohortById,
} from "../../data/training/compass-cohorts";
import {
  formatCompassFurtherSessions,
  formatCompassSessionDateLong,
} from "./cohorts";

export const COMPASS_AMOUNT_CENTS = COMPASS_PRICE_USD * 100;
export const COMPASS_STRIPE_PAYMENT_LINK_ID = "cNi9ASeie24O8ea9f57N603";

/** Minimal enrolment row used after checkout fulfilment. */
export type CompassEnrolmentRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  cohort_id: string;
  cohort_label: string;
  start_date: string;
  status: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_link_id: string;
  paid_at: string | null;
  created_at?: string;
};

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export type CompassPaymentOfferCheck = { ok: true } | { ok: false; reason: string };

/**
 * Public buy.stripe.com slug / full URL for the COMPASS Payment Link.
 * Checkout Session `payment_link` is normally a Stripe object id (`plink_…`), not this slug.
 */
export function isCompassPublicPaymentLink(link: string | null | undefined): boolean {
  if (!link) return false;
  return (
    link.includes(COMPASS_STRIPE_PAYMENT_LINK_ID) ||
    link === COMPASS_PAYMENT_LINK ||
    link.endsWith(COMPASS_STRIPE_PAYMENT_LINK_ID)
  );
}

/**
 * True when `payment_link` is an identifiable non-COMPASS hosted Payment Link URL.
 * `plink_…` object ids cannot be compared to the public URL slug and are not treated as mismatches.
 */
export function paymentLinkConflictsWithCompassOffer(link: string | null | undefined): boolean {
  if (!link) return false;
  if (isCompassPublicPaymentLink(link)) return false;
  if (/^plink_/i.test(link)) return false;
  return /buy\.stripe\.com/i.test(link);
}

/**
 * Accept the live US$997 COMPASS Payment Link, including 100% discounted checkouts
 * (`amount_total` 0 / `no_payment_required`).
 *
 * Important: webhook payloads set `session.payment_link` to a `plink_…` id. Rejecting those
 * as “wrong offer” left paid checkouts stuck in `pending_payment`.
 */
export function verifyCompassCheckoutOffer(input: {
  amountTotal: number | null;
  currency: string | null;
  paymentLink: string | null;
  paymentStatus?: string | null;
}): CompassPaymentOfferCheck {
  const currency = (input.currency ?? "").toLowerCase();
  if (currency && currency !== "usd") {
    return { ok: false, reason: `Unexpected currency ${currency}.` };
  }

  if (paymentLinkConflictsWithCompassOffer(input.paymentLink)) {
    return { ok: false, reason: "Checkout payment_link does not match the COMPASS offer." };
  }

  const amount = input.amountTotal ?? 0;
  const paymentStatus = (input.paymentStatus ?? "").toLowerCase();
  const discounted =
    amount === 0 &&
    (paymentStatus === "no_payment_required" || paymentStatus === "paid" || !paymentStatus);

  if (amount !== COMPASS_AMOUNT_CENTS && !discounted) {
    return {
      ok: false,
      reason: `Expected ${COMPASS_AMOUNT_CENTS} cents or a fully discounted checkout, received ${amount}.`,
    };
  }

  return { ok: true };
}

/** Cohort schedule for the internal notification email (from server config, not DB). */
export function formatCompassEnrolmentSchedule(row: Pick<CompassEnrolmentRow, "cohort_id">): {
  startDateLabel: string;
  furtherSessionsLabel: string;
  sessionDateLabels: string[];
  timeLabel: string;
  timezone: string;
} | null {
  const cohort = getCompassCohortById(row.cohort_id);
  if (!cohort) return null;
  const tuple = cohort.sessionDates;
  return {
    startDateLabel: formatCompassSessionDateLong(tuple[0]),
    furtherSessionsLabel: formatCompassFurtherSessions(tuple),
    sessionDateLabels: tuple.map((d) => formatCompassSessionDateLong(d)),
    timeLabel: COMPASS_SESSION_TIME_LABEL,
    timezone: COMPASS_TIMEZONE,
  };
}

export { COMPASS_OFFER_ID };
