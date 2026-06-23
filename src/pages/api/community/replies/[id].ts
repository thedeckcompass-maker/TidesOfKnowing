import type { APIRoute } from "astro";
import { canContribute, isAdminProfile } from "../../../../lib/community/auth";
import { json, parseJsonOrForm } from "../../../../lib/community/api";
import { setReplyStatus, updateCommunityReply } from "../../../../lib/community/mutations";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { validateReplyInput } from "../../../../lib/community/validation";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user || !canContribute(locals.profile)) {
    return json({ ok: false, error: "Please log in first." }, 401);
  }

  const replyId = params.id;
  if (!replyId) return json({ ok: false, error: "Missing reply id." }, 400);

  const payload = await parseJsonOrForm(request);
  const intent = String(payload.intent ?? "edit");
  const service = createCommunityServiceClient(locals);
  const isAdmin = isAdminProfile(locals.profile);

  if (intent === "hide" || intent === "delete" || intent === "restore") {
    if (!isAdmin || !locals.profile) return json({ ok: false, error: "Not found." }, 404);
    const result = await setReplyStatus(service, {
      adminId: locals.profile.id,
      replyId,
      status: intent === "delete" ? "deleted" : intent === "restore" ? "published" : "hidden",
      reason: typeof payload.reason === "string" ? payload.reason : undefined,
    });
    return json({ ok: result.ok, error: result.ok ? undefined : result.error }, result.ok ? 200 : (result.status ?? 500));
  }

  const validation = validateReplyInput({ body: payload.body });
  if (!validation.ok) {
    return json({ ok: false, error: validation.error }, 400);
  }

  const result = await updateCommunityReply(service, {
    replyId,
    userId: locals.user.id,
    isAdmin,
    body: validation.value.body,
  });

  return json({ ok: result.ok, error: result.ok ? undefined : result.error }, result.ok ? 200 : (result.status ?? 500));
};
