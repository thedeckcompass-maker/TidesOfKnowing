import type { APIRoute } from "astro";
import { json } from "../../../lib/community/api";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import { insertCompassPendingEnrolment } from "../../../lib/compass/enrolments";
import { buildCompassPaymentRedirectUrl } from "../../../lib/compass/paymentLinks";
import { validateCompassEnrolment } from "../../../lib/compass/validation";

export const prerender = false;

function wantsHtml(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  const contentType = request.headers.get("content-type") ?? "";
  return (
    accept.includes("text/html") ||
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  );
}

function enrolErrorRedirect(request: Request, code: string): Response {
  const url = new URL("/compass/", request.url);
  url.searchParams.set("enrol", code);
  url.hash = "choose-your-cohort";
  return Response.redirect(url.href, 303);
}

export const POST: APIRoute = async ({ request, locals }) => {
  const form = await request.formData();
  const html = wantsHtml(request);

  let service;
  try {
    service = createCommunityServiceClient(locals);
  } catch (err) {
    console.error("COMPASS enrolment service client failed:", err);
    if (html) return enrolErrorRedirect(request, "unavailable");
    return json({ ok: false, error: "Unable to start enrolment right now." }, 500);
  }

  const validation = await validateCompassEnrolment(
    {
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      email: form.get("email"),
      cohortId: form.get("cohortId"),
      sessionDates: form.get("sessionDates"),
      timezone: form.get("timezone"),
      offerId: form.get("offerId"),
      attendConfirmed: form.get("attendConfirmed"),
      termsAccepted: form.get("termsAccepted"),
      website: form.get("website"),
    },
    { service },
  );

  if (!validation.ok) {
    if (validation.error === "honeypot") {
      return Response.redirect(new URL("/compass/", request.url).href, 303);
    }
    if (html) {
      const code = validation.error.toLowerCase().includes("full") ? "full" : "invalid";
      return enrolErrorRedirect(request, code);
    }
    return json({ ok: false, error: validation.error }, 400);
  }

  const { value } = validation;

  try {
    const inserted = await insertCompassPendingEnrolment(service, {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      cohort: value.cohort,
    });

    if ("error" in inserted) {
      if (html) {
        const code = inserted.error.toLowerCase().includes("full") ? "full" : "unavailable";
        return enrolErrorRedirect(request, code);
      }
      return json({ ok: false, error: inserted.error }, 500);
    }

    const paymentUrl = buildCompassPaymentRedirectUrl(inserted.id, value.email);
    return Response.redirect(paymentUrl, 303);
  } catch (err) {
    console.error("COMPASS enrolment failed:", err);
    if (html) return enrolErrorRedirect(request, "unavailable");
    return json({ ok: false, error: "Unable to start enrolment right now." }, 500);
  }
};
