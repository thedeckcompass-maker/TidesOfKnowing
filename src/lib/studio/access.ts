import type { User } from "@supabase/supabase-js";
import { isAdminProfile } from "../community/auth";
import type { CommunityProfile } from "../community/types";

export function studioAccessResponse(
  user: User | null | undefined,
  profile: CommunityProfile | null | undefined,
): Response | null {
  if (!user) {
    return new Response(null, {
      status: 303,
      headers: { Location: "/auth/register/" },
    });
  }

  if (!isAdminProfile(profile)) {
    return new Response(null, { status: 404, statusText: "Not Found" });
  }

  return null;
}
