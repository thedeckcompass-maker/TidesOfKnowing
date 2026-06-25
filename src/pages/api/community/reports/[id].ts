import type { APIRoute } from "astro";
import { isAdminProfile } from "../../../../lib/community/auth";
import { json, parseJsonOrForm } from "../../../../lib/community/api";
import { moderateFromReport } from "../../../../lib/community/mutations";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";

export const prerender = false;

const REPORT_INTENTS = new Set([
  "dismiss",
  "hide_post",
  "delete_post",
  "lock_post",
  "hide_reply",
  "delete_reply",
  "restrict_member",
  "block_member",
]);

function safeRedirectTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/community/account/";
  return value;
}

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  if (!locals.profile || !isAdminProfile(locals.profile)) {
    return json({ ok: false, error: "Not found." }, 404);
  }

  const reportId = params.id;
  if (!reportId) return json({ ok: false, error: "Missing report id." }, 400);

  const payload = await parseJsonOrForm(request);
  const intent = String(payload.intent ?? "");
  if (!REPORT_INTENTS.has(intent)) {
    return json({ ok: false, error: "Invalid report action." }, 400);
  }

  const service = createCommunityServiceClient(locals);
  const result = await moderateFromReport(service, {
    adminId: locals.profile.id,
    reportId,
    intent: intent as Parameters<typeof moderateFromReport>[1]["intent"],
    reason: typeof payload.reason === "string" ? payload.reason : undefined,
  });

  if (!result.ok) {
    return json({ ok: false, error: result.error }, result.status ?? 500);
  }

  const acceptsJson = request.headers.get("accept")?.includes("application/json");
  if (acceptsJson) {
    return json({ ok: true });
  }

  return redirect(safeRedirectTo(payload.redirectTo), 303);
};
