import { sameWriting } from "../../../../lib/studio/saveState";
import type { APIRoute } from "astro";
import { studioAccountAccessResponse as studioWriteAccessResponse, studioProjectWriteAccessResponse, sameOriginMutation } from "../../../../lib/studio/access";
import { parseStudioJournalEntry } from "../../../../lib/studio/validation";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!sameOriginMutation(request)) return new Response("Invalid request origin.", {status:403});
  const wantsJson = request.headers.get("Accept")
    ?.split(",").some(value => value.trim().startsWith("application/json")) ?? false;

  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });

  const failure = (message: string, status: number, location?: string) =>
    wantsJson
      ? json({ message }, status)
      : location
        ? new Response(null, {
            status: 303,
            headers: { Location: location }
          })
        : new Response(message, { status });

  const accessResponse = await studioWriteAccessResponse(
    locals.user, locals.profile, locals.supabase
  );
  if (accessResponse) return accessResponse;

  const entryId = params.id;
  if (!entryId || !locals.supabase) {
    return failure("Not found", 404);
  }

  const form = await request.formData();
  const projectId = typeof form.get("project_id") === "string"
    ? String(form.get("project_id"))
    : "";

  if (!projectId || !locals.user) {
    return failure("Not found", 404);
  }
  const projectAccess=await studioProjectWriteAccessResponse(locals.user,locals.profile,locals.supabase,projectId);
  if(projectAccess)return projectAccess;

  const editingPath =
    `/studio/projects/${projectId}/journal/${entryId}/`;

  const { data: ownedProject, error: ownershipError } = await locals.supabase
    .from("studio_projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", locals.user.id)
    .maybeSingle();

  if (ownershipError) {
    console.error(
      "Unable to verify Studio journal project ownership:",
      ownershipError
    );
    return failure(
      "Project ownership could not be verified. No changes were made.",
      500
    );
  }

  if (!ownedProject) return failure("Not found", 404);

  const parsed = parseStudioJournalEntry(form);

  if (!parsed.ok) {
    return failure(
      parsed.error,
      400,
      `${editingPath}?error=${encodeURIComponent(parsed.error)}`
    );
  }

  const { data: current, error: readError } = await locals.supabase
    .from("studio_journal_entries")
    .select("*")
    .eq("id", entryId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (readError || !current) {
    return failure("Not found", 404);
  }

  const conflictMessage =
    "This entry has changed. Your writing has not been saved. Copy it somewhere safe, then reload.";

  if (String(form.get("expected_updated_at") ?? "") !== current.updated_at) {
    return failure(
      conflictMessage,
      409,
      `${editingPath}?error=${encodeURIComponent(conflictMessage)}`
    );
  }

  const returning = form.get("return_to_project") === "on";
  const target = returning
    ? `/studio/projects/${projectId}/`
    : editingPath;

  const unchanged = sameWriting(
    parsed.value,
    Object.fromEntries(
      Object.keys(parsed.value).map(key => [key, current[key]])
    )
  );

  if (unchanged) {
    if (wantsJson) {
      return json({
        outcome: "unchanged",
        id: entryId,
        updated_at: current.updated_at
      });
    }

    return new Response(null, {
      status: 303,
      headers: { Location: `${target}?unchanged=1` }
    });
  }

  const { data: savedEntry, error } = await locals.supabase
    .from("studio_journal_entries")
    .update(parsed.value)
    .eq("id", entryId)
    .eq("project_id", projectId)
    .eq("updated_at", current.updated_at)
    .select("id,updated_at")
    .maybeSingle();

  if (error || !savedEntry) {
    console.error(
      "Unable to update Studio journal entry:",
      error ?? "No matching writable entry."
    );

    return failure(
      "The journal entry could not be saved. A newer version may exist.",
      409,
      `${editingPath}?error=${encodeURIComponent("The journal entry could not be saved.")}`
    );
  }

  // A completed update without an advancing version cannot
  // safely establish the next optimistic-concurrency token.
  const previousTime = Date.parse(current.updated_at);
  const persistedTime = Date.parse(savedEntry.updated_at);

  if (
    savedEntry.id !== entryId ||
    typeof savedEntry.updated_at !== "string" ||
    !Number.isFinite(previousTime) ||
    !Number.isFinite(persistedTime) ||
    persistedTime <= previousTime
  ) {
    console.error(
      "Studio Journal update returned no authoritative advancing version."
    );
    return failure(
      "The update may have been applied, but its saved version could not be confirmed. Your writing remains here. Check the latest version before retrying.",
      500,
      `${editingPath}?error=${encodeURIComponent("The saved version could not be confirmed. Check the latest entry before retrying.")}`
    );
  }

  if (wantsJson) {
    return json({
      outcome: "saved",
      id: savedEntry.id,
      updated_at: savedEntry.updated_at
    });
  }

  const suffix = returning ? "editor_saved=1" : "saved=1";

  return new Response(null, {
    status: 303,
    headers: { Location: `${target}?${suffix}` }
  });
};
