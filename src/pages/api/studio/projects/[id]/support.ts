import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../../lib/studio/access";

export const prerender = false;

const SUPPORT_SCOPES = ["project", "cards", "guidebook"] as const;

function supportWeek(): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

function supportRedirect(projectId: string, key: "created" | "error", value: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/projects/${projectId}/support/?${key}=${encodeURIComponent(value)}` },
  });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  const projectId = params.id;
  if (!projectId || !locals.supabase || !locals.user) return new Response("Not found", { status: 404 });

  const planCode = locals.studioEntitlement?.plan_code;
  if (planCode !== "circle" && planCode !== "private") {
    return supportRedirect(projectId, "error", "Weekly plan support requires Guided Deck Circle or Private Deck Partnership access.");
  }

  const form = await request.formData();
  const focusQuestion = String(form.get("focus_question") ?? "").trim().slice(0, 1200);
  const contextExcerpt = String(form.get("context_excerpt") ?? "").trim().slice(0, 5000);
  if (focusQuestion.length < 10) {
    return supportRedirect(projectId, "error", "Add one clear weekly focus question.");
  }

  const rawScopes = [...new Set(form.getAll("review_scopes").filter((value): value is string => typeof value === "string"))];
  const invalidScope = rawScopes.some((scope) => !SUPPORT_SCOPES.includes(scope as (typeof SUPPORT_SCOPES)[number]));
  const reviewScopes = rawScopes.filter((scope): scope is (typeof SUPPORT_SCOPES)[number] => SUPPORT_SCOPES.includes(scope as (typeof SUPPORT_SCOPES)[number]));

  if (planCode === "circle" && form.get("group_share_confirmed") !== "on") {
    return supportRedirect(projectId, "error", "Confirm that the submitted question and excerpt may be discussed in your Circle session.");
  }
  if (planCode === "private" && (invalidScope || !reviewScopes.includes("project") || form.get("private_consent") !== "on")) {
    return supportRedirect(projectId, "error", "Choose valid private review scopes and grant time-limited access.");
  }

  const { error } = await locals.supabase.from("studio_support_requests").insert({
    project_id: projectId,
    owner_id: locals.user.id,
    plan_code: planCode,
    support_kind: planCode === "circle" ? "circle_weekly" : "private_weekly",
    support_week: supportWeek(),
    focus_question: focusQuestion,
    context_excerpt: contextExcerpt,
    review_scopes: planCode === "private" ? reviewScopes : [],
    group_share_confirmed: planCode === "circle",
  });

  if (error) {
    const message = error.code === "23505"
      ? "This week’s included support focus has already been submitted."
      : "The weekly support focus could not be saved.";
    console.error("Unable to create Studio support request:", error);
    return supportRedirect(projectId, "error", message);
  }

  return supportRedirect(projectId, "created", "1");
};
