import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../../lib/community/auth";
import { createCommunityServiceClient } from "../../../../../lib/community/supabaseServer";

export const prerender = false;

const queuePath = "/studio/admin/support/";

function redirect(message?: string): Response {
  const location = message
    ? `${queuePath}?error=${encodeURIComponent(message)}`
    : `${queuePath}?saved=1`;
  return new Response(null, { status: 303, headers: { Location: location } });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!locals.user || !isAdminProfile(locals.profile) || !params.id) {
    return new Response("Not found", { status: 404 });
  }

  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  const service = createCommunityServiceClient(locals);
  const { data: supportRequest, error: lookupError } = await service
    .from("studio_support_requests")
    .select("id,status,facilitator_id")
    .eq("id", params.id)
    .maybeSingle();

  if (lookupError || !supportRequest) return redirect("The support request could not be found.");

  if (action === "accept") {
    if (supportRequest.status !== "requested") return redirect("Only a requested focus can be accepted.");
    const scheduledValue = String(form.get("session_scheduled_for") ?? "").trim();
    const scheduledFor = scheduledValue ? new Date(scheduledValue) : null;
    if (scheduledFor && Number.isNaN(scheduledFor.getTime())) return redirect("Check the session date and time.");

    const acceptedAt = new Date();
    const expiresAt = new Date(acceptedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    const { error } = await service
      .from("studio_support_requests")
      .update({
        facilitator_id: locals.user.id,
        status: "accepted",
        accepted_at: acceptedAt.toISOString(),
        access_expires_at: expiresAt.toISOString(),
        session_scheduled_for: scheduledFor?.toISOString() ?? null,
      })
      .eq("id", params.id)
      .eq("status", "requested");
    return error ? redirect("The support request could not be accepted.") : redirect();
  }

  if (action === "complete") {
    if (supportRequest.status !== "accepted" || supportRequest.facilitator_id !== locals.user.id) {
      return redirect("Only the assigned facilitator can complete this request.");
    }
    const facilitatorResponse = String(form.get("facilitator_response") ?? "").trim().slice(0, 5000);
    const nextStep = String(form.get("next_step") ?? "").trim().slice(0, 1200);
    if (facilitatorResponse.length < 10) return redirect("Add a clear facilitator response before completing the request.");

    const completedAt = new Date().toISOString();
    const { error } = await service
      .from("studio_support_requests")
      .update({
        status: "completed",
        facilitator_response: facilitatorResponse,
        next_step: nextStep,
        completed_at: completedAt,
        access_expires_at: completedAt,
      })
      .eq("id", params.id)
      .eq("status", "accepted")
      .eq("facilitator_id", locals.user.id);
    return error ? redirect("The support response could not be completed.") : redirect();
  }

  return redirect("Choose a valid support action.");
};
