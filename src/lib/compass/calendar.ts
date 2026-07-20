import {
  COMPASS_SESSION_END,
  COMPASS_SESSION_START,
  COMPASS_SESSION_UTC_OFFSET,
  COMPASS_TIMEZONE,
  getCompassCohortById,
  type CompassCohortDefinition,
} from "../../data/training/compass-cohorts";
import { formatCompassSessionDateLong } from "./cohorts";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format a Mexico City local wall time as a floating DATE-TIME for VTIMEZONE-aware ICS. */
function formatLocalDateTime(isoDate: string, hour: number, minute: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(hour)}${pad(minute)}00`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldIcsLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  parts.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    parts.push(` ${remaining.slice(0, 74)}`);
    remaining = remaining.slice(74);
  }
  return parts.join("\r\n");
}

/**
 * Cohort-level calendar (no personal data). Four 90-minute teaching sessions.
 */
export function buildCompassCohortIcs(cohort: CompassCohortDefinition, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const startLabel = formatCompassSessionDateLong(cohort.sessionDates[0]);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tides of Knowing//COMPASS Training//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:The COMPASS Method Live Training",
    `X-WR-TIMEZONE:${COMPASS_TIMEZONE}`,
    "BEGIN:VTIMEZONE",
    `TZID:${COMPASS_TIMEZONE}`,
    "X-LIC-LOCATION:America/Mexico_City",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0600",
    "TZOFFSETTO:-0600",
    "TZNAME:CST",
    "DTSTART:19700101T000000",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  cohort.sessionDates.forEach((isoDate, index) => {
    const sessionNumber = index + 1;
    const dtStart = formatLocalDateTime(
      isoDate,
      COMPASS_SESSION_START.hour,
      COMPASS_SESSION_START.minute,
    );
    const dtEnd = formatLocalDateTime(
      isoDate,
      COMPASS_SESSION_END.hour,
      COMPASS_SESSION_END.minute,
    );
    const uid = `compass-${cohort.id}-session-${sessionNumber}@tidesofknowing.com`;
    const description = [
      `Session ${sessionNumber} of 4.`,
      `Cohort begins ${startLabel}.`,
      `Timezone: ${COMPASS_TIMEZONE}.`,
      "Please confirm the conversion for your location.",
      "Attendance is strongly recommended. Bring your primary deck and a notebook.",
    ].join(" ");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${COMPASS_TIMEZONE}:${dtStart}`,
      `DTEND;TZID=${COMPASS_TIMEZONE}:${dtEnd}`,
      `SUMMARY:${escapeIcsText("The COMPASS Method™ Live Training")}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `LOCATION:${escapeIcsText("Online · Mexico City time")}`,
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

export function buildCompassCohortIcsById(cohortId: string): string | null {
  const cohort = getCompassCohortById(cohortId);
  if (!cohort) return null;
  return buildCompassCohortIcs(cohort);
}

/** Absolute calendar path for emails and thank-you (no personal data). */
export function compassCohortCalendarPath(cohortId: string): string {
  return `/api/compass/calendar/${encodeURIComponent(cohortId)}.ics`;
}

export function compassCohortCalendarUrl(origin: string, cohortId: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${compassCohortCalendarPath(cohortId)}`;
}

/** Exported for tests: local wall-time formatting uses fixed Mexico City offset. */
export function __testFormatLocalDateTime(isoDate: string): string {
  return formatLocalDateTime(isoDate, COMPASS_SESSION_START.hour, COMPASS_SESSION_START.minute);
}

export const __testOffset = COMPASS_SESSION_UTC_OFFSET;
