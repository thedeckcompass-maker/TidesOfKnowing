import { Resend } from "resend";
import { communityEnv } from "../community/env";
import { formatCompassEnrolmentSchedule, type CompassEnrolmentRow } from "./offer";

const SUPPORT_EMAIL = "hello@tidesofknowing.com";
const FROM_INTERNAL = "Tides of Knowing <hello@tidesofknowing.com>";

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

export function buildCompassInternalNotificationEmail(input: {
  enrolment: CompassEnrolmentRow;
  checkoutSessionId: string | null;
  checkoutStatus: string;
}): { subject: string; text: string } | { error: string } {
  const schedule = formatCompassEnrolmentSchedule(input.enrolment);
  if (!schedule) return { error: "Unable to format cohort schedule." };

  const enrolledAt = input.enrolment.paid_at ?? new Date().toISOString();
  const further = schedule.sessionDateLabels.slice(1);

  const text = [
    "A new COMPASS enrolment has completed checkout.",
    "",
    `Participant: ${input.enrolment.first_name} ${input.enrolment.last_name}`,
    `Email: ${input.enrolment.email}`,
    `Selected cohort: ${input.enrolment.cohort_label}`,
    `Cohort start date: ${schedule.startDateLabel}`,
    "",
    "Three further session dates:",
    ...further.map((label) => `- ${label}`),
    "",
    `Checkout status: ${input.checkoutStatus}`,
    `Date and time enrolled: ${enrolledAt}`,
    input.checkoutSessionId ? `Stripe checkout session: ${input.checkoutSessionId}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return {
    subject: "New COMPASS enrolment",
    text,
  };
}

/** One internal email to Leigh after successful COMPASS checkout. */
export async function sendCompassInternalNotification(
  enrolment: CompassEnrolmentRow,
  checkoutSessionId: string | null,
  checkoutStatus: string,
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
    checkoutSessionId,
    checkoutStatus,
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
