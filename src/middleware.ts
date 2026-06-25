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
      const response = await next();
      authResponseHeaders.forEach((value, key) => response.headers.set(key, value));
      return response;
    }

    const { user, profile } = await getAuthContext(supabase, context.locals);
    context.locals.user = user;
    context.locals.profile = profile;

    const response = await next();
    authResponseHeaders.forEach((value, key) => response.headers.set(key, value));
    return response;
  } catch (error) {
    console.error("Community auth middleware failed:", error);
    context.locals.user = null;
    context.locals.profile = null;
  }

  return next();
});
