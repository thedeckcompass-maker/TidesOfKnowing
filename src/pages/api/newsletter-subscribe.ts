import type { APIRoute } from "astro";
import {
  BLOG_SIDEBAR_SOURCE_COMPONENT,
  mailerLiteCreateSubscriber,
  parseMailerLiteGroupIds,
} from "../../lib/mailerlite";

export const prerender = false;

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type SubscribePayload = {
  email?: string;
  /** Honeypot — must stay empty for humans. */
  website?: string;
  source_component?: string;
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env;
    const apiKey = runtimeEnv?.MAILERLITE_API_KEY ?? import.meta.env.MAILERLITE_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Newsletter signup is not configured. Please use the subscribe page.",
          code: "not_configured",
        }),
        { status: 503, headers: { "content-type": "application/json" } },
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    let payload: SubscribePayload = {};

    if (contentType.includes("application/json")) {
      payload = (await request.json()) as SubscribePayload;
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      payload = Object.fromEntries(form.entries()) as SubscribePayload;
    }

    const honeypot = clean(payload.website);
    if (honeypot) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    const email = clean(payload.email).toLowerCase();
    if (!email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Please enter your email address." }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Please enter a valid email address." }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    const sourceComponent = clean(payload.source_component) || BLOG_SIDEBAR_SOURCE_COMPONENT;
    const groupIds = parseMailerLiteGroupIds(
      runtimeEnv?.MAILERLITE_NEWSLETTER_GROUP_IDS ?? import.meta.env.MAILERLITE_NEWSLETTER_GROUP_IDS,
    );

    const result = await mailerLiteCreateSubscriber(apiKey, {
      email,
      fields: { source_component: sourceComponent },
      groups: groupIds.length > 0 ? groupIds : undefined,
    });

    if (!result.ok) {
      const status = result.status >= 400 && result.status < 600 ? result.status : 502;
      return new Response(JSON.stringify({ ok: false, error: result.message }), {
        status,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Thanks — check your inbox to confirm your subscription.",
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Something went wrong. Please try again." }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
};
