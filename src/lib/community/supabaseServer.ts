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

export function createCommunityServerClient(
  cookies: AstroCookies,
  locals?: unknown,
): SupabaseClient {
  const env = communityEnv(locals);

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase is not configured.");
  }

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        const store = cookies as AstroCookieStoreWithGetAll;
        return store.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        })) satisfies CookiePair[];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, toAstroCookieOptions(options));
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
