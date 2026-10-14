import type { APIRoute } from "astro";
import Stripe from "stripe";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { studioAccessResponse } from "../../../../lib/studio/access";
import { assertStripeTestMode, studioStripeTestConfig } from "../../../../lib/studio/billing";

export const prerender = false;

export const POST: APIRoute = async ({ locals, url }) => {
  const access = studioAccessResponse(locals.user, locals.profile, "/studio/account/", locals.studioEntitlement);
  if (access) return access;
  const customer = locals.studioEntitlement?.stripe_customer_id;
  if (!customer) return new Response(null, { status: 303, headers: { Location: "/studio/account/?error=No%20test%20subscription%20is%20linked." } });
  const config = studioStripeTestConfig(locals);
  try { assertStripeTestMode(config.secretKey); } catch { return new Response("Studio test portal is not configured.", { status: 503 }); }
  const stripe = new Stripe(config.secretKey);
  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url: `${url.origin}/studio/account/`,
    ...(config.portalConfiguration ? { configuration: config.portalConfiguration } : {}),
  });
  const service = createCommunityServiceClient(locals);
  await service.from("studio_analytics_events").insert({ event_name: "portal_open", user_id: locals.user?.id, plan_code: locals.studioEntitlement?.plan_code, source: "account" });
  return Response.redirect(session.url, 303);
};
