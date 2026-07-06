import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../lib/community/auth";
import { json, parseJsonOrForm } from "../../../../lib/community/api";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { notifyAskLeiliaStatusChanged } from "../../../../lib/ask-leilia/notifications";
import { isAskLeiliaStatus } from "../../../../lib/ask-leilia/validation";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  if (!locals.profile || !isAdminProfile(locals.profile)) {
    return json({ ok: false, error: "Not found." }, 404);
  }

  const requestId = params.id;
  if (!requestId) {
    return json({ ok: false, error: "Missing request id." }, 400);
  }

  const payload = await parseJsonOrForm(request);
  if (!isAskLeiliaStatus(payload.status)) {
    return json({ ok: false, error: "Invalid status." }, 400);
  }

  const service = createCommunityServiceClient(locals);
  const submittedNotes = typeof payload.notes === "string" ? payload.notes.trim() : "";

  const { data: existing, error: fetchError } = await service
    .from("ask_leilia_requests")
    .select("admin_notes")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchError) {
    console.error("Unable to load Ask Leilia request for update:", fetchError);
    return json({ ok: false, error: "Unable to update the request." }, 500);
  }

  const adminNotes =
    submittedNotes || (existing as { admin_notes: string | null } | null)?.admin_notes || null;

  const { data, error } = await service
    .from("ask_leilia_requests")
    .update({
      status: payload.status,
      admin_notes: adminNotes,
      delivered_at: payload.status === "Delivered" ? new Date().toISOString() : null,
    })
    .eq("id", requestId)
    .select("name, email, status, admin_notes")
    .single();

  if (error) {
    console.error("Unable to update Ask Leilia request:", error);
    return json({ ok: false, error: "Unable to update the request." }, 500);
  }

  if (data) {
    await notifyAskLeiliaStatusChanged(
      {
        name: (data as { name: string }).name,
        email: (data as { email: string }).email,
        status: (data as { status: typeof payload.status }).status,
        adminNotes: (data as { admin_notes: string | null }).admin_notes,
      },
      locals,
    );
  }

  return redirect("/ask-leilia/admin/", 303);
};
