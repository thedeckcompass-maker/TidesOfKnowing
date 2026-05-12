import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

type ContactPayload = {
  name?: string;
  email?: string;
  message?: string;
  /** When `"media"`, optional inquiry fields are included and the email subject is adjusted. */
  form?: string;
  organization?: string;
  website?: string;
  inquiryType?: string;
  topic?: string;
  timeline?: string;
  backgroundLink?: string;
};

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

const MAX_FIELD = 12_000;

function clipField(value: string, max = MAX_FIELD): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}\n…(truncated)`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function parsePayload(request: Request): Promise<ContactPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as ContactPayload;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    return Object.fromEntries(form.entries()) as ContactPayload;
  }

  return {};
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const payload = await parsePayload(request);
    const name = clean(payload.name);
    const email = clean(payload.email);
    const message = clean(payload.message);
    const isMediaForm = clean(payload.form).toLowerCase() === "media";

    if (!name || !email || !message) {
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

    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Email service is not configured." }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    const resend = new Resend(apiKey);

    const organization = clipField(clean(payload.organization));
    const website = clipField(clean(payload.website));
    const inquiryType = clipField(clean(payload.inquiryType));
    const topic = clipField(clean(payload.topic));
    const timeline = clipField(clean(payload.timeline));
    const backgroundLink = clipField(clean(payload.backgroundLink));

    const mediaExtras: string[] = [];
    if (isMediaForm) {
      mediaExtras.push("Form: Media / podcast or editorial enquiry");
      if (organization) mediaExtras.push(`Show, publication, group, or organisation: ${organization}`);
      if (website) mediaExtras.push(`Website or platform link: ${website}`);
      if (inquiryType) mediaExtras.push(`Inquiry type: ${inquiryType}`);
      if (topic) mediaExtras.push(`Topic or angle: ${topic}`);
      if (timeline) mediaExtras.push(`Timeline or publication date: ${timeline}`);
      if (backgroundLink) {
        mediaExtras.push(`Link to brief, questions, media kit, or background material: ${backgroundLink}`);
      }
    }

    const textBody = [
      isMediaForm
        ? "New media enquiry received (podcast, editorial, or related)."
        : "New website enquiry received.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      ...(mediaExtras.length ? ["", ...mediaExtras] : []),
      "",
      "Message:",
      clipField(message),
    ].join("\n");

    const subject = isMediaForm ? "Media / podcast enquiry" : "Website enquiry";

    console.log("Sending website enquiry email", { name, email, isMediaForm });
    const sendResult = await resend.emails.send({
      from: "Tides of Knowing <hello@tidesofknowing.com>",
      to: "hello@tidesofknowing.com",
      subject,
      text: textBody,
      replyTo: email,
    });

    if (sendResult.error) {
      console.error("Resend send failure:", sendResult.error);
      return new Response(
        JSON.stringify({ ok: false, error: "Unable to send right now. Please try again." }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Unable to send right now. Please try again." }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
};
