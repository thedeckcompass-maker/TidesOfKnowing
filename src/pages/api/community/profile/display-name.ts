import type { APIRoute } from "astro";
import { json, parseJsonOrForm } from "../../../../lib/community/api";
import { displayNamesMatch } from "../../../../lib/community/displayNames";
import { getProfile } from "../../../../lib/community/auth";
import { createCommunityServiceClient } from "../../../../lib/community/supabaseServer";
import { validateDisplayName } from "../../../../lib/community/validation";

export const prerender = false;

const DUPLICATE_MESSAGE = "That display name is already in use. Please choose another.";

function isUniqueViolation(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "23505" ||
    Boolean(error.message?.includes("profiles_display_name_lower_unique"))
  );
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ ok: false, error: "Please log in first." }, 401);
  }

  const payload = await parseJsonOrForm(request);
  const validation = validateDisplayName(payload.displayName);

  if (!validation.ok) {
    return json({ ok: false, error: validation.error }, 400);
  }

  const service = createCommunityServiceClient(locals);
  const existing = await getProfile(service, locals.user.id);

  if (!existing) {
    return json({ ok: false, error: "Unable to load your profile." }, 500);
  }

  const nextName = validation.value.displayName;

  if (displayNamesMatch(nextName, existing.display_name)) {
    return json({ ok: true, displayName: existing.display_name });
  }

  const { data, error } = await service
    .from("profiles")
    .update({ display_name: nextName })
    .eq("id", locals.user.id)
    .select("display_name")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return json({ ok: false, error: DUPLICATE_MESSAGE }, 409);
    }

    console.error("Unable to update display name:", error);
    return json({ ok: false, error: "Unable to save your display name. Please try again." }, 500);
  }

  return json({ ok: true, displayName: data.display_name });
};
