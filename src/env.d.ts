/// <reference types="astro/client" />

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { CommunityProfile } from "./lib/community/types";
import type { StudioEntitlement } from "./lib/studio/billing";

declare global {
  namespace App {
    interface Locals {
      supabase?: SupabaseClient;
      user?: User | null;
      profile?: CommunityProfile | null;
      studioEntitlement?: StudioEntitlement | null;
    }
  }
}

export {};
