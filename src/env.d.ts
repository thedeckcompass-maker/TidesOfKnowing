/// <reference types="astro/client" />

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { CommunityProfile } from "./lib/community/types";

declare global {
  namespace App {
    interface Locals {
      supabase?: SupabaseClient;
      user?: User | null;
      profile?: CommunityProfile | null;
    }
  }
}

export {};
