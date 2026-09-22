import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../lib/studio/access";
import { parseStudioCardUpdate } from "../../../../lib/studio/validation";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  const accessResponse = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (accessResponse) return accessResponse;
  const cardId = params.id;
  if (!cardId || !locals.supabase) return new Response("Not found", { status: 404 });

  const form = await request.formData();
  const projectId = typeof form.get("project_id") === "string" ? String(form.get("project_id")) : "";
  if (!projectId) return new Response("Not found", { status: 404 });
  const parsed = parseStudioCardUpdate(form);
  if (!parsed.ok) {
    return new Response(null, {
      status: 303,
      headers: { Location: `/studio/projects/${projectId}/cards/${cardId}/?error=${encodeURIComponent(parsed.error)}` },
    });
  }

  const { data: current, error: currentError } = await locals.supabase
    .from("studio_cards")
    .select("content")
    .eq("id", cardId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (currentError || !current) return new Response("Not found", { status: 404 });

  const nextValue = {
    ...parsed.value,
    content: {
      ...((current.content as Record<string, unknown> | null) ?? {}),
      ...parsed.value.content,
    },
  };

  const { error } = await locals.supabase
    .from("studio_cards")
    .update(nextValue)
    .eq("id", cardId)
    .eq("project_id", projectId);

  const location = error
    ? `/studio/projects/${projectId}/cards/${cardId}/?error=${encodeURIComponent("The card could not be saved.")}`
    : `/studio/projects/${projectId}/cards/${cardId}/?saved=1`;
  if (error) console.error("Unable to update Studio card:", error);
  return new Response(null, { status: 303, headers: { Location: location } });
};
