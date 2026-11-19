import type { APIRoute } from 'astro';
import { sameOriginMutation, studioAccountAccessResponse } from '../../../../../lib/studio/access';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!sameOriginMutation(request)) return new Response('Invalid request origin.', { status: 403 });
  const denied = await studioAccountAccessResponse(locals.user, locals.profile, locals.supabase);
  if (denied) return denied;
  if (!locals.supabase || !locals.user || !params.id) return new Response('Not found.', { status: 404 });
  const form = await request.formData();
  const action = form.get('action'), projectId = form.get('project_id');
  if ((action !== 'delete' && action !== 'restore') || form.get('confirm') !== 'yes' || typeof projectId !== 'string' || !/^[0-9a-f-]{36}$/i.test(projectId)) return new Response('Confirm the requested action.', { status: 400 });
  const owned = await locals.supabase.from('studio_projects').select('id,deleted_at,status').eq('id', projectId).eq('owner_id', locals.user.id).maybeSingle();
  if (owned.error) return new Response('Project ownership could not be checked.', { status: 503 });
  if (!owned.data) return new Response('Not found.', { status: 404 });
  if (owned.data.deleted_at) {
    if (action !== 'delete') return new Response('Restore the project before restoring its cards.', {status:409});
    const removed = await locals.supabase.rpc('studio_remove_deleted_project_card_v1', {target_project:projectId,target_card:params.id});
    const message=removed.error || !removed.data ? 'The card could not be removed. Your work is unchanged.' : '';
    return new Response(null,{status:303,headers:{Location:'/studio/'+(message?'?error='+encodeURIComponent(message):'')}});
  }
  if (owned.data.status === 'archived') return new Response('Restore the project before changing its cards.', {status:409});
  const result = await locals.supabase.from('studio_cards')
    .update({ deleted_at: action === 'delete' ? new Date().toISOString() : null })
    .eq('id', params.id).eq('project_id', projectId).select('id').maybeSingle();
  const message = result.error?.message?.includes('STUDIO_EXPLORE_CARD_CAPACITY')
    ? 'Explore has room for ten active cards. Delete a card before restoring another, or upgrade to Create.'
    : result.error ? 'The card could not be changed. Your work is unchanged.' : !result.data ? 'Card not found.' : '';
  return new Response(null, { status: 303, headers: { Location: `/studio/projects/${projectId}/my-deck/` + (message ? '?error=' + encodeURIComponent(message) : '') } });
};
