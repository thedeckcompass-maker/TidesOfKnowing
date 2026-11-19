import type { APIRoute } from "astro";
import { studioAccountAccessResponse as studioWriteAccessResponse, studioProjectWriteAccessResponse, sameOriginMutation } from "../../../../../lib/studio/access";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!sameOriginMutation(request)) return new Response("Invalid request origin.", {status:403});
  const denied = await studioWriteAccessResponse(
    locals.user, locals.profile, locals.supabase
  );
  if (denied) return denied;

  const cardId = params.id;
  if (!cardId || !locals.supabase || !locals.user)
    return new Response("Not found", { status: 404 });

  const form = await request.formData();
  const projectId = String(form.get("project_id") ?? "");
  const versionId = String(form.get("version_id") ?? "");
  const expectedRaw = form.get("expected_current_version");
  const expectedVersion =
    typeof expectedRaw === "string" && /^[1-9][0-9]*$/.test(expectedRaw)
      ? Number(expectedRaw)
      : NaN;

  if (
    !projectId ||
    !versionId ||
    form.get("confirm_restore") !== "on" ||
    !Number.isSafeInteger(expectedVersion)
  ) {
    return new Response("Review and confirm the version before restoring.", {
      status: 400
    });
  }

  const projectAccess=await studioProjectWriteAccessResponse(locals.user,locals.profile,locals.supabase,projectId);
  if(projectAccess)return projectAccess;

  const owned = await locals.supabase
    .from("studio_projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", locals.user.id)
    .is("deleted_at", null)
    .neq("status", "archived")
    .maybeSingle();

  if (owned.error || !owned.data)
    return new Response("Not found", { status: 404 });

  const current = await locals.supabase
    .from("studio_cards")
    .select("*")
    .eq("id", cardId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (current.error || !current.data)
    return new Response("Not found", { status: 404 });

  if (current.data.version_number !== expectedVersion) {
    return new Response(
      "This card has changed since you reviewed it. Reload and compare the versions before restoring.",
      { status: 409 }
    );
  }

  const historical = await locals.supabase
    .from("studio_card_versions")
    .select("snapshot")
    .eq("id", versionId)
    .eq("card_id", cardId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (historical.error || !historical.data?.snapshot)
    return new Response("Not found", { status: 404 });

  const snapshot = historical.data.snapshot as Record<string, unknown>;
  const requiredFields: string[] = ["title","card_number","family_id","sort_order","status","content"];
  if (!requiredFields.every(key =>
    Object.prototype.hasOwnProperty.call(snapshot, key)
  )) {
    return new Response(
      "This historical version is incomplete and cannot safely replace your current writing.",
      { status: 409 }
    );
  }

  const validUuid = (value: unknown) =>
    value === null ||
    (typeof value === "string" &&
     /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

  const validSnapshot =
    typeof snapshot.title === "string" &&
    snapshot.title.trim().length >= 1 &&
    snapshot.title.length <= 120 &&
    typeof snapshot.card_number === "string" &&
    typeof snapshot.sort_order === "number" &&
    Number.isInteger(snapshot.sort_order) &&
    snapshot.sort_order >= 0 &&
    ["outline","draft","review","complete"].includes(String(snapshot.status)) &&
    validUuid(snapshot.family_id) &&
    snapshot.content !== null &&
    typeof snapshot.content === "object" &&
    !Array.isArray(snapshot.content);

  if (!validSnapshot) {
    return new Response(
      "This historical version contains invalid data and cannot safely replace your current writing.",
      { status: 409 }
    );
  }

  const allowedFields: string[] = ["title","card_number","family_id","sort_order","status","content"];
  const updates: Record<string, unknown> = {};

  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
      updates[key] = snapshot[key];
    }
  }

  if (!Object.keys(updates).length)
    return new Response("This historical version cannot be restored.", {
      status: 400
    });

  const saved = await locals.supabase
    .from("studio_cards")
    .update(updates)
    .eq("id", cardId)
    .eq("project_id", projectId)
    .eq("version_number", expectedVersion)
    .select("id")
    .maybeSingle();

  if (saved.error)
    return new Response("Restoration could not be completed. Your current writing was preserved.", {
      status: 409
    });

  if (!saved.data)
    return new Response(
      "This card changed before restoration completed. Reload and review the latest version.",
      { status: 409 }
    );

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/studio/projects/${projectId}/cards/${cardId}/?restored=1`
    }
  });
};
