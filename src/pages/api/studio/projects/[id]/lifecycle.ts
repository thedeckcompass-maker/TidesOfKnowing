import type { APIRoute } from 'astro';
import { sameOriginMutation, studioAccountAccessResponse } from '../../../../../lib/studio/access';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  if (!sameOriginMutation(request)) return new Response('Invalid request origin.', { status: 403 });
  const denied = await studioAccountAccessResponse(locals.user, locals.profile, locals.supabase);
  if (denied) return denied;
  if (!locals.supabase || !locals.user || !params.id) return new Response('Not found.', { status: 404 });
  const form = await request.formData();
  const action = form.get('action');
  if ((action !== 'delete' && action !== 'restore') || form.get('confirm') !== 'yes') return new Response('Confirm the requested action.', { status: 400 });
  const result = await locals.supabase.from('studio_projects')
    .update({ deleted_at: action === 'delete' ? new Date().toISOString() : null })
    .eq('id', params.id).eq('owner_id', locals.user.id)
    .select('id').maybeSingle();
  const message = result.error?.message?.includes('STUDIO_EXPLORE_PROJECT_CAPACITY')
    ? 'Explore has room for one active project. Delete the current project before restoring another, or upgrade to Create.'
    : result.error?.message?.includes('STUDIO_EXPLORE_CARD_CAPACITY')
      ? 'This project has more than ten active cards. Under Deleted projects, remove cards to make room before restoring it, or upgrade to Create. Their history is retained.'
      : result.error ? 'The project could not be changed. Your work is unchanged.' : !result.data ? 'Project not found.' : '';
  return new Response(null, { status: 303, headers: { Location: '/studio/' + (message ? '?error=' + encodeURIComponent(message) : '') } });
};
