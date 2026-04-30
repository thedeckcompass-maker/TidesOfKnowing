import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

type ContactPayload = {
  name?: string;
  email?: string;
  message?: string;
};

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
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

    const textBody = [
      "New website enquiry received.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      "Message:",
      message,
    ].join("\n");

    console.log("Sending website enquiry email", { name, email });
    const sendResult = await resend.emails.send({
      from: "Tides of Knowing <hello@tidesofknowing.com>",
      to: "hello@tidesofknowing.com",
      subject: "Website enquiry",
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
