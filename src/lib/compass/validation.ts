import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COMPASS_OFFER_ID,
  COMPASS_PAYMENT_LINK,
  COMPASS_PRICE_USD,
  COMPASS_TIMEZONE,
  type CompassCohortDefinition,
} from "../../data/training/compass-cohorts";
import { countCompassPaidEnrolments } from "./capacity";
import {
  formatCompassFurtherSessions,
  formatCompassSessionDateLong,
  getSelectableCompassCohort,
  sessionDatesMatchCohort,
  type CompassCohortView,
} from "./cohorts";

export type CompassEnrolValidationOk = {
  ok: true;
  value: {
    firstName: string;
    lastName: string;
    email: string;
    cohort: CompassCohortView;
    attendConfirmed: true;
    termsAccepted: true;
    timezone: typeof COMPASS_TIMEZONE;
    offerId: typeof COMPASS_OFFER_ID;
    priceUsd: typeof COMPASS_PRICE_USD;
    paymentLink: typeof COMPASS_PAYMENT_LINK;
  };
};

export type CompassEnrolValidationResult =
  | CompassEnrolValidationOk
  | { ok: false; error: string };

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}

function parseSessionDatesField(raw: unknown): unknown {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isChecked(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  return v === "on" || v === "true" || v === "1" || v === "yes";
}

export async function validateCompassEnrolment(
  input: {
    firstName?: unknown;
    lastName?: unknown;
    email?: unknown;
    cohortId?: unknown;
    sessionDates?: unknown;
    timezone?: unknown;
    offerId?: unknown;
    attendConfirmed?: unknown;
    termsAccepted?: unknown;
    website?: unknown;
  },
  options: {
    now?: Date;
    service?: SupabaseClient;
  } = {},
): Promise<CompassEnrolValidationResult> {
  const now = options.now ?? new Date();

  if (clean(input.website)) {
    return { ok: false, error: "honeypot" };
  }

  const firstName = clean(input.firstName);
  const lastName = clean(input.lastName);
  const email = clean(input.email).toLowerCase();
  const cohortId = clean(input.cohortId);
  const timezone = clean(input.timezone);
  const offerId = clean(input.offerId);

  if (firstName.length < 1 || firstName.length > 80) {
    return { ok: false, error: "Please enter your first name." };
  }
  if (lastName.length < 1 || lastName.length > 80) {
    return { ok: false, error: "Please enter your last name." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!cohortId) {
    return { ok: false, error: "Please select a cohort before continuing." };
  }

  let paidCount = 0;
  if (options.service) {
    try {
      paidCount = await countCompassPaidEnrolments(options.service, cohortId);
    } catch {
      return { ok: false, error: "Unable to verify cohort capacity right now." };
    }
  }

  const cohortResult = getSelectableCompassCohort(cohortId, now, paidCount);
  if ("error" in cohortResult) {
    return { ok: false, error: cohortResult.error };
  }

  const submittedDates = parseSessionDatesField(input.sessionDates);
  if (!sessionDatesMatchCohort(cohortResult, submittedDates)) {
    return {
      ok: false,
      error: "The selected cohort schedule could not be verified. Please refresh and try again.",
    };
  }

  if (timezone !== COMPASS_TIMEZONE) {
    return {
      ok: false,
      error: "The timezone for this enrolment could not be verified. Please refresh and try again.",
    };
  }

  if (offerId !== COMPASS_OFFER_ID) {
    return {
      ok: false,
      error: "The programme offer could not be verified. Please refresh and try again.",
    };
  }

  if (!isChecked(input.attendConfirmed)) {
    return {
      ok: false,
      error:
        "Please confirm you can attend the cohort start date and have reviewed the further teaching dates.",
    };
  }

  if (!isChecked(input.termsAccepted)) {
    return {
      ok: false,
      error:
        "Please confirm you have read and accept the enrolment, refund, transfer, privacy, and training terms.",
    };
  }

  return {
    ok: true,
    value: {
      firstName,
      lastName,
      email,
      cohort: cohortResult,
      attendConfirmed: true,
      termsAccepted: true,
      timezone: COMPASS_TIMEZONE,
      offerId: COMPASS_OFFER_ID,
      priceUsd: COMPASS_PRICE_USD,
      paymentLink: COMPASS_PAYMENT_LINK,
    },
  };
}

export function attendanceConfirmLabel(
  cohort: Pick<CompassCohortDefinition, "sessionDates">,
): string {
  const start = formatCompassSessionDateLong(cohort.sessionDates[0]);
  return `I can attend the cohort beginning ${start} and have reviewed the three further teaching dates shown above.`;
}

export function enrolmentSummaryLines(cohort: CompassCohortView): {
  title: string;
  start: string;
  time: string;
  further: string;
} {
  return {
    title: cohort.label,
    start: `Starts ${cohort.startDateLabel}`,
    time: "7:00–8:30 pm Mexico City time (CST / UTC−6)",
    further: `Further teaching sessions: ${formatCompassFurtherSessions(cohort.sessionDates)}`,
  };
}
