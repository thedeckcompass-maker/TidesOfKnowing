import {isParkedCommonsPath,parkedCommonsResponse} from "./lib/community/practiceCommons";
import {safeAuthCallbackRedirect} from "./lib/community/authCallback";
import { defineMiddleware } from "astro:middleware";
import {studioRuntimeConfiguration} from "./lib/studio/runtimeEnvironment";
import { composeDcsRuntime, needsDcsRuntime } from "./lib/studio/runtimeComposition";
import { getAuthContext } from "./lib/community/auth";
import { hasSupabaseConfig } from "./lib/community/env";
import { createCommunityServerClient } from "./lib/community/supabaseServer";

export const onRequest = defineMiddleware(async (context, next) => {
  if(isParkedCommonsPath(new URL(context.request.url).pathname))return parkedCommonsResponse();
  const continueRequest = async () => {
    const response = await next();
    const path = new URL(context.request.url).pathname;
    if(context.request.method === "GET" && path.startsWith("/studio/") && ["/auth/login/","/auth/register/"].includes(response.headers.get("Location") ?? "")){
      const headers = new Headers(response.headers);
      headers.set("Location", "/auth/login/?redirectTo=" + encodeURIComponent(safeAuthCallbackRedirect(path)));
      headers.set("Cache-Control", "private, no-store");
      return new Response(response.body,{status:response.status,headers});
    }
    return response;
  };
  // Application compatibility boundary: existing server-only consumers share the
  // trusted Worker bindings, never request-controlled or browser configuration.
  if (!context.isPrerendered) {
    const { env } = await import("cloudflare:workers");
    context.locals.serverRuntime = { env };
  }
  if (!hasSupabaseConfig(context.locals)) {
    context.locals.supabase = undefined;
    context.locals.user = null;
    context.locals.profile = null;
    return continueRequest();
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
      const response = await continueRequest();
      authResponseHeaders.forEach((value, key) => response.headers.set(key, value));
      return response;
    }

    const { user, profile } = await getAuthContext(supabase, context.locals);
    context.locals.user = user;
    context.locals.profile = profile;

    // Optional Studio providers remain disabled by default.
    // Optional-provider faults must not sign users out of the established public site.
    if(needsDcsRuntime(new URL(context.request.url).pathname)){
      try{Object.assign(context.locals,await composeDcsRuntime(context.locals,studioRuntimeConfiguration(context.locals.serverRuntime?.env,new URL(context.request.url).origin)));}
      catch{Object.assign(context.locals,await composeDcsRuntime(context.locals));console.error('Optional Studio provider configuration unavailable.');}
    }

    const response = await continueRequest();
    authResponseHeaders.forEach((value, key) => response.headers.set(key, value));
    return response;
  } catch (error) {
    console.error("Community auth middleware failed:", error);
    context.locals.user = null;
    context.locals.profile = null;
  }

  return continueRequest();
});
