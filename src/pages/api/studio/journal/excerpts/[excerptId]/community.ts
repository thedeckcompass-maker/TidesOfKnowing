import type { APIRoute } from "astro";
import { createPostSlug } from "../../../../../../lib/community/slugs";
import { studioWriteAccessResponse } from "../../../../../../lib/studio/access";
import { parseStudioCommunityShare } from "../../../../../../lib/studio/validation";

export const prerender = false;

type ShareResult = {
  ok?: boolean;
  error?: string;
  slug?: string;
};

export const POST: APIRoute = async ({ request, locals, params }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  if (!locals.supabase || !params.excerptId) return new Response("Not found", { status: 404 });

  const form = await request.formData();
  const projectId = String(form.get("project_id") ?? "");
  const entryId = String(form.get("entry_id") ?? "");
  const base = `/studio/projects/${projectId}/journal/${entryId}/`;
  const parsed = parseStudioCommunityShare(form);
  if (!parsed.ok) {
    return new Response(null, { status: 303, headers: { Location: `${base}?error=${encodeURIComponent(parsed.error)}` } });
  }

  const { data: excerpt, error: excerptError } = await locals.supabase
    .from("studio_journal_excerpts")
    .select("title")
    .eq("id", params.excerptId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (excerptError || !excerpt) {
    return new Response(null, { status: 303, headers: { Location: `${base}?error=${encodeURIComponent("The controlled excerpt is not available.")}` } });
  }

  const { data, error } = await locals.supabase.rpc("studio_share_journal_excerpt", {
    target_excerpt_id: params.excerptId,
    target_audience: parsed.value.audience,
    target_topic: parsed.value.topic,
    target_slug: createPostSlug(String((excerpt as { title: string }).title)),
    deliberate_share_confirmed: parsed.value.deliberateShareConfirmed,
    public_visibility_confirmed: parsed.value.publicVisibilityConfirmed,
  });
  const result = (data ?? {}) as ShareResult;
  if (error || !result.ok) {
    const message = result.error === "already_shared"
      ? "This controlled excerpt already has an active community copy."
      : "The community copy could not be created.";
    return new Response(null, { status: 303, headers: { Location: `${base}?error=${encodeURIComponent(message)}` } });
  }

  return new Response(null, { status: 303, headers: { Location: `${base}?shared=1` } });
};
