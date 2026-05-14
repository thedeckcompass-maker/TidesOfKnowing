import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

const INTAKE_PREFERENCE_VALUES = [
  "Next cohort — Central Time (Mexico City)",
  "General COMPASS interest (timing to be discussed)",
] as const;

type IntakePreference = (typeof INTAKE_PREFERENCE_VALUES)[number];

type ApplicationPayload = {
  name?: string;
  email?: string;
  intakePreference?: string;
  location?: string;
  experience_level?: string;
  current_situation?: string;
  desired_outcome?: string;
  why_now?: string;
};

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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const payload = await parsePayload(request);

    const name = clean(payload.name);
    const email = clean(payload.email);
    const intakePreferenceRaw = clean(payload.intakePreference);
    const location = clean(payload.location);
    const experienceLevel = clean(payload.experience_level);
    const currentSituation = clean(payload.current_situation);
    const desiredOutcome = clean(payload.desired_outcome);
    const whyNow = clean(payload.why_now);

    if (
      !name ||
      !email ||
      !intakePreferenceRaw ||
      !experienceLevel ||
      !currentSituation ||
      !desiredOutcome ||
      !whyNow
    ) {
      return new Response(
        JSON.stringify({ ok: false, error: "Please complete all required fields." }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    if (!isValidIntakePreference(intakePreferenceRaw)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Please select a valid intake option." }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    const intakePreference = intakePreferenceRaw;

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Please enter a valid email address." }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env;
    const apiKey = runtimeEnv?.EMAIL_API_KEY ?? import.meta.env.EMAIL_API_KEY;
    const toEmail = runtimeEnv?.EMAIL_TO ?? import.meta.env.EMAIL_TO ?? "hello@tidesofknowing.com";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Email service is not configured." }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    const resend = new Resend(apiKey);

    const textBody = [
      "New COMPASS interest registration received.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Intake preference: ${intakePreference}`,
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

    await resend.emails.send({
      from: "Tides of Knowing <hello@tidesofknowing.com>",
      to: [toEmail],
      subject: "New COMPASS interest registration",
      text: textBody,
      replyTo: email,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("COMPASS application error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Unable to submit right now. Please try again." }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
};

