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
  const currentVersion = Number(form.get("expected_current_version"));
  if (!projectId || !versionId || form.get("confirm_restore") !== "on"
    || !Number.isSafeInteger(currentVersion) || currentVersion < 2) {
    return new Response("Review the earlier version and confirm before restoring.", { status: 400 });
  }

  const { data: version, error: versionError } = await locals.supabase
    .from("studio_card_versions")
    .select("version_number")
    .eq("id", versionId)
    .eq("card_id", cardId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (versionError || !version || version.version_number >= currentVersion) return new Response("Not found", { status: 404 });

  const { data: restoredVersion, error } = await locals.supabase.rpc("studio_restore_card_version", {
    target_project_id: projectId,
    target_card_id: cardId,
    source_version_id: versionId,
    expected_current_version: currentVersion,
  });
  if (error) console.error("Unable to restore Studio card version:", error);
  const suffix = error || !Number.isSafeInteger(restoredVersion)
    ? `error=${encodeURIComponent(error?.code === "40001" ? "This card changed since you reviewed it. Review the versions again before restoring." : "The version could not be restored.")}`
    : `restoredFrom=${version.version_number}&version=${restoredVersion}`;
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/cards/${cardId}/?${suffix}` },
  });
};
