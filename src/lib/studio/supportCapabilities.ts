import {supportStore} from './supportProvider';
import {isAdminProfile} from '../community/auth';
import {effectiveStudioAccess,loadStudioAccess} from './access';
export const SUPPORT_CHANNELS=[
{capability:'general_community',title:'General community',description:'Members choose topics together. Leilia responds to shared topics for the group.',audience:'All admitted general-community members',route:'/community/sections/studio-general/',connected:false},
{capability:'editorial',title:'Confidential editorial feedback',description:'Selected text or artwork and your question are reviewed privately. This is separate from a community conversation.',audience:'You and authorised editorial staff only',route:null,connected:false},
] as const;
export type SupportCapability='general_community'|'private_community'|'editorial';
export function channelAvailability(capability:SupportCapability,eligible:boolean,verified:boolean,connected:boolean){const channel=SUPPORT_CHANNELS.find(c=>c.capability===capability)??{capability,title:'Retired community',description:'Use Studio Community.',audience:'Studio members',route:'/studio/community/',connected:false};return {...channel,eligible,verified,connected,available:eligible&&verified&&connected,reason:!verified?'Access mapping and channel connection are not yet available in this preview.':!eligible?`Requires ${channel.title.toLocaleLowerCase()} access. Your other Studio tools remain available.`:!connected?'Included in your verified access; this channel is not yet connected in this preview.':'Available'};}
// Reuses the explicit, time-bound capability vocabulary in the preserved integration.
// No plan-name, paid-phase or artist-role inference; no grants or backend-policy changes.
export async function supportCapabilities(locals:any) {
  const user = locals.user;
  const profile = locals.profile;
  const active = !!user &&
    profile?.id === user.id &&
    profile.status === 'active';

  const store = supportStore(locals);
  const hosted = locals.studioSupportHostedEnabled === true &&
    !!locals.studioSupportProvider;

  if (!active) {
    return SUPPORT_CHANNELS.map(c =>
      channelAvailability(c.capability, false, true, false)
    );
  }

  if (store) {
    return Promise.all(SUPPORT_CHANNELS.map(async c => {
      try {
        const eligible = await store.allowed(user.id, c.capability);
        return channelAvailability(c.capability, eligible, true, true);
      } catch {
        return channelAvailability(c.capability, false, false, false);
      }
    }));
  }

  const admin = isAdminProfile(profile);
  let paidAccess = false;

  try {
    paidAccess = admin || effectiveStudioAccess(
      profile,
      await loadStudioAccess(locals.supabase, user.id)
    );
  } catch {
    paidAccess = admin;
  }

  return Promise.all(SUPPORT_CHANNELS.map(async c => {
    if (c.capability === 'general_community') {
      return channelAvailability(
        c.capability, true, true, hosted
      );
    }

    if (admin) {
      return channelAvailability(
        c.capability, true, true, c.connected
      );
    }

    if (!paidAccess) {
      return channelAvailability(
        c.capability, false, true, false
      );
    }

    if (!locals.supabase) {
      return channelAvailability(
        c.capability, false, false, false
      );
    }

    try {
      const {data, error} = await locals.supabase
        .from('studio_capability_grants')
        .select('starts_at,expires_at,revoked_at')
        .eq('user_id', user.id)
        .eq('capability', c.capability)
        .maybeSingle();

      const eligible = !error && !!data &&
        !data.revoked_at &&
        Date.parse(data.starts_at) <= Date.now() &&
        Date.parse(data.expires_at) > Date.now();

      return channelAvailability(
        c.capability, eligible, !error, c.connected
      );
    } catch {
      return channelAvailability(
        c.capability, false, false, false
      );
    }
  }));
}
