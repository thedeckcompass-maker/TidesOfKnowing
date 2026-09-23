import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../../lib/studio/access";
import { getStudioProductionPlan, getStudioProject } from "../../../../../lib/studio/queries";
import { parseStudioProductionPlan } from "../../../../../lib/studio/validation";

export const prerender = false;

function redirect(projectId: string, key: "saved" | "error", message: string): Response {
  return new Response(null, { status: 303, headers: {
    Location: `/studio/projects/${projectId}/production/?${key}=${encodeURIComponent(message)}`,
  } });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  const projectId = params.id;
  if (!projectId || !locals.supabase || !await getStudioProject(locals.supabase, projectId)) {
    return new Response("Not found", { status: 404 });
  }

  const form = await request.formData();
  const parsed = parseStudioProductionPlan(form);
  if (!parsed.ok) return redirect(projectId, "error", parsed.error);

  const existing = await getStudioProductionPlan(locals.supabase, projectId);
  const expectedVersion = Number(form.get("version_number") ?? 0);
  if (existing && expectedVersion !== existing.version_number) {
    return redirect(projectId, "error", "This plan changed in another session. Review the latest version before saving.");
  }
  if (!existing && expectedVersion !== 0) {
    return redirect(projectId, "error", "This plan changed in another session. Reload it before saving.");
  }

  const query = existing
    ? locals.supabase.from("studio_production_plans").update(parsed.value)
        .eq("project_id", projectId).eq("version_number", expectedVersion)
    : locals.supabase.from("studio_production_plans").insert({ project_id: projectId, ...parsed.value });
  const { data, error } = await query.select("version_number").maybeSingle();
  if (error || !data) {
    console.error("Unable to save Studio production plan:", error);
    return redirect(projectId, "error", "The production plan could not be saved. Reload and try again.");
  }
  return redirect(projectId, "saved", String(data.version_number));
};
