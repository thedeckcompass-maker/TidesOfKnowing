/**
 * COMPASS Live Practitioner Training — published cohort schedule.
 * All sessions: 7:00–8:30 pm America/Mexico_City (CST / UTC−6, no DST).
 */

export const COMPASS_TIMEZONE = "America/Mexico_City" as const;
export const COMPASS_TIMEZONE_LABEL = "Mexico City time (CST / UTC−6)" as const;
export const COMPASS_SESSION_TIME_LABEL = "7:00–8:30 pm Mexico City time (CST / UTC−6)" as const;
export const COMPASS_CAPACITY = 6 as const;
export const COMPASS_ENROLMENT_CLOSE_HOURS = 48 as const;
export const COMPASS_OFFER_ID = "compass-live-997" as const;
export const COMPASS_PRICE_USD = 997 as const;
export const COMPASS_PAYMENT_LINK =
  "https://buy.stripe.com/cNi9ASeie24O8ea9f57N603" as const;

/** Session local start 19:00. Fixed offset −06:00 (no DST). */
export const COMPASS_SESSION_UTC_OFFSET = "-06:00" as const;
export const COMPASS_SESSION_START = { hour: 19, minute: 0 } as const;

export type CompassCohortSlot = "early" | "mid";
export type CompassCohortConfiguredStatus = "open" | "full" | "closed";

export type CompassCohortDefinition = {
  id: string;
  year: number;
  month: number;
  monthKey: string;
  monthLabel: string;
  slot: CompassCohortSlot;
  slotLabel: string;
  label: string;
  /** ISO calendar dates YYYY-MM-DD for the four teaching sessions (Mexico City local). */
  sessionDates: readonly [string, string, string, string];
  /** Explicit availability until live counts are wired. */
  configuredStatus: CompassCohortConfiguredStatus;
};

function cohort(
  year: number,
  month: number,
  slot: CompassCohortSlot,
  sessionDates: readonly [string, string, string, string],
  configuredStatus: CompassCohortConfiguredStatus = "open",
): CompassCohortDefinition {
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: COMPASS_TIMEZONE,
  }).format(new Date(`${sessionDates[0]}T12:00:00${COMPASS_SESSION_UTC_OFFSET}`));
  const slotLabel = slot === "early" ? "Early cohort" : "Mid-month cohort";
  const id = `${monthKey}-${slot}`;
  return {
    id,
    year,
    month,
    monthKey,
    monthLabel,
    slot,
    slotLabel,
    label: `${monthLabel} · ${slotLabel}`,
    sessionDates,
    configuredStatus,
  };
}

export const COMPASS_COHORTS: readonly CompassCohortDefinition[] = [
  cohort(2026, 9, "early", ["2026-09-01", "2026-09-03", "2026-09-05", "2026-09-07"]),
  cohort(2026, 9, "mid", ["2026-09-15", "2026-09-17", "2026-09-19", "2026-09-21"]),
  cohort(2026, 10, "early", ["2026-10-06", "2026-10-08", "2026-10-10", "2026-10-12"]),
  cohort(2026, 10, "mid", ["2026-10-20", "2026-10-22", "2026-10-24", "2026-10-26"]),
  cohort(2026, 11, "early", ["2026-11-03", "2026-11-05", "2026-11-07", "2026-11-09"]),
  cohort(2026, 11, "mid", ["2026-11-17", "2026-11-19", "2026-11-21", "2026-11-23"]),
  cohort(2026, 12, "early", ["2026-12-01", "2026-12-03", "2026-12-05", "2026-12-07"]),
  cohort(2026, 12, "mid", ["2026-12-15", "2026-12-17", "2026-12-19", "2026-12-21"]),
  cohort(2027, 1, "early", ["2027-01-05", "2027-01-07", "2027-01-09", "2027-01-11"]),
  cohort(2027, 1, "mid", ["2027-01-19", "2027-01-21", "2027-01-23", "2027-01-25"]),
  cohort(2027, 2, "early", ["2027-02-02", "2027-02-04", "2027-02-06", "2027-02-08"]),
  cohort(2027, 2, "mid", ["2027-02-16", "2027-02-18", "2027-02-20", "2027-02-22"]),
] as const;

export type CompassMonthGroup = {
  monthKey: string;
  monthLabel: string;
  cohorts: CompassCohortDefinition[];
};

export function getCompassCohortById(id: string): CompassCohortDefinition | undefined {
  return COMPASS_COHORTS.find((c) => c.id === id);
}

export function groupCompassCohortsByMonth(
  cohorts: readonly CompassCohortDefinition[] = COMPASS_COHORTS,
): CompassMonthGroup[] {
  const map = new Map<string, CompassMonthGroup>();
  for (const c of cohorts) {
    const existing = map.get(c.monthKey);
    if (existing) {
      existing.cohorts.push(c);
    } else {
      map.set(c.monthKey, {
        monthKey: c.monthKey,
        monthLabel: c.monthLabel,
        cohorts: [c],
      });
    }
  }
  return [...map.values()];
}
