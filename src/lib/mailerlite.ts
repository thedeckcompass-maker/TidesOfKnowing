/** MailerLite Connect API (server-side only). */
export const MAILERLITE_API_BASE = "https://connect.mailerlite.com/api";

/** Embedded form 6Tmwkx — matches `data-form` on /subscribe/ and legacy embed. */
export const MAILERLITE_NEWSLETTER_FORM_SLUG = "6Tmwkx";

/** Segmentation field for Field Notes sidebar signups. */
export const BLOG_SIDEBAR_SOURCE_COMPONENT = "ml-6Tmwkx-blog-sidebar";

/** Segmentation field for /subscribe/ (matches legacy embedded form dashboard value). */
export const MAIN_SUBSCRIBE_SOURCE_COMPONENT = "ml-6Tmwkx-main-subscribe";

export type MailerLiteSubscribeResult =
  | { ok: true; status: number }
  | { ok: false; status: number; message: string };

export function parseMailerLiteGroupIds(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function mailerLiteCreateSubscriber(
  apiKey: string,
  payload: {
    email: string;
    fields?: Record<string, string | null>;
    groups?: string[];
  },
): Promise<MailerLiteSubscribeResult> {
  const body: Record<string, unknown> = {
    email: payload.email,
    fields: payload.fields ?? {},
  };
  if (payload.groups?.length) {
    body.groups = payload.groups;
  }

  const res = await fetch(`${MAILERLITE_API_BASE}/subscribers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    return { ok: true, status: res.status };
  }

  let message = "We could not add you to the list. Please try again.";
  try {
    const data = (await res.json()) as { message?: string; errors?: { email?: string[] } };
    if (data.errors?.email?.[0]) {
      message = data.errors.email[0];
    } else if (data.message) {
      message = data.message;
    }
  } catch {
    /* non-JSON error body */
  }

  return { ok: false, status: res.status, message };
}
