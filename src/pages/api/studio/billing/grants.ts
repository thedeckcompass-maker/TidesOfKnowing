import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../lib/community/auth";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { isStudioPlanCode, STUDIO_PLANS } from "../../../../lib/studio/billing";

export const prerender = false;
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !isAdminProfile(locals.profile)) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const userId = String(form.get("user_id") ?? "").trim();
  const planCode = form.get("plan_code");
  const accessMode = String(form.get("access_mode") ?? "write");
  const readOnlyValue = String(form.get("read_only_until") ?? "").trim();
  const readOnlyUntil = readOnlyValue ? new Date(readOnlyValue) : null;
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !isStudioPlanCode(planCode) || !["write", "read_only", "none"].includes(accessMode)) {
    return new Response(null, { status: 303, headers: { Location: "/studio/admin/access/?error=Check%20the%20grant%20fields." } });
  }
  if (readOnlyUntil && Number.isNaN(readOnlyUntil.getTime())) {
    return new Response(null, { status: 303, headers: { Location: "/studio/admin/access/?error=Check%20the%20read-only%20date." } });
  }
  const service = createCommunityServiceClient(locals);
  const status = accessMode === "write" ? "manual" : accessMode === "read_only" ? "canceled" : "expired";
  const { error } = await service.from("studio_entitlements").upsert({
    user_id: userId,
    plan_code: planCode,
    status,
    access_mode: accessMode,
    minimum_payments: STUDIO_PLANS[planCode].minimumPayments,
    manual_grant: true,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    read_only_until: accessMode === "read_only" && readOnlyUntil ? readOnlyUntil.toISOString() : null,
  }, { onConflict: "user_id" });
  if (!error) await service.from("studio_entitlement_audit").insert({ user_id: userId, actor_id: locals.user.id, action: "manual_grant", plan_code: planCode, detail: { access_mode: accessMode } });
  return new Response(null, { status: 303, headers: { Location: error ? `/studio/admin/access/?error=${encodeURIComponent("The manual grant could not be saved.")}` : "/studio/admin/access/?saved=1" } });
};
