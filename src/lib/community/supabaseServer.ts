import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, parseCookieHeader, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import { communityEnv } from "./env";

type AstroCookieStoreWithSet = AstroCookies & {
  set: AstroCookies["set"];
};

function toAstroCookieOptions(options: CookieOptionsWithName) {
  return {
    domain: options.domain,
    expires: options.expires,
    httpOnly: options.httpOnly,
    maxAge: options.maxAge,
    path: options.path ?? "/",
    sameSite: options.sameSite,
    secure: options.secure,
  };
}

export function appendAuthResponseCookies(response: Response, cookies: AstroCookies): Response {
  for (const cookieHeader of cookies.headers()) {
    response.headers.append("set-cookie", cookieHeader);
  }

  response.headers.set("cache-control", "private, no-cache, no-store, must-revalidate, max-age=0");
  response.headers.set("expires", "0");
  response.headers.set("pragma", "no-cache");

  return response;
}

export function authRedirect(
  location: string,
  cookies: AstroCookies,
  status: 303 | 307 | 308 = 303,
): Response {
  return appendAuthResponseCookies(
    new Response(null, {
      status,
      headers: {
        Location: location,
      },
    }),
    cookies,
  );
}

export function createCommunityServerClient(
  request: Request,
  cookies: AstroCookies,
  locals?: unknown,
  responseHeaders?: Headers,
): SupabaseClient {
  const env = communityEnv(locals);

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase is not configured.");
  }

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet, headers) {
        const store = cookies as AstroCookieStoreWithSet;
        if (typeof store.set !== "function") return;

        cookiesToSet.forEach(({ name, value, options }) => {
          store.set(name, value, toAstroCookieOptions(options));
        });

        if (responseHeaders) {
          Object.entries(headers).forEach(([key, value]) => {
            responseHeaders.set(key, value);
          });
        }
      },
    },
  }) as SupabaseClient;
}

export function createCommunityServiceClient(locals?: unknown): SupabaseClient {
  const env = communityEnv(locals);

  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Supabase service role is not configured.");
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as SupabaseClient;
}
