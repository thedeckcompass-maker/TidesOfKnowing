import { defineMiddleware } from "astro:middleware";
import { getAuthContext } from "./lib/community/auth";
import { hasSupabaseConfig } from "./lib/community/env";
import { createCommunityServerClient } from "./lib/community/supabaseServer";

export const onRequest = defineMiddleware(async (context, next) => {
  if (!hasSupabaseConfig(context.locals)) {
    context.locals.supabase = undefined;
    context.locals.user = null;
    context.locals.profile = null;
    return next();
  }

  try {
    const supabase = createCommunityServerClient(context.cookies, context.locals);
    context.locals.supabase = supabase;

    const { user, profile } = await getAuthContext(supabase, context.locals);
    context.locals.user = user;
    context.locals.profile = profile;
  } catch (error) {
    console.error("Community auth middleware failed:", error);
    context.locals.user = null;
    context.locals.profile = null;
  }

  return next();
});
