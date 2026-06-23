import type { SupabaseClient, User } from "@supabase/supabase-js";
import { communityEnv } from "./env";
import { createCommunityServiceClient } from "./supabaseServer";
import type { CommunityProfile } from "./types";

type AuthContext = {
  user: User | null;
  profile: CommunityProfile | null;
};

export function cleanDisplayName(value: unknown): string {
  if (typeof value !== "string") return "Reader";
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Reader";
  return cleaned.slice(0, 60);
}

export function isAdminProfile(profile: CommunityProfile | null | undefined): boolean {
  return profile?.role === "admin" && profile.status === "active";
}

export function canContribute(profile: CommunityProfile | null | undefined): boolean {
  return profile?.status === "active";
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<CommunityProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, status, created_at, updated_at, last_seen_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load community profile:", error);
    return null;
  }

  return (data as CommunityProfile | null) ?? null;
}

export async function ensureCommunityProfile(
  user: User,
  locals?: unknown,
): Promise<CommunityProfile | null> {
  const env = communityEnv(locals);
  if (!env.supabaseServiceRoleKey) return null;

  const service = createCommunityServiceClient(locals);
  const email = user.email?.trim().toLowerCase() ?? "";
  const shouldBeAdmin = Boolean(email && env.communityAdminEmails.includes(email));
  const displayName = cleanDisplayName(user.user_metadata?.display_name ?? email.split("@")[0]);

  const existing = await getProfile(service, user.id);
  const nextRole = shouldBeAdmin ? "admin" : existing?.role ?? "member";
  const nextStatus = existing?.status ?? "active";

  const { data, error } = await service
    .from("profiles")
    .upsert(
      {
        id: user.id,
        display_name: existing?.display_name ?? displayName,
        role: nextRole,
        status: nextStatus,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("id, display_name, role, status, created_at, updated_at, last_seen_at")
    .single();

  if (error) {
    console.error("Unable to ensure community profile:", error);
    return existing;
  }

  await service.from("notification_preferences").upsert(
    {
      user_id: user.id,
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );

  return data as CommunityProfile;
}

export async function getAuthContext(
  supabase: SupabaseClient,
  locals?: unknown,
): Promise<AuthContext> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, profile: null };
  }

  const ensured = await ensureCommunityProfile(user, locals);
  const profile = ensured ?? (await getProfile(supabase, user.id));

  return { user, profile };
}

export function requireUser(context: AuthContext): User {
  if (!context.user) {
    throw new Response(null, {
      status: 303,
      headers: { Location: "/auth/register/" },
    });
  }
  return context.user;
}

export function requireActiveProfile(context: AuthContext): CommunityProfile {
  requireUser(context);
  const profile = context.profile;
  if (!canContribute(profile) || !profile) {
    throw new Response("This account cannot contribute right now.", { status: 403 });
  }
  return profile;
}

export function requireAdmin(context: AuthContext): CommunityProfile {
  requireUser(context);
  const profile = context.profile;
  if (!isAdminProfile(profile) || !profile) {
    throw new Response("Not found", { status: 404 });
  }
  return profile;
}
