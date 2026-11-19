import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { CommunityProfile } from '../community/types';
import { isAdminProfile } from '../community/auth';
export type StudioAccess = { user_id: string; phase: 'intro'|'paid'; onboarding_date: string; time_zone: string; starts_at: string; expires_at: string; revoked_at: string|null; updated_at: string };
export type StudioPaidAccessState = 'active'|'read-grace'|'expired'|'unavailable';
/** State of the existing projected grant only. This does not classify any project as Explore. */
export function studioPaidAccessState(profile:CommunityProfile|null|undefined,access:StudioAccess|null,now=Date.now()):StudioPaidAccessState {
 if (!profile || profile.status!=='active' || !access || access.user_id!==profile.id || access.revoked_at || !Number.isFinite(now)) return 'unavailable';
 const start=Date.parse(access.starts_at),end=Date.parse(access.expires_at);
 if (!Number.isFinite(start)||!Number.isFinite(end)||end<=start||now<start) return 'unavailable';
 if (now<end) return 'active';
 return now<end+28*86400000?'read-grace':'expired';
}
export function effectiveStudioAccess(profile: CommunityProfile|null|undefined, access: StudioAccess|null, now=Date.now()): boolean {
 if (isAdminProfile(profile)) return true;
 return studioPaidAccessState(profile,access,now)==='active';
}
export async function loadStudioAccess(client: SupabaseClient|undefined, userId: string): Promise<StudioAccess|null> {
 if (!client) return null;
 try { const {data,error}=await client.from('studio_access').select('user_id,phase,onboarding_date,time_zone,starts_at,expires_at,revoked_at,updated_at').eq('user_id',userId).maybeSingle(); return error?null:data; } catch { return null; }
}
export async function studioAccessResponse(user: User|null|undefined, profile: CommunityProfile|null|undefined, client?: SupabaseClient): Promise<Response|null> {
 if (!user) return new Response(null,{status:303,headers:{Location:'/auth/register/'}});
 if (profile?.id===user.id && isAdminProfile(profile)) return null;
 if (profile?.id===user.id && effectiveStudioAccess(profile,await loadStudioAccess(client,user.id))) return null;
 return new Response('Studio access is not currently available for this account. Contact hello@tidesofknowing.com to check your invitation or access dates. Your work has not been deleted.',{status:403,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'private, no-store'}});
}
export function sameOriginMutation(request: Request): boolean {
 return request.method==='POST' && request.headers.get('origin')===new URL(request.url).origin;
}
// Date-only display helper; PostgreSQL applies the selected IANA timezone to the final boundary.
export function sixMonthDate(onboarding: string): string {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(onboarding)) throw new Error('Invalid onboarding date');
 const [y,m,d]=onboarding.split('-').map(Number), base=new Date(Date.UTC(y,m-1,d));
 if(base.toISOString().slice(0,10)!==onboarding) throw new Error('Invalid onboarding date');
 const year=y+Math.floor((m-1+6)/12),month=(m-1+6)%12;
 return new Date(Date.UTC(year,month,Math.min(d,new Date(Date.UTC(year,month+1,0)).getUTCDate()))).toISOString().slice(0,10);
}

// Current manual access has the same read/write boundary; no subscription fallback.
export const studioWriteAccessResponse = studioAccessResponse;

/** Creator-workspace access only. This must not grant programme services or community access. */
export async function studioWorkspaceAccessResponse(user:User|null|undefined,profile:CommunityProfile|null|undefined,client?:SupabaseClient):Promise<Response|null>{
 const denied=await studioAccessResponse(user,profile,client);
 if(!denied)return null;
 if(!user||!client||profile?.id!==user.id||profile.status!=='active')return denied;
 try{const {data,error}=await client.rpc('studio_complimentary_develop_workspace_active_v1');if(!error&&data===true)return null;}catch{}
 return denied;
}

/** Presentation only. Missing projected paid access is not proof of Explore membership.
 * Existing database permission RPCs include their trusted programme/project exceptions.
 * This must never be used to grant writes, classify projects or extend retention. */
export async function loadStudioGuidance(client:SupabaseClient|undefined,userId:string,profile:CommunityProfile|null|undefined,projectIds:string[]=[]):Promise<'studio'|'project'|'registered'|'unavailable'>{
 if(!client||profile?.id!==userId||profile.status!=='active')return 'unavailable';
 try{
  const global=await client.rpc('studio_has_write_access');
  if(global.error||typeof global.data!=='boolean')return 'unavailable';
  if(global.data)return 'studio';
  for(const id of projectIds){const result=await client.rpc('studio_project_can_edit_v1',{p_project:id});if(result.error||typeof result.data!=='boolean')return 'unavailable';if(result.data)return 'project';}
  return 'registered';
 }catch{return 'unavailable';}
}

