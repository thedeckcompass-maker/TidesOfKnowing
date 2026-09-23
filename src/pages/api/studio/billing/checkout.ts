import type { APIRoute } from "astro";
import Stripe from "stripe";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { studioSignInResponse } from "../../../../lib/studio/access";
import { assertStripeTestMode, isStudioPlanCode, STUDIO_PLANS, studioStripeTestConfig } from "../../../../lib/studio/billing";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, url }) => {
  const signIn = studioSignInResponse(locals.user, "/studio/enrol/");
  if (signIn) return signIn;
  if (!locals.supabase || !locals.user?.email) return new Response("Studio billing is unavailable.", { status: 503 });
  const form = await request.formData();
  const planCode = form.get("plan");
  if (!isStudioPlanCode(planCode)) return new Response("Unknown Studio plan.", { status: 400 });
  const config = studioStripeTestConfig(locals);
  try { assertStripeTestMode(config.secretKey); } catch { return new Response("Studio test checkout is not configured.", { status: 503 }); }
  const price = config.prices[planCode];
  if (!price.startsWith("price_")) return new Response("This Studio test plan is not configured.", { status: 503 });

  const { data: reservation } = await locals.supabase.rpc("studio_reserve_checkout", { target_plan: planCode });
  if (!reservation?.ok) {
    const message = reservation?.error === "capacity" ? "That plan is currently at capacity." : "A checkout place could not be reserved.";
    return new Response(null, { status: 303, headers: { Location: `/studio/enrol/?plan=${planCode}&error=${encodeURIComponent(message)}` } });
  }

  const stripe = new Stripe(config.secretKey);
  try {
    const origin = url.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: reservation.reservation_id,
      customer_email: locals.user.email,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { studio_user_id: locals.user.id, studio_plan_code: planCode, studio_reservation_id: reservation.reservation_id },
      subscription_data: { metadata: { studio_user_id: locals.user.id, studio_plan_code: planCode, minimum_payments: String(STUDIO_PLANS[planCode].minimumPayments) } },
      success_url: `${origin}/studio/onboarding/?checkout=success`,
      cancel_url: `${origin}/studio/enrol/?plan=${planCode}&cancelled=1`,
    });
    const service = createCommunityServiceClient(locals);
    await service.from("studio_checkout_reservations").update({ stripe_checkout_session_id: session.id }).eq("id", reservation.reservation_id);
    await service.from("studio_analytics_events").insert({ event_name: "checkout_start", user_id: locals.user.id, plan_code: planCode, source: "offer" });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return Response.redirect(session.url, 303);
  } catch (error) {
    const service = createCommunityServiceClient(locals);
    await service.from("studio_checkout_reservations").update({ status: "failed" }).eq("id", reservation.reservation_id);
    console.error("Studio test checkout failed:", error);
    return new Response(null, { status: 303, headers: { Location: `/studio/enrol/?plan=${planCode}&error=${encodeURIComponent("Test checkout could not be started.")}` } });
  }
};
