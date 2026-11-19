/// <reference types="astro/client" />

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { CommunityProfile } from "./lib/community/types";

type StudioRuntimeLocals =
  Awaited<ReturnType<
    typeof import("./lib/studio/runtimeComposition").composeDcsRuntime
  >>;
declare global {
  namespace App {
    interface Locals extends Partial<StudioRuntimeLocals> {
      serverRuntime?: { env: Record<string, unknown> };
      supabase?: SupabaseClient;
      user?: User | null;
      profile?: CommunityProfile | null;
    }
  }
}

export {};
