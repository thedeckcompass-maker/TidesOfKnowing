import {resolveCommunityAudience} from "../../../../lib/community/studioAudience";
import {parkedCommonsResponse} from "../../../../lib/community/practiceCommons";
import type { APIRoute } from "astro";
import { canContribute, isAdminProfile } from "../../../../lib/community/auth";
import { json, parseJsonOrForm } from "../../../../lib/community/api";
import { setReplyStatus, updateCommunityReply } from "../../../../lib/community/mutations";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { validateReplyInput } from "../../../../lib/community/validation";

import {dcsParticipation} from '../../../../lib/community/dcsParticipation';
export const prerender = false;

function safeRedirectTo(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  return value;
}

export const POST: APIRoute = async (ctx) => {
  const { params, request, locals, redirect } = ctx;
  if (!locals.user || locals.profile?.id !== locals.user.id || !canContribute(locals.profile)) {
    return json({ ok: false, error: "Please log in first." }, 401);
  }

  const replyId = params.id;
  if (!replyId) return json({ ok: false, error: "Missing reply id." }, 400);

  const payload = await parseJsonOrForm(request);
  const intent = String(payload.intent ?? "edit");
  if (intent === "edit") {
    const client = createCommunityServiceClient(locals);
    let audience;
    try {
      audience = await resolveCommunityAudience(client, "reply", replyId);
    } catch {
      return json({ok:false,error:"Discussion lookup unavailable."},503);
    }
    if (audience !== "public_commons") {
      return json({ok:false,error:"Reply not found."},404);
    }
  }
  if(intent !== "edit" && !["hide","delete","restore"].includes(intent))return parkedCommonsResponse();
  if (intent !== "edit" && !isAdminProfile(locals.profile)) return json({ ok: false, error: "Not found." }, 404);
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
    const redirectTo = safeRedirectTo(payload.redirectTo);
    if (result.ok && redirectTo) return redirect(redirectTo, 303);
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


