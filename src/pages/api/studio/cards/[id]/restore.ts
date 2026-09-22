import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../../lib/studio/access";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  const accessResponse = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (accessResponse) return accessResponse;
  const cardId = params.id;
  if (!cardId || !locals.supabase) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const projectId = typeof form.get("project_id") === "string" ? String(form.get("project_id")) : "";
  const versionId = typeof form.get("version_id") === "string" ? String(form.get("version_id")) : "";
  if (!projectId || !versionId) return new Response("Not found", { status: 404 });

  const { data: version, error: versionError } = await locals.supabase
    .from("studio_card_versions")
    .select("snapshot")
    .eq("id", versionId)
    .eq("card_id", cardId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (versionError || !version?.snapshot) return new Response("Not found", { status: 404 });

  const snapshot = version.snapshot as Record<string, unknown>;
  const { error } = await locals.supabase
    .from("studio_cards")
    .update({
      title: snapshot.title,
      card_number: snapshot.card_number,
      family_id: snapshot.family_id,
      sort_order: snapshot.sort_order,
      status: snapshot.status,
      content: snapshot.content,
    })
    .eq("id", cardId)
    .eq("project_id", projectId);
  if (error) console.error("Unable to restore Studio card version:", error);
  const suffix = error ? `error=${encodeURIComponent("The version could not be restored.")}` : "restored=1";
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/cards/${cardId}/?${suffix}` },
  });
};
