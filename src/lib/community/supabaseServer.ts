import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import { communityEnv } from "./env";

type CookiePair = {
  name: string;
  value: string;
};

type AstroCookieStoreWithGetAll = AstroCookies & {
  getAll(): CookiePair[];
};

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

function parseCookieHeader(cookieHeader: string | null | undefined): CookiePair[] {
  if (!cookieHeader) return [];

  return cookieHeader
    .split(";")
    .map((part) => {
      const [rawName, ...rawValueParts] = part.trim().split("=");
      const rawValue = rawValueParts.join("=");

      if (!rawName || !rawValue) return null;

      return {
        name: decodeURIComponent(rawName),
        value: decodeURIComponent(rawValue),
      } satisfies CookiePair;
    })
    .filter((cookie): cookie is CookiePair => Boolean(cookie));
}

export function createCommunityServerClient(
  cookies: AstroCookies,
  locals?: unknown,
  cookieHeader?: string | null,
): SupabaseClient {
  const env = communityEnv(locals);

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase is not configured.");
  }

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        const store = cookies as AstroCookieStoreWithGetAll;
        if (typeof store.getAll === "function") {
          return store.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          })) satisfies CookiePair[];
        }

        return parseCookieHeader(cookieHeader);
      },
      setAll(cookiesToSet) {
        const store = cookies as AstroCookieStoreWithSet;
        if (typeof store.set !== "function") return;

        cookiesToSet.forEach(({ name, value, options }) => {
          store.set(name, value, toAstroCookieOptions(options));
        });
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
