import type { APIRoute } from "astro";
import { studioAccountAccessResponse, studioProjectWriteAccessResponse, sameOriginMutation } from "../../../../lib/studio/access";
import { parseStudioCardUpdate } from "../../../../lib/studio/validation";
import { sameWriting } from "../../../../lib/studio/saveState";

export const prerender = false;

const result = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });

export const POST: APIRoute = async ({ request, locals, params }) => {
  const denied = await studioAccountAccessResponse(
    locals.user, locals.profile, locals.supabase
  );
  if (denied) return denied;

  if (!sameOriginMutation(request))
    return result(403, { outcome: "denied", message: "Invalid request origin." });

  const cardId = params.id;
  if (!cardId || !locals.user)
    return result(404, { outcome: "not_found", message: "Card not found." });

  if (!locals.supabase)
    return result(503, { outcome: "unavailable", message: "Saving is temporarily unavailable. Your writing has not been submitted." });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return result(400, { outcome: "invalid", message: "The submitted form could not be read." });
  }

  const projectId = form.get("project_id");
  const rawVersion = form.get("expected_current_version");
  const expectedVersion =
    typeof rawVersion === "string" && /^[1-9][0-9]*$/.test(rawVersion)
      ? Number(rawVersion)
      : NaN;

  if (typeof projectId !== "string" || !projectId ||
      !Number.isSafeInteger(expectedVersion))
    return result(400, { outcome: "invalid", message: "A valid project and current version are required. Reload the editor without discarding your draft." });

  const projectAccess=await studioProjectWriteAccessResponse(locals.user,locals.profile,locals.supabase,projectId);
  if(projectAccess)return projectAccess;

  const parsed = parseStudioCardUpdate(form);
  if (!parsed.ok)
    return result(400, { outcome: "invalid", message: parsed.error });

  const owned = await locals.supabase
    .from("studio_projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", locals.user.id)
    .is("deleted_at", null)
    .neq("status", "archived")
    .maybeSingle();

  if (owned.error)
    return result(503, { outcome: "unavailable", message: "Project ownership could not be verified. Your writing remains unsaved." });

  if (!owned.data)
    return result(404, { outcome: "not_found", message: "Card not found in an owned project." });

  const lookup = await locals.supabase
    .from("studio_cards")
    .select("id,version_number,title,card_number,sort_order,status,family_id,content")
    .eq("id", cardId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (lookup.error)
    return result(503, { outcome: "unavailable", message: "The current card could not be loaded. Keep your writing and retry." });

  if (!lookup.data)
    return result(404, { outcome: "not_found", message: "Card not found." });

  const current = lookup.data;

  if (current.version_number !== expectedVersion)
    return result(409, {
      outcome: "conflict",
      message: "This card has changed since you opened it. Your draft remains in this editor. Compare the latest saved version before submitting again.",
      expected_version: expectedVersion,
      current_version: current.version_number,
    });

  const nextValue = {
    ...parsed.value,
    content: {
      ...((current.content as Record<string, unknown> | null) ?? {}),
      ...parsed.value.content,
    },
  };

  const previousValue = {
    title: current.title,
    card_number: current.card_number,
    sort_order: current.sort_order,
    status: current.status,
    family_id: current.family_id,
    content: current.content,
  };

  if (sameWriting(previousValue, nextValue))
    return result(200, {
      outcome: "unchanged",
      id: cardId,
      version_number: current.version_number,
    });

  const saved = await locals.supabase
    .from("studio_cards")
    .update(nextValue)
    .eq("id", cardId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .eq("version_number", expectedVersion)
    .select("id,version_number");

  if (saved.error) {
    console.error("Studio card save failed:", saved.error);
    return result(500, {
      outcome: "error",
      message: "The card save could not be confirmed. Keep your draft and check the current version before retrying.",
    });
  }

  if (!saved.data || saved.data.length === 0)
    return result(409, {
      outcome: "conflict",
      message: "The card changed before your save completed. Your draft remains available for comparison.",
    });

  if (saved.data.length !== 1 ||
      saved.data[0].id !== cardId ||
      !Number.isSafeInteger(saved.data[0].version_number) ||
      saved.data[0].version_number <= expectedVersion)
    return result(500, {
      outcome: "error",
      message: "The updated card version could not be verified. Check the saved record before retrying.",
    });

  return result(200, {
    outcome: "saved",
    id: cardId,
    version_number: saved.data[0].version_number,
  });
};
