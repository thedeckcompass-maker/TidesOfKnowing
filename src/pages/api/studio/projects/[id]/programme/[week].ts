import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../../../lib/studio/access";
import { parseStudioProgrammeProgress } from "../../../../../../lib/studio/validation";

export const prerender = false;

function programmeRedirect(projectId: string, key: "saved" | "error", value: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/programme/?${key}=${encodeURIComponent(value)}` },
  });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  const projectId = params.id;
  const week = Number(params.week);
  if (!projectId || !locals.supabase || !Number.isInteger(week) || week < 1 || week > 12) {
    return new Response("Not found", { status: 404 });
  }

  const parsed = parseStudioProgrammeProgress(await request.formData());
  if (!parsed.ok) return programmeRedirect(projectId, "error", parsed.error);

  const { data: enrolment, error: enrolmentError } = await locals.supabase
    .from("studio_programme_enrolments")
    .select("starts_on")
    .eq("project_id", projectId)
    .maybeSingle();
  if (enrolmentError || !enrolment) {
    return programmeRedirect(projectId, "error", "Start the programme before recording progress.");
  }

  const unlockDate = new Date(`${enrolment.starts_on}T00:00:00Z`);
  unlockDate.setUTCDate(unlockDate.getUTCDate() + ((week - 1) * 7));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (today < unlockDate) {
    return programmeRedirect(projectId, "error", "That module is not available yet.");
  }

  const { error } = await locals.supabase.from("studio_programme_progress").upsert(
    { project_id: projectId, week_number: week, ...parsed.value },
    { onConflict: "project_id,week_number" },
  );

  if (error) {
    console.error("Unable to save Studio programme progress:", error);
    return programmeRedirect(projectId, "error", "Programme progress could not be saved.");
  }

  return programmeRedirect(projectId, "saved", String(week));
};
