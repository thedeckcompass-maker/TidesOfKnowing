import type { User } from "@supabase/supabase-js";
import { isAdminProfile } from "../community/auth";
import type { CommunityProfile } from "../community/types";
import { entitlementAllowsRead, entitlementAllowsWrite, type StudioEntitlement } from "./billing";

export function studioSignInResponse(user: User | null | undefined, returnTo = "/studio/"): Response | null {
  if (user) return null;
  const safeReturnTo = returnTo.startsWith("/studio/") ? returnTo : "/studio/";
  return new Response(null, {
    status: 303,
    headers: { Location: `/auth/register/?redirectTo=${encodeURIComponent(safeReturnTo)}` },
  });
}

export function studioAccessResponse(
  user: User | null | undefined,
  profile: CommunityProfile | null | undefined,
  returnTo = "/studio/",
  entitlement?: StudioEntitlement | null,
): Response | null {
  const signIn = studioSignInResponse(user, returnTo);
  if (signIn) return signIn;

  if (!isAdminProfile(profile) && !entitlementAllowsRead(entitlement)) {
    return new Response(null, { status: 303, headers: { Location: "/tools/deck-creator-studio/?access=required" } });
  }

  return null;
}

export function studioWriteAccessResponse(
  user: User | null | undefined,
  profile: CommunityProfile | null | undefined,
  entitlement?: StudioEntitlement | null,
): Response | null {
  const signIn = studioSignInResponse(user);
  if (signIn) return signIn;
  if (!isAdminProfile(profile) && !entitlementAllowsWrite(entitlement)) {
    return new Response("Your Studio is currently read-only. Exports remain available.", { status: 403 });
  }

  return null;
}
