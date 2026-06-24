import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

const INTAKE_PREFERENCE_VALUES = [
  "Next cohort (Central Time, Mexico City)",
  "General COMPASS interest (timing to be discussed)",
] as const;

const TIER_PREFERENCE_VALUES = [
  "Course · USD $697",
  "Course + Mentor Access · USD $997",
  "Course + Ongoing Mentorship · USD $1,497",
  "Unsure",
] as const;

type IntakePreference = (typeof INTAKE_PREFERENCE_VALUES)[number];
type TierPreference = (typeof TIER_PREFERENCE_VALUES)[number];

type ApplicationPayload = {
  name?: string;
  email?: string;
  intakePreference?: string;
  tierPreference?: string;
  location?: string;
  experience_level?: string;
  current_situation?: string;
  desired_outcome?: string;
  why_now?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidIntakePreference(value: string): value is IntakePreference {
  return (INTAKE_PREFERENCE_VALUES as readonly string[]).includes(value);
}

function isValidTierPreference(value: string): value is TierPreference {
  return (TIER_PREFERENCE_VALUES as readonly string[]).includes(value);
}

async function parsePayload(request: Request): Promise<ApplicationPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as ApplicationPayload;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    return Object.fromEntries(form.entries()) as ApplicationPayload;
  }

  return {};
}

function wantsJsonResponse(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";

  return contentType.includes("application/json") || accept.includes("application/json");
}

export const POST: APIRoute = async ({ request, locals }) => {
  const wantsJson = wantsJsonResponse(request);

  try {
    const payload = await parsePayload(request);

    const name = clean(payload.name);
    const email = clean(payload.email);
    const intakePreferenceRaw = clean(payload.intakePreference);
    const tierPreferenceRaw = clean(payload.tierPreference);
    const location = clean(payload.location);
    const experienceLevel = clean(payload.experience_level);
    const currentSituation = clean(payload.current_situation);
    const desiredOutcome = clean(payload.desired_outcome);
    const whyNow = clean(payload.why_now);

    if (
      !name ||
      !email ||
      !intakePreferenceRaw ||
      !tierPreferenceRaw ||
      !experienceLevel ||
      !currentSituation ||
      !desiredOutcome ||
      !whyNow
    ) {
      return jsonResponse({ ok: false, error: "Please complete all required fields." }, 400);
    }

    if (!isValidIntakePreference(intakePreferenceRaw)) {
      return jsonResponse({ ok: false, error: "Please select a valid intake option." }, 400);
    }

    const intakePreference = intakePreferenceRaw;

    if (!isValidTierPreference(tierPreferenceRaw)) {
      return jsonResponse({ ok: false, error: "Please select a valid tier option." }, 400);
    }

    const tierPreference = tierPreferenceRaw;

    if (!isValidEmail(email)) {
      return jsonResponse({ ok: false, error: "Please enter a valid email address." }, 400);
    }

    const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env;
    const apiKey = runtimeEnv?.EMAIL_API_KEY ?? import.meta.env.EMAIL_API_KEY;
    const toEmail = runtimeEnv?.EMAIL_TO ?? import.meta.env.EMAIL_TO ?? "hello@tidesofknowing.com";

    if (!apiKey) {
      return jsonResponse({ ok: false, error: "Email service is not configured." }, 500);
    }

    const resend = new Resend(apiKey);

    const textBody = [
      "New COMPASS interest registration received.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Intake preference: ${intakePreference}`,
      `Tier preference: ${tierPreference}`,
      `Location: ${location || "Not provided"}`,
      `Experience Level: ${experienceLevel}`,
      "",
      "Current Situation:",
      currentSituation,
      "",
      "Desired Outcome:",
      desiredOutcome,
      "",
      "Why Now:",
      whyNow,
    ].join("\n");

    const ownerResult = await resend.emails.send({
      from: "Tides of Knowing <hello@tidesofknowing.com>",
      to: [toEmail],
      subject: "New COMPASS interest registration",
      text: textBody,
      replyTo: email,
    });

    if (ownerResult.error) {
      console.error("COMPASS owner notification failed:", ownerResult.error);
      return jsonResponse({ ok: false, error: "Unable to send your interest form right now. Please try again." }, 502);
    }

    const applicantBody = [
      "Your COMPASS interest has been received.",
      "",
      "I'll review your note personally and respond within 48 hours.",
      "",
      "Registering interest is not a payment step, and there is no obligation to enrol.",
      "",
      "If you need to add timing details or clarify anything, you can reply to hello@tidesofknowing.com.",
      "",
      "— Leigh Spencer",
    ].join("\n");

    const applicantResult = await resend.emails.send({
      from: "Tides of Knowing <hello@tidesofknowing.com>",
      to: [email],
      subject: "Your COMPASS interest has been received",
      text: applicantBody,
      replyTo: "hello@tidesofknowing.com",
    });

    if (applicantResult.error) {
      console.error("COMPASS applicant confirmation failed:", applicantResult.error);
      return jsonResponse({ ok: false, error: "Your interest was received, but the confirmation email could not be sent. Please contact hello@tidesofknowing.com." }, 502);
    }

    if (!wantsJson) {
      return Response.redirect(new URL("/compass/apply/thank-you/", request.url), 303);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("COMPASS application error:", error);
    return jsonResponse({ ok: false, error: "Unable to submit right now. Please try again." }, 500);
  }
};

