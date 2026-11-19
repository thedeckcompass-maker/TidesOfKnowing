import type {SupabaseClient} from '@supabase/supabase-js';
import type {PrivatePgConnection,SqlQuery} from './postgresServiceRepository';
import {exchangeSource} from './visualExchange';
/** Verified server transaction only. No direct client write RPC or automatic activation. */
export function prepareExchangeWriter(client:SupabaseClient,connection:PrivatePgConnection,actorId:string){
 async function verified(who:string){const a=await client.auth.getUser();if(a.error||!a.data.user||a.data.user.id!==actorId||who!==actorId)throw Error('Verified Exchange identity required.');}
 async function dispatch(q:SqlQuery,action:string,input:any){const identity=await q("SELECT current_setting('request.jwt.claim.sub',true) AS actor");if(identity.rows[0]?.actor!==actorId)throw Error('Database identity mismatch.');const r=await q('SELECT studio_private.exchange_dispatch_v1($1,$2::jsonb) AS value',[action,JSON.stringify(input)]);if(r.rows.length!==1||r.rows[0].value==null)throw Error('Exchange result was not confirmed. Keep your retry key.');return r.rows[0].value;}
 async function act(who:string,action:string,input:any={}){await verified(who);return connection.transaction(q=>dispatch(q,action,input));}
 return {
 canExchange:(who:string)=>act(who,'canPost'),registeredArtist:(who:string)=>act(who,'registeredArtist'),
 exchangeOwner:(who:string,project:string)=>act(who,'owner',{project_id:project}),exchangeBoard:(who:string,id='')=>act(who,'board',{id}),
 exchangeInterest:(who:string,input:any)=>act(who,'interest',{id:input.id,key:input.key,message:input.message}),
 exchangeState:(who:string,input:any)=>{if(!['publish','withdraw'].includes(input.action))throw Error('Choose a supported Exchange action.');return act(who,input.action,{id:input.id,expected_revision:input.expected_revision,reviewed:input.reviewed===true,replace_prior:input.replace_prior===true});},
 async exchangeDraft(who:string,input:any){await verified(who);return connection.transaction(async q=>{
 const sourceClient:any={from(table:string){if(table!=='studio_projects')throw Error('Unsupported source');const filters:Record<string,unknown>={};const builder:any={select:()=>builder,eq:(k:string,v:unknown)=>{filters[k]=v;return builder},maybeSingle:async()=>{if(filters.owner_id!==actorId||filters.id!==input.project_id)throw Error('Owned project required');const rows=await q('SELECT id,owner_id,name,settings FROM public.studio_projects WHERE id=$1::uuid AND owner_id=$2::uuid',[input.project_id,actorId]);return {data:rows.rows[0]??null,error:null}}};return builder;}};
 const source=await exchangeSource(sourceClient,actorId,input.project_id);if(source.fingerprint!==input.source_fingerprint||source.bookVersion!==input.source_version)throw Error('The saved visual source changed. Review it again.');if(typeof input.selected_text!=='string'||!input.selected_text.trim()||input.selected_text.length>10000||!source.bookText.includes(input.selected_text))throw Error('Choose an exact saved passage.');if(!Array.isArray(input.images)||input.images.length>3||new Set(input.images.map((i:any)=>i.id)).size!==input.images.length)throw Error('Choose distinct saved previews.');const images=input.images.map((i:any)=>{const found=source.images.find((v:any)=>v.id===i.id);if(!found||JSON.stringify(found)!==JSON.stringify(i))throw Error('Preview source changed or is not yours.');return found;});
 return dispatch(q,'draft',{project_id:input.project_id,key:input.key,title:input.title,selected_text:input.selected_text,images,source_fingerprint:source.fingerprint,source_version:source.bookVersion,prior_id:input.prior_id??''});});}
 };
}
