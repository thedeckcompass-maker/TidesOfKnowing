import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

type ApplicationPayload = {
  name?: string;
  email?: string;
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
    const location = clean(payload.location);
    const experienceLevel = clean(payload.experience_level);
    const currentSituation = clean(payload.current_situation);
    const desiredOutcome = clean(payload.desired_outcome);
    const whyNow = clean(payload.why_now);

    if (
      !name ||
      !email ||
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
      "New COMPASS application received.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
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
      from: "COMPASS Applications <onboarding@resend.dev>",
      to: [toEmail],
      subject: "New COMPASS Application",
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

