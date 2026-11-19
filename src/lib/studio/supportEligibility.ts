import type {SupabaseClient} from '@supabase/supabase-js';
/** Explicit stored timestamps only; no inferred membership, start date or automatic grants. SQL rechecks at write time. */
export function preparedSupportEligibility(client:SupabaseClient){return async(expected:string,capability:string)=>{
 if(!['general_community','private_community','editorial'].includes(capability))return false;
 const auth=await client.auth.getUser();if(auth.error||auth.data.user?.id!==expected)return false;
 // Community entitlement is verified by the authenticated member-context RPC.
  // Editorial eligibility retains its existing independent checks.
  if(capability==='general_community'||capability==='private_community'){
    const {data,error}=await client.rpc('studio_dcs_community_member_context_v1');
    return !error&&data?.id===expected&&data?.status==='active'&&data[capability]===true;
  }
 
 const [profile,core,grant]=await Promise.all([client.from('profiles').select('id,status').eq('id',expected).maybeSingle(),client.from('studio_access').select('user_id,starts_at,expires_at,revoked_at').eq('user_id',expected).maybeSingle(),client.from('studio_capability_grants').select('user_id,capability,starts_at,expires_at,revoked_at,membership_kind,collaboration_starts_at,setup_starts_at,platform_ends_at,support_ends_at').eq('user_id',expected).eq('capability',capability).maybeSingle()]);
 const now=Date.now(),window=(start:unknown,end:unknown)=>typeof start==='string'&&typeof end==='string'&&Number.isFinite(Date.parse(start))&&Number.isFinite(Date.parse(end))&&Date.parse(start)<=now&&now<Date.parse(end)&&Date.parse(start)<Date.parse(end);
 if(profile.error||core.error||grant.error||profile.data?.status!=='active'||core.data?.user_id!==expected||grant.data?.user_id!==expected||core.data.revoked_at||grant.data.revoked_at||!window(core.data.starts_at,core.data.expires_at)||!window(grant.data.starts_at,grant.data.expires_at))return false;
 const g=grant.data;return capability!=='editorial'||(['collaboration','highest-private'].includes(g.membership_kind)&&window(g.collaboration_starts_at,g.platform_ends_at)&&window(g.setup_starts_at,g.support_ends_at));
};}

