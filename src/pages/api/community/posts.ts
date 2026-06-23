import type { APIRoute } from "astro";
import { canContribute } from "../../../lib/community/auth";
import { json, parseJsonOrForm } from "../../../lib/community/api";
import { createCommunityPost } from "../../../lib/community/mutations";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import { communityPostPath } from "../../../lib/community/slugs";
import { validatePostInput } from "../../../lib/community/validation";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!locals.user || !canContribute(locals.profile)) {
    return json({ ok: false, error: "Please log in to create a post." }, 401);
  }

  const payload = await parseJsonOrForm(request);
  const validation = validatePostInput({
    sectionKey: payload.sectionKey,
    title: payload.title,
    body: payload.body,
  });

  if (!validation.ok) {
    return json({ ok: false, error: validation.error }, 400);
  }

  const service = createCommunityServiceClient(locals);
  const result = await createCommunityPost(service, {
    authorId: locals.user.id,
    ...validation.value,
  });

  if (!result.ok) {
    return json({ ok: false, error: result.error }, result.status ?? 500);
  }

  const location = communityPostPath(result.value.slug);
  const acceptsJson = request.headers.get("accept")?.includes("application/json");
  if (acceptsJson) {
    return json({ ok: true, slug: result.value.slug, location });
  }

  return redirect(location, 303);
};
