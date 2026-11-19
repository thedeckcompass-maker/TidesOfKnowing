import type { APIRoute } from "astro";
import { studioProjectWriteAccessResponse as studioAccessResponse, sameOriginMutation } from "../../../../../lib/studio/access";
import { parseStudioCardFamilyCreate } from "../../../../../lib/studio/validation";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!sameOriginMutation(request)) return new Response("Invalid request origin.", {status:403});
  const accessResponse = await studioAccessResponse(locals.user,locals.profile,locals.supabase,params.id);
  if (accessResponse) return accessResponse;
  const projectId = params.id;
  if (!projectId || !locals.supabase) return new Response("Not found", { status: 404 });
  if (!locals.user) return new Response("Not found", { status: 404 });

  const owned = await locals.supabase
    .from("studio_projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", locals.user.id)
    .maybeSingle();

  if (owned.error) {
    console.error("Unable to verify Studio project ownership:", owned.error);
    return new Response(
      "Project ownership could not be verified. No changes were made.",
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  if (!owned.data) return new Response("Not found", { status: 404 });

  const parsed = parseStudioCardFamilyCreate(await request.formData());
  const location = (key: "saved" | "error", value: string) =>
    `/studio/projects/${projectId}/?${key}=${encodeURIComponent(value)}#cards`;
  if (!parsed.ok) return new Response(null, { status: 303, headers: { Location: location("error", parsed.error) } });

  const { data, error } = await locals.supabase.from("studio_card_families").insert({ project_id: projectId, ...parsed.value }).select("id");
  if (error || !data || data.length !== 1 || !data[0].id) {
    console.error("Unable to create Studio card family:", error);
    const message = error?.code === "23505" ? "That family name is already in use." : "The family could not be created.";
    return new Response(null, { status: 303, headers: { Location: location("error", message) } });
  }
  return new Response(null, { status: 303, headers: { Location: location("saved", "family") } });
};
