import type { APIRoute } from "astro";
import { studioWriteAccessResponse } from "../../../../../lib/studio/access";

export const prerender = false;

type WithdrawResult = { ok?: boolean; error?: string };

export const POST: APIRoute = async ({ request, locals, params }) => {
  const access = studioWriteAccessResponse(locals.user, locals.profile, locals.studioEntitlement);
  if (access) return access;
  if (!locals.supabase || !params.shareId) return new Response("Not found", { status: 404 });

  const form = await request.formData();
  const projectId = String(form.get("project_id") ?? "");
  const entryId = String(form.get("entry_id") ?? "");
  const base = `/studio/projects/${projectId}/journal/${entryId}/`;
  const { data, error } = await locals.supabase.rpc("studio_withdraw_community_share", {
    target_share_id: params.shareId,
  });
  const result = (data ?? {}) as WithdrawResult;
  if (error || !result.ok) {
    return new Response(null, { status: 303, headers: { Location: `${base}?error=${encodeURIComponent("The community copy could not be withdrawn.")}` } });
  }

  return new Response(null, { status: 303, headers: { Location: `${base}?shareWithdrawn=1` } });
};
