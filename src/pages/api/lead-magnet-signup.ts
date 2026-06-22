import type { APIRoute } from "astro";
import { mailerLiteCreateSubscriber } from "../../lib/mailerlite";

export const prerender = false;

const JSON_HEADERS = { "content-type": "application/json" } as const;
const LEAD_MAGNET_GROUP_ENV = "MAILERLITE_LEAD_MAGNET_GROUP_ID";

const LEAD_MAGNETS = {
  "discernment-checklist": {
    redirectUrl: "/resources/discernment-checklist/thank-you/",
    sourceComponent: "lead-magnet-discernment-checklist",
  },
} as const;

type LeadMagnetSlug = keyof typeof LEAD_MAGNETS;

type LeadMagnetPayload = {
  name?: string;
  email?: string;
  /** Honeypot — must stay empty for humans. */
  website?: string;
  resourceSlug?: string;
  source_component?: string;
};

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isLeadMagnetSlug(value: string): value is LeadMagnetSlug {
  return value in LEAD_MAGNETS;
}

async function parsePayload(request: Request): Promise<LeadMagnetPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as LeadMagnetPayload;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    return Object.fromEntries(form.entries()) as LeadMagnetPayload;
  }

  return {};
}

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
    status: 405,
    headers: {
      ...JSON_HEADERS,
      Allow: "POST",
    },
  });

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env;
    const staticEnv = import.meta.env as Record<string, string | undefined>;
    const apiKey = runtimeEnv?.MAILERLITE_API_KEY ?? staticEnv.MAILERLITE_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Lead magnet signup is not configured. Missing MAILERLITE_API_KEY.",
          code: "not_configured",
        }),
        { status: 503, headers: JSON_HEADERS },
      );
    }

    const payload = await parsePayload(request);
    const honeypot = clean(payload.website);
    if (honeypot) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: JSON_HEADERS,
      });
    }

    const resourceSlug = clean(payload.resourceSlug);
    if (!isLeadMagnetSlug(resourceSlug)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unknown lead magnet resource." }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const config = LEAD_MAGNETS[resourceSlug];
    const groupId = runtimeEnv?.[LEAD_MAGNET_GROUP_ENV] ?? staticEnv[LEAD_MAGNET_GROUP_ENV];
    if (!groupId) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Lead magnet signup is not configured. Missing ${LEAD_MAGNET_GROUP_ENV}.`,
          code: "not_configured",
        }),
        { status: 503, headers: JSON_HEADERS },
      );
    }

    const name = clean(payload.name);
    if (!name) {
      return new Response(
        JSON.stringify({ ok: false, error: "Please enter your first name." }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const email = clean(payload.email).toLowerCase();
    if (!email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Please enter your email address." }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Please enter a valid email address." }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const sourceComponent = clean(payload.source_component) || config.sourceComponent;
    const result = await mailerLiteCreateSubscriber(apiKey, {
      email,
      fields: {
        name: name.slice(0, 200),
        source_component: sourceComponent.slice(0, 200),
        lead_magnet: resourceSlug,
      },
      groups: [groupId],
    });

    if (!result.ok) {
      const duplicateSubscriber =
        result.status === 409 || /\balready\b|\bexists\b/i.test(result.message);
      if (!duplicateSubscriber) {
        const status = result.status >= 400 && result.status < 600 ? result.status : 502;
        return new Response(JSON.stringify({ ok: false, error: result.message }), {
          status,
          headers: JSON_HEADERS,
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Thanks. Your checklist is ready.",
        redirectUrl: config.redirectUrl,
      }),
      { status: 200, headers: JSON_HEADERS },
    );
  } catch (error) {
    console.error("Lead magnet signup error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Something went wrong. Please try again." }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
};
