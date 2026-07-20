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

export type CompassEnrolmentRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  cohort_id: string;
  cohort_label: string;
  start_date: string;
  session_dates: string[] | unknown;
  timezone: string;
  price_usd: number;
  offer_id: string;
  stripe_payment_link_id: string;
  status: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent: string | null;
  paid_at: string | null;
  student_confirmation_sent_at: string | null;
  internal_notification_sent_at: string | null;
  created_at?: string;
  admin_notes?: string | null;
};

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function parseCompassSessionDates(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  if (!raw.every((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))) return null;
  return raw as string[];
}

export function compassSessionDatesFromEnrolment(row: CompassEnrolmentRow): string[] | null {
  const fromRow = parseCompassSessionDates(row.session_dates);
  if (fromRow) return fromRow;
  const cohort = getCompassCohortById(row.cohort_id);
  return cohort ? [...cohort.sessionDates] : null;
}

export type CompassPaymentOfferCheck =
  | { ok: true }
  | { ok: false; reason: string };

/** Verify checkout belongs to the US$997 COMPASS Payment Link offer. */
export function verifyCompassCheckoutOffer(input: {
  amountTotal: number | null;
  currency: string | null;
  paymentLink: string | null;
  offerIdOnRecord: string;
}): CompassPaymentOfferCheck {
  if (input.offerIdOnRecord !== COMPASS_OFFER_ID) {
    return { ok: false, reason: "Enrolment offer_id is not the COMPASS live programme." };
  }

  const currency = (input.currency ?? "").toLowerCase();
  if (currency && currency !== "usd") {
    return { ok: false, reason: `Unexpected currency ${currency}.` };
  }

  const link = input.paymentLink ?? "";
  const linkOk =
    !link ||
    link.includes(COMPASS_STRIPE_PAYMENT_LINK_ID) ||
    link === COMPASS_PAYMENT_LINK ||
    link.endsWith(COMPASS_STRIPE_PAYMENT_LINK_ID);

  if (link && !linkOk) {
    return { ok: false, reason: "Checkout payment_link does not match the COMPASS offer." };
  }

  const amount = input.amountTotal ?? 0;
  if (amount !== COMPASS_AMOUNT_CENTS) {
    return {
      ok: false,
      reason: `Expected ${COMPASS_AMOUNT_CENTS} cents, received ${amount}.`,
    };
  }

  return { ok: true };
}

export function formatCompassEnrolmentSchedule(row: CompassEnrolmentRow): {
  startDateLabel: string;
  furtherSessionsLabel: string;
  sessionDateLabels: string[];
  timeLabel: string;
  timezone: string;
} | null {
  const dates = compassSessionDatesFromEnrolment(row);
  if (!dates || dates.length !== 4) return null;
  const tuple = dates as [string, string, string, string];
  return {
    startDateLabel: formatCompassSessionDateLong(tuple[0]),
    furtherSessionsLabel: formatCompassFurtherSessions(tuple),
    sessionDateLabels: tuple.map((d) => formatCompassSessionDateLong(d)),
    timeLabel: COMPASS_SESSION_TIME_LABEL,
    timezone: COMPASS_TIMEZONE,
  };
}
