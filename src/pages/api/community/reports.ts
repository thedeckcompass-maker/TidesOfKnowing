import type { APIRoute } from "astro";
import { canContribute } from "../../../lib/community/auth";
import { json, parseJsonOrForm } from "../../../lib/community/api";
import { createCommunityReport } from "../../../lib/community/mutations";
import { createCommunityServiceClient } from "../../../lib/community/supabaseServer";
import { validateReportInput } from "../../../lib/community/validation";

export const prerender = false;

function safeRedirectTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/community/?report=sent";
  return value;
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!locals.user || !canContribute(locals.profile)) {
    return json({ ok: false, error: "Please log in to report content." }, 401);
  }

  const payload = await parseJsonOrForm(request);
  const validation = validateReportInput({
    contentType: payload.contentType,
    contentId: payload.contentId,
    reason: payload.reason,
    notes: payload.notes,
  });

  if (!validation.ok) {
    return json({ ok: false, error: validation.error }, 400);
  }

  const service = createCommunityServiceClient(locals);
  const result = await createCommunityReport(service, {
    reporterUserId: locals.user.id,
    ...validation.value,
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
