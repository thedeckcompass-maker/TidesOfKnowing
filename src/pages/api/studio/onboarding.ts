import type { APIRoute } from "astro";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import { studioWriteAccessResponse } from "../../../lib/studio/access";

export const prerender = false;
const pathways = new Set(["personal", "independent", "commercial"]);
const stages = new Set(["idea", "structure", "writing", "artwork", "production", "launch"]);

export const POST: APIRoute = async ({ request, locals }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  if (!locals.user) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const pathway = String(form.get("pathway") ?? "");
  const deckStage = String(form.get("deck_stage") ?? "");
  const primaryGoal = String(form.get("primary_goal") ?? "").trim().slice(0, 1000);
  if (!pathways.has(pathway) || !stages.has(deckStage) || primaryGoal.length < 10) return new Response(null, { status: 303, headers: { Location: "/studio/onboarding/?error=Complete%20each%20onboarding%20field." } });
  const service = createCommunityServiceClient(locals);
  const now = new Date().toISOString();
  await service.from("studio_onboarding").upsert({ user_id: locals.user.id, pathway, deck_stage: deckStage, primary_goal: primaryGoal, completed_at: now }, { onConflict: "user_id" });
  await service.from("studio_entitlements").update({ onboarding_completed_at: now }).eq("user_id", locals.user.id);
  await service.from("studio_analytics_events").insert({ event_name: "onboarding_complete", user_id: locals.user.id, plan_code: locals.studioEntitlement?.plan_code, source: "studio" });
  return new Response(null, { status: 303, headers: { Location: "/studio/?onboarded=1" } });
};
