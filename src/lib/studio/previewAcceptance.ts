import {getProfile} from '../community/auth';
import {composeDcsRuntime} from './runtimeComposition';
export type PreviewAcceptanceConfig={enabled:boolean;origin:string;memberId:string;adminId:string;startsAt?:string;endsAt?:string};
// Deployment preparation only. Enabling requires a reviewed protected Preview and verified member UUID.
export const PREVIEW_ACCEPTANCE:Readonly<PreviewAcceptanceConfig>=Object.freeze({enabled:true,origin:'https://dcs-exchange-readonly-202610.tidesofknowing.pages.dev',memberId:'6b20dc2a-7ece-4591-a33d-2ef13578fb8e',adminId:'7e3224e7-b303-4150-a45e-dd9a12efdb68',startsAt:'2026-10-26T15:02:00Z',endsAt:'2026-11-02T15:02:00Z'});
const emails=['hello@tidesofknowing.com','themereartist@gmail.com'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validPreviewConfig(c:PreviewAcceptanceConfig,origin:string){
 try {const u=new URL(c.origin);return c.enabled===true&&u.origin===c.origin&&origin===c.origin&&u.protocol==='https:'&&/^[a-z0-9-]+\.tidesofknowing\.pages\.dev$/.test(u.hostname)&&uuid.test(c.adminId)&&uuid.test(c.memberId)&&c.adminId!==c.memberId;}catch{return false;}
}
export async function previewAcceptance(context:any,supabase:any,config:PreviewAcceptanceConfig=PREVIEW_ACCEPTANCE,compose=composeDcsRuntime):Promise<Response|null>{
 if(!config.enabled)return null;
 const start=Date.parse(config.startsAt??''),end=Date.parse(config.endsAt??'');
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>7*86400000||Date.now()<start||Date.now()>=end)return new Response('This preview acceptance window is closed.',{status:403,headers:{'Cache-Control':'private, no-store'}});
 const url=new URL(context.request.url),deny=(text:string,status=403)=>new Response(text,{status,headers:{'Cache-Control':'private, no-store'}});
 if(!validPreviewConfig(config,url.origin))return deny('Preview acceptance is not configured.',503);
 // Password sign-in only: no signup, email sending, recovery, callback profile creation or username completion here.
 if(url.pathname==='/auth/login/'){
  if(!['GET','POST'].includes(context.request.method))return deny('Method not allowed.',405);
  if(context.request.method==='POST'){
   if(context.request.headers.get('origin')!==url.origin)return deny('Invalid request origin.');
   try{const text=await context.request.clone().text();if(text.length>12000)return deny('Request too large.',413);const form=new URLSearchParams(text);if(!emails.includes((form.get('email')??'').trim().toLowerCase()))return deny('This account is not included in this preview.');}catch{return deny('Invalid sign-in request.',400);}
  }
  return null;
 }
 if(url.pathname.startsWith('/auth/')||url.pathname.startsWith('/api/community/account/'))return deny('Use the normal website for account changes.');
 const result=await supabase.auth.getUser(),user=result.data?.user;
 if(result.error||!user){
  if(context.request.method==='GET'&&(url.pathname==='/artists/collaborate/'||url.pathname==='/studio/artists/'||url.pathname==='/studio/creators-desk/'||url.pathname==='/studio/exports/'||/^\/studio\/projects\/[0-9a-f-]{36}\/$/i.test(url.pathname)))return new Response(null,{status:303,headers:{Location:'/auth/login/?redirectTo='+encodeURIComponent(url.pathname),'Cache-Control':'private, no-store'}});
  return deny('Sign in at /auth/login/ to open this preview.',401);
 }
 const expected=user.id===config.adminId?emails[0]:user.id===config.memberId?emails[1]:null;
 if(!expected||user.email?.toLowerCase()!==expected)return deny('This account is not included in this preview.');
 // Read-only authentication: never ensureCommunityProfile or completeRequestedUsername.
 const profile=await getProfile(supabase,user.id);
 if(!profile||profile.id!==user.id||profile.status!=='active'||(user.id===config.adminId&&profile.role!=='admin'))return deny('An existing active account profile is required.');
 context.locals.user=user;context.locals.profile=profile;
 const database=context.locals.serverRuntime?.env?.DCS_EXCHANGE_DB;
 if(!database?.connectionString)return deny('Preview connection is not configured.',503);
 Object.assign(context.locals,await compose(context.locals,{services:true,community:true,exports:true,artists:true,artistPortfolio:true,origin:config.origin,recipientId:config.adminId,historyPolicy:'allow',database}));
 return null;
}
