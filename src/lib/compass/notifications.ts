import { Resend } from "resend";
import { communityEnv } from "../community/env";
import { compassCohortCalendarUrl } from "./calendar";
import {
  formatCompassEnrolmentSchedule,
  type CompassEnrolmentRow,
} from "./offer";

const SUPPORT_EMAIL = "hello@tidesofknowing.com";
const FROM_INTERNAL = "Tides of Knowing <hello@tidesofknowing.com>";
const FROM_STUDENT = "Leigh Spencer · Tides of Knowing <hello@tidesofknowing.com>";

function notifyEmail(locals?: unknown): string {
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string | undefined> } } | undefined)
    ?.runtime?.env;
  return (
    runtimeEnv?.COMPASS_NOTIFY_EMAIL ??
    runtimeEnv?.ASK_LEILIA_NOTIFY_EMAIL ??
    (import.meta.env.COMPASS_NOTIFY_EMAIL as string | undefined) ??
    (import.meta.env.ASK_LEILIA_NOTIFY_EMAIL as string | undefined) ??
    SUPPORT_EMAIL
  );
}

function siteOrigin(locals?: unknown): string {
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string | undefined> } } | undefined)
    ?.runtime?.env;
  return (
    runtimeEnv?.PUBLIC_SITE_URL ??
    (import.meta.env.PUBLIC_SITE_URL as string | undefined) ??
    "https://www.tidesofknowing.com"
  );
}

export function buildCompassStudentConfirmationEmail(input: {
  enrolment: CompassEnrolmentRow;
  calendarUrl: string;
}): { subject: string; text: string } | { error: string } {
  const schedule = formatCompassEnrolmentSchedule(input.enrolment);
  if (!schedule) return { error: "Unable to format cohort schedule." };

  const firstName = input.enrolment.first_name.trim() || "there";
  const dateLines = schedule.sessionDateLabels.map((label, i) => `  ${i + 1}. ${label}`);

  const text = [
    `Hello ${firstName},`,
    "",
    "Thank you for enrolling. Your place on The COMPASS Method™ Live Practitioner Training is confirmed.",
    "",
    "Programme: The COMPASS Method™ Live Practitioner Training",
    "Amount paid: US$997",
    "",
    `Your cohort begins: ${schedule.startDateLabel}`,
    `Session time: ${schedule.timeLabel}`,
    `Timezone: ${schedule.timezone}`,
    "",
    "Please confirm the conversion for your location before the first session.",
    "",
    "All four teaching dates:",
    ...dateLines,
    "",
    "Further teaching sessions:",
    schedule.furtherSessionsLabel,
    "",
    "Each live teaching session runs 60–90 minutes. Attendance is strongly recommended.",
    "",
    "Included with your enrolment:",
    "- Three months of The Deck Compass membership",
    "- One observed seeker reading with private feedback",
    "- Journal sharing and review through The Deck Compass",
    "- One guaranteed live member training each month during membership",
    "",
    "Add the sessions to your calendar:",
    input.calendarUrl,
    "",
    "Next steps and preparation:",
    "- Keep the four dates free in your diary.",
    "- Have your primary tarot or oracle deck ready.",
    "- Bring a notebook for practice and reflection.",
    "- Platform access instructions for The Deck Compass will be sent separately if they are not already included in a follow-up message.",
    "- Onboarding into The Deck Compass occurs during the fourth teaching session.",
    "- Journalling and journal-sharing are built into the platform.",
    "",
    "If anything is unclear, email hello@tidesofknowing.com.",
    "",
    "I look forward to working with you.",
    "",
    "Leigh Spencer (Leilia)",
    "Tides of Knowing",
  ].join("\n");

  return {
    subject: "Your COMPASS cohort is confirmed",
    text,
  };
}

export function buildCompassInternalNotificationEmail(input: {
  enrolment: CompassEnrolmentRow;
  paymentReference: string;
  checkoutSessionId: string | null;
}): { subject: string; text: string } | { error: string } {
  const schedule = formatCompassEnrolmentSchedule(input.enrolment);
  if (!schedule) return { error: "Unable to format cohort schedule." };

  const paidAt = input.enrolment.paid_at ?? new Date().toISOString();
  const text = [
    "A new paid COMPASS enrolment has been confirmed.",
    "",
    `Participant: ${input.enrolment.first_name} ${input.enrolment.last_name}`,
    `Email: ${input.enrolment.email}`,
    `Cohort id: ${input.enrolment.cohort_id}`,
    `Cohort: ${input.enrolment.cohort_label}`,
    `Start date: ${schedule.startDateLabel}`,
    `Timezone: ${schedule.timezone}`,
    "",
    "Session dates:",
    ...schedule.sessionDateLabels.map((label) => `- ${label}`),
    "",
    `Status: ${input.enrolment.status}`,
    `Stripe payment reference: ${input.paymentReference}`,
    input.checkoutSessionId ? `Stripe checkout session: ${input.checkoutSessionId}` : null,
    `Paid at: ${paidAt}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return {
    subject: "New paid COMPASS enrolment",
    text,
  };
}

export async function sendCompassStudentConfirmation(
  enrolment: CompassEnrolmentRow,
  locals?: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = communityEnv(locals);
  if (!env.emailApiKey) {
    const error = "EMAIL_API_KEY is not configured.";
    console.error("COMPASS student confirmation skipped:", error);
    return { ok: false, error };
  }

  const calendarUrl = compassCohortCalendarUrl(siteOrigin(locals), enrolment.cohort_id);
  const payload = buildCompassStudentConfirmationEmail({ enrolment, calendarUrl });
  if ("error" in payload) return { ok: false, error: payload.error };

  const resend = new Resend(env.emailApiKey);
  const result = await resend.emails.send({
    from: FROM_STUDENT,
    to: enrolment.email,
    replyTo: SUPPORT_EMAIL,
    subject: payload.subject,
    text: payload.text,
  });

  if (result.error) {
    console.error("COMPASS student confirmation failed:", result.error);
    return { ok: false, error: result.error.message ?? "Resend send failed." };
  }

  return { ok: true };
}

export async function sendCompassInternalNotification(
  enrolment: CompassEnrolmentRow,
  paymentReference: string,
  checkoutSessionId: string | null,
  locals?: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = communityEnv(locals);
  if (!env.emailApiKey) {
    const error = "EMAIL_API_KEY is not configured.";
    console.error("COMPASS internal notification skipped:", error);
    return { ok: false, error };
  }

  const payload = buildCompassInternalNotificationEmail({
    enrolment,
    paymentReference,
    checkoutSessionId,
  });
  if ("error" in payload) return { ok: false, error: payload.error };

  const resend = new Resend(env.emailApiKey);
  const result = await resend.emails.send({
    from: FROM_INTERNAL,
    to: notifyEmail(locals),
    subject: payload.subject,
    text: payload.text,
  });

  if (result.error) {
    console.error("COMPASS internal notification failed:", result.error);
    return { ok: false, error: result.error.message ?? "Resend send failed." };
  }

  return { ok: true };
}
