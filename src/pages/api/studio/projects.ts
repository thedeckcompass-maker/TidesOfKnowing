import type { APIRoute } from "astro";
import {projectCreationDestination} from '../../../lib/studio/navigation';
import { sameOriginMutation, studioAccountAccessResponse } from "../../../lib/studio/access";
import { parseStudioProjectCreate } from "../../../lib/studio/validation";

export const prerender = false;

function dashboardError(message: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/studio/?error=${encodeURIComponent(message)}` },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const json = request.headers.get('accept')?.includes('application/json');
  const fail = (message:string) => json ? Response.json({error:message},{status:409,headers:{'Cache-Control':'private, no-store'}}) : dashboardError(message);
  const success = (id:string, form:FormData) => {const location=projectCreationDestination(id,form.get('task'),form.get('book'));return json?Response.json({location}):new Response(null,{status:303,headers:{Location:location}})};
  if (!sameOriginMutation(request)) return new Response("Invalid request origin.", {status:403});
  const accessResponse = await studioAccountAccessResponse(locals.user, locals.profile, locals.supabase);
  if (accessResponse) return accessResponse;
  if (!locals.supabase || !locals.user) return fail("The Studio database is not available.");

  const form = await request.formData();
  const requestId = form.get("request_id");
  if (typeof requestId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(requestId)) return fail("Keep the project creation reference and retry from the form.");
  const parsed = parseStudioProjectCreate(form);
  if (!parsed.ok) return fail(parsed.error);

  const payload = JSON.stringify(parsed.value);
  const prior = await locals.supabase.from("studio_projects").select("id,owner_id,settings,deleted_at,status").eq("id", requestId).eq("owner_id", locals.user.id).maybeSingle();
  if (prior.error) return fail("The previous creation could not be checked. Keep this form and retry.");
  if (prior.data) {
    if (prior.data.deleted_at || prior.data.status === 'archived') return fail('This request created a project that is no longer active. Restore it or start a new project.');
    if (prior.data.settings?.creation_request_v1 !== payload) return fail("This creation reference belongs to different project details. Your existing project is unchanged.");
    return success(prior.data.id,form);
  }
  const { data, error } = await locals.supabase
    .from("studio_projects")
    .insert({ id: requestId, owner_id: locals.user.id, ...parsed.value, settings: { creation_request_v1: payload } })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Unable to create Studio project:", error);
    if (error?.message?.includes('STUDIO_EXPLORE_PROJECT_CAPACITY')) return fail('Explore includes one active project. Delete it to make room for another, or upgrade to Create.');
    return fail("The project could not be created. Please try again.");
  }

  return success(data.id,form);
};
