import {
  COMPASS_CAPACITY,
  COMPASS_COHORTS,
  COMPASS_ENROLMENT_CLOSE_HOURS,
  COMPASS_SESSION_START,
  COMPASS_SESSION_UTC_OFFSET,
  COMPASS_TIMEZONE,
  type CompassCohortConfiguredStatus,
  type CompassCohortDefinition,
  getCompassCohortById,
} from "../../data/training/compass-cohorts";

export type CompassCohortAvailabilityStatus = CompassCohortConfiguredStatus;

export type CompassCohortView = CompassCohortDefinition & {
  startDate: string;
  startDateLabel: string;
  furtherSessionsLabel: string;
  availabilityStatus: CompassCohortAvailabilityStatus;
  selectable: boolean;
  availabilityLabel: string;
  enrolmentClosesAt: Date;
  firstSessionStartsAt: Date;
};

const WEEKDAY_LONG = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  timeZone: COMPASS_TIMEZONE,
});

const DAY_NUM = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  timeZone: COMPASS_TIMEZONE,
});

const MONTH_LONG = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  timeZone: COMPASS_TIMEZONE,
});

const YEAR_NUM = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  timeZone: COMPASS_TIMEZONE,
});

/** Local Mexico City session start Instant for a YYYY-MM-DD calendar date. */
export function compassSessionStartsAt(isoDate: string): Date {
  const { hour, minute } = COMPASS_SESSION_START;
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${isoDate}T${hh}:${mm}:00${COMPASS_SESSION_UTC_OFFSET}`);
}

export function compassEnrolmentClosesAt(cohort: CompassCohortDefinition): Date {
  const first = compassSessionStartsAt(cohort.sessionDates[0]);
  return new Date(first.getTime() - COMPASS_ENROLMENT_CLOSE_HOURS * 60 * 60 * 1000);
}

export function formatCompassSessionDateLong(isoDate: string): string {
  const at = compassSessionStartsAt(isoDate);
  return `${WEEKDAY_LONG.format(at)} ${DAY_NUM.format(at)} ${MONTH_LONG.format(at)} ${YEAR_NUM.format(at)}`;
}

/** Supporting line for the three further teaching dates. */
export function formatCompassFurtherSessions(
  sessionDates: readonly [string, string, string, string],
): string {
  const [, a, b, c] = sessionDates;
  const parts = [a, b, c].map((iso) => {
    const at = compassSessionStartsAt(iso);
    return {
      weekday: WEEKDAY_LONG.format(at),
      day: DAY_NUM.format(at),
      month: MONTH_LONG.format(at),
      year: YEAR_NUM.format(at),
    };
  });
  const last = parts[2];
  return `${parts[0].weekday} ${parts[0].day}, ${parts[1].weekday} ${parts[1].day} and ${last.weekday} ${last.day} ${last.month}`;
}

export function resolveCompassAvailability(
  cohort: CompassCohortDefinition,
  now: Date = new Date(),
  paidCount = 0,
): {
  status: CompassCohortAvailabilityStatus;
  selectable: boolean;
  label: string;
} {
  if (cohort.configuredStatus === "full" || paidCount >= COMPASS_CAPACITY) {
    return { status: "full", selectable: false, label: "Full" };
  }
  if (cohort.configuredStatus === "closed") {
    return { status: "closed", selectable: false, label: "Closed" };
  }
  if (now.getTime() >= compassEnrolmentClosesAt(cohort).getTime()) {
    return { status: "closed", selectable: false, label: "Enrolment closed" };
  }
  return { status: "open", selectable: true, label: "Open" };
}

export function toCompassCohortView(
  cohort: CompassCohortDefinition,
  now: Date = new Date(),
  paidCount = 0,
): CompassCohortView {
  const availability = resolveCompassAvailability(cohort, now, paidCount);
  const startDate = cohort.sessionDates[0];
  return {
    ...cohort,
    startDate,
    startDateLabel: formatCompassSessionDateLong(startDate),
    furtherSessionsLabel: formatCompassFurtherSessions(cohort.sessionDates),
    availabilityStatus: availability.status,
    selectable: availability.selectable,
    availabilityLabel: availability.label,
    enrolmentClosesAt: compassEnrolmentClosesAt(cohort),
    firstSessionStartsAt: compassSessionStartsAt(startDate),
  };
}

export function listCompassCohortViews(
  now: Date = new Date(),
  paidCounts: Map<string, number> = new Map(),
): CompassCohortView[] {
  return COMPASS_COHORTS.map((c) => toCompassCohortView(c, now, paidCounts.get(c.id) ?? 0));
}

export function getSelectableCompassCohort(
  id: string,
  now: Date = new Date(),
  paidCount = 0,
): CompassCohortView | { error: string } {
  const cohort = getCompassCohortById(id);
  if (!cohort) {
    return { error: "Please choose a valid COMPASS cohort." };
  }
  const view = toCompassCohortView(cohort, now, paidCount);
  if (!view.selectable) {
    if (view.availabilityStatus === "full") {
      return { error: "That cohort is full. Please choose another available cohort." };
    }
    return { error: "That cohort is no longer open for enrolment. Please choose another." };
  }
  return view;
}

/** Server-side check that submitted session dates match the configured cohort. */
export function sessionDatesMatchCohort(
  cohort: CompassCohortDefinition,
  submitted: unknown,
): boolean {
  if (!Array.isArray(submitted) || submitted.length !== 4) return false;
  return cohort.sessionDates.every((d, i) => submitted[i] === d);
}
