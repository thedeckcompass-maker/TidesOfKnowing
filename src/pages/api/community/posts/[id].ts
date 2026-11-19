import {resolveCommunityAudience} from "../../../../lib/community/studioAudience";
import {parkedCommonsResponse} from "../../../../lib/community/practiceCommons";
import type { APIRoute } from "astro";
import { canContribute, isAdminProfile } from "../../../../lib/community/auth";
import { json, parseJsonOrForm } from "../../../../lib/community/api";
import {
  setPostPinned,
  setPostStatus,
  updateCommunityPost,
} from "../../../../lib/community/mutations";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { communityPostPath } from "../../../../lib/community/slugs";
import { validatePostInput } from "../../../../lib/community/validation";

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

  const postId = params.id;
  if (!postId) return json({ ok: false, error: "Missing post id." }, 400);

  const payload = await parseJsonOrForm(request);
  const intent = String(payload.intent ?? "edit");
  if (intent === "edit") {
    const client = createCommunityServiceClient(locals);
    let audience;
    try {
      audience = await resolveCommunityAudience(client, "post", postId);
    } catch {
      return json({ok:false,error:"Discussion lookup unavailable."},503);
    }
    if (audience !== "public_commons") {
      return json({ok:false,error:"Post not found."},404);
    }
  }
  if(intent !== "edit" && !["pin","unpin","hide","delete","restore","lock","unlock"].includes(intent))return parkedCommonsResponse();
  if (intent !== "edit" && !isAdminProfile(locals.profile)) return json({ ok: false, error: "Not found." }, 404);
  const service = createCommunityServiceClient(locals);
  const isAdmin = isAdminProfile(locals.profile);

  if (intent === "pin" || intent === "unpin") {
    if (!isAdmin || !locals.profile) return json({ ok: false, error: "Not found." }, 404);
    const result = await setPostPinned(service, {
      adminId: locals.profile.id,
      postId,
      pinned: intent === "pin",
      reason: typeof payload.reason === "string" ? payload.reason : undefined,
    });
    const redirectTo = safeRedirectTo(payload.redirectTo);
    if (result.ok && redirectTo) return redirect(redirectTo, 303);
    return json({ ok: result.ok, error: result.ok ? undefined : result.error }, result.ok ? 200 : (result.status ?? 500));
  }

  if (intent === "hide" || intent === "delete" || intent === "restore" || intent === "lock" || intent === "unlock") {
    if (!isAdmin || !locals.profile) return json({ ok: false, error: "Not found." }, 404);
    const status =
      intent === "delete" ? "deleted" : intent === "restore" || intent === "unlock" ? "published" : intent === "lock" ? "locked" : "hidden";
    const result = await setPostStatus(service, {
      adminId: locals.profile.id,
      postId,
      status,
      reason: typeof payload.reason === "string" ? payload.reason : undefined,
      action: intent === "unlock" ? "unlock_post" : undefined,
    });
    const redirectTo = safeRedirectTo(payload.redirectTo);
    if (result.ok && redirectTo) return redirect(redirectTo, 303);
    return json({ ok: result.ok, error: result.ok ? undefined : result.error }, result.ok ? 200 : (result.status ?? 500));
  }

  const validation = validatePostInput({
    sectionKey: payload.sectionKey,
    title: payload.title,
    body: payload.body,
    postType: payload.postType,
    fieldNoteConsideration: payload.fieldNoteConsideration,
  });

  if (!validation.ok) {
    return json({ ok: false, error: validation.error }, 400);
  }

  const result = await updateCommunityPost(service, {
    postId,
    userId: locals.user.id,
    sectionKey: validation.value.sectionKey,
    isAdmin,
    title: validation.value.title,
    body: validation.value.body,
    postType: validation.value.postType,
    fieldNoteConsideration: validation.value.fieldNoteConsideration,
  });

  if (!result.ok) {
    return json({ ok: false, error: result.error }, result.status ?? 500);
  }

  return redirect(communityPostPath(result.value.slug), 303);
};




