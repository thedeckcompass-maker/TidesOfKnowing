import type { APIRoute } from "astro";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import { isStudioPlanCode } from "../../../lib/studio/billing";

export const prerender = false;
export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json().catch(() => ({})) as { event?: string; plan?: string };
  if (body.event !== "offer_view") return new Response(null, { status: 204 });
  try {
    const service = createCommunityServiceClient(locals);
    await service.from("studio_analytics_events").insert({ event_name: "offer_view", user_id: locals.user?.id ?? null, plan_code: isStudioPlanCode(body.plan) ? body.plan : null, source: "public_offer" });
  } catch {
    // Analytics must never interrupt the public offer experience.
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
};