// Account-level eligibility only: this intentionally does not decide whether a
// particular project may be read. Project RLS and the project read RPC enforce
// its binding, current paid access and the 28-day window; never use for writes.
export function effectiveStudioReadAccess(profile:CommunityProfile|null|undefined,access:StudioAccess|null,now=Date.now()):boolean{
 if(effectiveStudioAccess(profile,access,now))return true;
 return Boolean(profile?.status==='active'&&(!access||access.user_id===profile.id));
}
export async function studioReadAccessResponse(user:User|null|undefined,profile:CommunityProfile|null|undefined,client?:SupabaseClient):Promise<Response|null>{
 if(!user)return new Response(null,{status:303,headers:{Location:'/auth/register/'}});
 if(profile?.id===user.id&&isAdminProfile(profile))return null;
 if(profile?.id===user.id&&effectiveStudioReadAccess(profile,await loadStudioAccess(client,user.id)))return null;
 return new Response('Read and download access is not currently available. Your work has not been deleted.',{status:403,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'private,no-store'}});
}

export function annualCollaborationPreview(agreement: string, collaborationStarts: string, setupStarts?: string) {
 if (!['founder','private-collaboration'].includes(agreement)) throw new Error('Choose the explicit collaboration agreement.');
 const date=(value:string,label:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('Enter the explicit '+label+' date; do not substitute account creation or onboarding.');const d=new Date(value+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)throw new Error('Enter a valid '+label+' date.');return d;};
 const collaborationStart=date(collaborationStarts,'collaboration start');
 if(setupStarts!==undefined&&setupStarts!==''&&setupStarts!==collaborationStarts)throw new Error('For this collaboration, platform access and personal support begin on the same agreed collaboration start date. Existing stored dates have not been changed.');
 // Confirmed collaboration offer only; other future tier windows remain explicit and separate.
 const plusMonths=(d:Date,months:number)=>{const m=d.getUTCMonth()+months,y=d.getUTCFullYear()+Math.floor(m/12),month=m%12;return new Date(Date.UTC(y,month,Math.min(d.getUTCDate(),new Date(Date.UTC(y,month+1,0)).getUTCDate()))).toISOString().slice(0,10);};
 return {agreement,collaborationStarts,setupStarts:collaborationStarts,platformEnds:plusMonths(collaborationStart,12),supportEnds:plusMonths(collaborationStart,2),feeUSD:495,introductorySessions:2,paymentDue:'Only if the creator proceeds after both introductory sessions; Leilia sends the payment link.',previewOnly:true};
}

/** Account/ownership gate for free concept capture and own-work export. Paid writes use the existing paid gate. */
export async function studioAccountAccessResponse(user:User|null|undefined,profile:CommunityProfile|null|undefined,_client?:SupabaseClient):Promise<Response|null>{
 if(!user)return new Response(null,{status:303,headers:{Location:'/auth/login/'}});
 if(profile?.id!==user.id||profile.status!=='active')return new Response('Your account needs attention. Payment status does not delete your work.',{status:403,headers:{'Cache-Control':'private,no-store'}});
 return null;
}

/** Project-level write authority is decided by the owner-bound database RPC. */
export async function studioProjectWriteAccessResponse(user:User|null|undefined,profile:CommunityProfile|null|undefined,client:SupabaseClient|undefined,projectId:string|undefined):Promise<Response|null>{
 const account=await studioAccountAccessResponse(user,profile,client);if(account)return account;
 if(!client||!projectId||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId))return new Response('Project access could not be verified.',{status:503,headers:{'Cache-Control':'private,no-store'}});
 try{const {data,error}=await client.rpc('studio_project_can_edit_v1',{p_project:projectId});if(error||typeof data!=='boolean')throw Error('Access check unavailable');if(data)return null;}
 catch{return new Response('Project access could not be verified. Your work is unchanged.',{status:503,headers:{'Cache-Control':'private,no-store'}});}
 return new Response('This project is read-only under your current access. Your saved work is unchanged.',{status:403,headers:{'Cache-Control':'private,no-store'}});
}

/** Read and download scope is owner- and project-specific, including the paid grace window. */
export async function studioProjectReadAccessResponse(user:User|null|undefined,profile:CommunityProfile|null|undefined,client:SupabaseClient|undefined,projectId:string|undefined):Promise<Response|null>{
 const account=await studioAccountAccessResponse(user,profile,client);if(account)return account;
 if(!client||!projectId||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId))return new Response('Project access could not be verified.',{status:503,headers:{'Cache-Control':'private,no-store'}});
 try{const {data,error}=await client.rpc('studio_project_can_read_v1',{p_project:projectId});if(error||typeof data!=='boolean')throw Error('Access check unavailable');if(data)return null;}
 catch{return new Response('Project access could not be verified. Your work is unchanged.',{status:503,headers:{'Cache-Control':'private,no-store'}});}
 return new Response('This project is not available under your current access. Your saved work has not been deleted.',{status:403,headers:{'Cache-Control':'private,no-store'}});
}
