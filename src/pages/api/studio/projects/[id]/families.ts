import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../../../lib/studio/access";
import { parseStudioCardFamilyCreate } from "../../../../../lib/studio/validation";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  const accessResponse = studioAccessResponse(locals.user, locals.profile);
  if (accessResponse) return accessResponse;
  const projectId = params.id;
  if (!projectId || !locals.supabase) return new Response("Not found", { status: 404 });
  const parsed = parseStudioCardFamilyCreate(await request.formData());
  const location = (key: "saved" | "error", value: string) =>
    `/studio/projects/${projectId}/?${key}=${encodeURIComponent(value)}#cards`;
  if (!parsed.ok) return new Response(null, { status: 303, headers: { Location: location("error", parsed.error) } });

  const { error } = await locals.supabase
    .from("studio_card_families")
    .insert({ project_id: projectId, ...parsed.value });
  if (error) {
    console.error("Unable to create Studio card family:", error);
    const message = error.code === "23505" ? "That family name is already in use." : "The family could not be created.";
    return new Response(null, { status: 303, headers: { Location: location("error", message) } });
  }
  return new Response(null, { status: 303, headers: { Location: location("saved", "family") } });
};
