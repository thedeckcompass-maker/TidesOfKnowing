import type { APIRoute } from "astro";
import { studioAccountAccessResponse as studioWriteAccessResponse, studioProjectWriteAccessResponse, sameOriginMutation } from "../../../../../lib/studio/access";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!sameOriginMutation(request)) return new Response("Invalid request origin.", {status:403});
  const denied = await studioWriteAccessResponse(
    locals.user, locals.profile, locals.supabase
  );
  if (denied) return denied;

  const sectionId = params.id;
  if (!sectionId || !locals.supabase || !locals.user)
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
    .maybeSingle();

  if (owned.error || !owned.data)
    return new Response("Not found", { status: 404 });

  const current = await locals.supabase
    .from("studio_guidebook_sections")
    .select("*")
    .eq("id", sectionId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (current.error || !current.data)
    return new Response("Not found", { status: 404 });

  if (current.data.version_number !== expectedVersion) {
    return new Response(
      "This section has changed since you reviewed it. Reload and compare the versions before restoring.",
      { status: 409 }
    );
  }

  const historical = await locals.supabase
    .from("studio_guidebook_versions")
    .select("snapshot")
    .eq("id", versionId)
    .eq("section_id", sectionId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (historical.error || !historical.data?.snapshot)
    return new Response("Not found", { status: 404 });

  const snapshot = historical.data.snapshot as Record<string, unknown>;
  const requiredFields: string[] = ["title","section_type","sort_order","status","body_markdown"];
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
    snapshot.title.length <= 160 &&
    ["front_matter","card_entry","instructions","chapter","closing","other"].includes(String(snapshot.section_type)) &&
    typeof snapshot.sort_order === "number" &&
    Number.isInteger(snapshot.sort_order) &&
    snapshot.sort_order >= 0 &&
    ["outline","draft","review","complete"].includes(String(snapshot.status)) &&
    typeof snapshot.body_markdown === "string" &&
    (!Object.prototype.hasOwnProperty.call(snapshot,"card_id") ||
      validUuid(snapshot.card_id)) &&
    (!Object.prototype.hasOwnProperty.call(snapshot,"metadata") ||
      (snapshot.metadata !== null &&
       typeof snapshot.metadata === "object" &&
       !Array.isArray(snapshot.metadata)));

  if (!validSnapshot) {
    return new Response(
      "This historical version contains invalid data and cannot safely replace your current writing.",
      { status: 409 }
    );
  }

  const allowedFields: string[] = ["title","section_type","sort_order","status","body_markdown","card_id","metadata"];
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
    .from("studio_guidebook_sections")
    .update(updates)
    .eq("id", sectionId)
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
      "This section changed before restoration completed. Reload and review the latest version.",
      { status: 409 }
    );

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/studio/projects/${projectId}/guidebook/${sectionId}/?restored=1`
    }
  });
};
