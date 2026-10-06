import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../../lib/studio/access";

export const prerender = false;
export const POST: APIRoute = async ({ request, locals, params }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  if (!locals.supabase || !locals.user || !params.id) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const question = String(form.get("priority_question") ?? "").trim().slice(0, 1200);
  const base = `/studio/projects/${params.id}/pulse/`;
  if (question.length < 10 || form.get("consent") !== "on") return new Response(null, { status: 303, headers: { Location: `${base}?error=${encodeURIComponent("Add one clear priority question and grant time-limited review consent.")}` } });
  const billingMonth = new Date().toISOString().slice(0, 7) + "-01";
  const { error } = await locals.supabase.from("studio_pulse_requests").insert({ project_id: params.id, owner_id: locals.user.id, billing_month: billingMonth, priority_question: question });
  const message = error?.code === "23505" ? "This month’s Project Pulse request has already been used." : "The Project Pulse request could not be saved.";
  return new Response(null, { status: 303, headers: { Location: error ? `${base}?error=${encodeURIComponent(message)}` : `${base}?created=1` } });
};
