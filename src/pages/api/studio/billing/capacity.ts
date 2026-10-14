import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../lib/community/auth";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { isStudioPlanCode } from "../../../../lib/studio/billing";

export const prerender = false;
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !isAdminProfile(locals.profile)) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const planCode = form.get("plan_code");
  const capacityValue = String(form.get("capacity_limit") ?? "").trim();
  const capacityLimit = capacityValue === "" ? null : Number(capacityValue);
  if (!isStudioPlanCode(planCode) || (capacityLimit !== null && (!Number.isInteger(capacityLimit) || capacityLimit < 0))) {
    return new Response(null, { status: 303, headers: { Location: "/studio/admin/access/?error=Capacity%20must%20be%20a%20whole%20number%20or%20blank." } });
  }
  const service = createCommunityServiceClient(locals);
  const { error } = await service.from("studio_plan_capacity").update({ capacity_limit: capacityLimit, updated_at: new Date().toISOString() }).eq("plan_code", planCode);
  return new Response(null, {
    status: 303,
    headers: { Location: error ? `/studio/admin/access/?error=${encodeURIComponent("The capacity limit could not be saved.")}` : "/studio/admin/access/?capacity=1" },
  });
};
