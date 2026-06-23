import type { APIRoute } from "astro";
import { canContribute } from "../../../../../lib/community/auth";
import { json, parseJsonOrForm } from "../../../../../lib/community/api";
import { createCommunityReply } from "../../../../../lib/community/mutations";
import { sendReplyNotification } from "../../../../../lib/community/notifications";
import { createCommunityServiceClient } from "../../../../../lib/community/supabaseServer";
import { communityPostPath } from "../../../../../lib/community/slugs";
import { validateReplyInput } from "../../../../../lib/community/validation";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals, redirect, url }) => {
  if (!locals.user || !canContribute(locals.profile)) {
    return json({ ok: false, error: "Please log in to reply." }, 401);
  }

  const postId = params.id;
  if (!postId) return json({ ok: false, error: "Missing post id." }, 400);

  const payload = await parseJsonOrForm(request);
  const validation = validateReplyInput({ body: payload.body });
  if (!validation.ok) {
    return json({ ok: false, error: validation.error }, 400);
  }

  const service = createCommunityServiceClient(locals);
  const result = await createCommunityReply(service, {
    postId,
    authorId: locals.user.id,
    body: validation.value.body,
  });

  if (!result.ok) {
    return json({ ok: false, error: result.error }, result.status ?? 500);
  }

  await sendReplyNotification(service, {
    recipientUserId: result.value.postAuthorId,
    replyId: result.value.id,
    postId,
    postSlug: result.value.postSlug,
    actorUserId: locals.user.id,
    origin: url.origin,
    locals,
  });

  return redirect(`${communityPostPath(result.value.postSlug)}#replies`, 303);
};
