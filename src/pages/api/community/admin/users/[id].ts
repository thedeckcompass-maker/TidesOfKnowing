import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../../lib/community/auth";
import { json, parseJsonOrForm } from "../../../../../lib/community/api";
import { setProfileStatus } from "../../../../../lib/community/mutations";
import { createCommunityServiceClient } from "../../../../../lib/community/supabaseServer";
import type { CommunityProfileStatus } from "../../../../../lib/community/types";

export const prerender = false;

function isProfileStatus(value: unknown): value is CommunityProfileStatus {
  return value === "active" || value === "restricted" || value === "blocked";
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.profile || !isAdminProfile(locals.profile)) {
    return json({ ok: false, error: "Not found." }, 404);
  }

  const targetUserId = params.id;
  if (!targetUserId) return json({ ok: false, error: "Missing user id." }, 400);

  const payload = await parseJsonOrForm(request);
  if (!isProfileStatus(payload.status)) {
    return json({ ok: false, error: "Invalid member status." }, 400);
  }

  const service = createCommunityServiceClient(locals);
  const result = await setProfileStatus(service, {
    adminId: locals.profile.id,
    targetUserId,
    status: payload.status,
    reason: typeof payload.reason === "string" ? payload.reason : undefined,
  });

  return json({ ok: result.ok, error: result.ok ? undefined : result.error }, result.ok ? 200 : (result.status ?? 500));
};
