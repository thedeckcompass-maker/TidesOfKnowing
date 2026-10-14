import { defineMiddleware } from "astro:middleware";
import { getAuthContext } from "./lib/community/auth";
import { hasSupabaseConfig } from "./lib/community/env";
import { createCommunityServerClient } from "./lib/community/supabaseServer";
import type { StudioEntitlement } from "./lib/studio/billing";

export const onRequest = defineMiddleware(async (context, next) => {
  if (!hasSupabaseConfig(context.locals)) {
    context.locals.supabase = undefined;
    context.locals.user = null;
    context.locals.profile = null;
    context.locals.studioEntitlement = null;
    return next();
  }

  try {
    const authResponseHeaders = new Headers();
    const supabase = createCommunityServerClient(
      context.request,
      context.cookies,
      context.locals,
      authResponseHeaders,
    );
    context.locals.supabase = supabase;

    if (new URL(context.request.url).pathname.startsWith("/auth/")) {
      context.locals.user = null;
      context.locals.profile = null;
      context.locals.studioEntitlement = null;
      const response = await next();
      authResponseHeaders.forEach((value, key) => response.headers.set(key, value));
      return response;
    }

    const { user, profile } = await getAuthContext(supabase, context.locals);
    context.locals.user = user;
    context.locals.profile = profile;
    context.locals.studioEntitlement = null;
    if (user) {
      const { data } = await supabase
        .from("studio_entitlements")
        .select("user_id, plan_code, status, access_mode, stripe_customer_id, stripe_subscription_id, current_period_end, read_only_until, paid_invoice_count, minimum_payments, onboarding_completed_at")
        .eq("user_id", user.id)
        .maybeSingle();
      context.locals.studioEntitlement = (data as StudioEntitlement | null) ?? null;
    }

    const response = await next();
    authResponseHeaders.forEach((value, key) => response.headers.set(key, value));
    return response;
  } catch (error) {
    console.error("Community auth middleware failed:", error);
    context.locals.user = null;
    context.locals.profile = null;
    context.locals.studioEntitlement = null;
  }

  return next();
});
