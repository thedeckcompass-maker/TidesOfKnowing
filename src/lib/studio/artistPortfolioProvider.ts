import type {SupabaseClient} from '@supabase/supabase-js';
import type {PrivatePgConnection} from './postgresServiceRepository';
import {verifiedArtistPreviewOrigin} from './artistPreviewOrigin';
export const ARTIST_PREVIEW_BUCKET='studio-artist-previews';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const privatePath=/^\/api\/artists\/portfolio\/([0-9a-f-]{36})\/$/i;
const hash=async(bytes:Uint8Array)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as BufferSource))].map(x=>x.toString(16).padStart(2,'0')).join('');
/** Inactive until the separately reviewed private RPC/storage contract is installed. No service key. */
export function prepareArtistPortfolioProvider(connection:PrivatePgConnection,client:SupabaseClient,actorId:string,origin:string){
 verifiedArtistPreviewOrigin(origin);
 if(!uuid.test(actorId)||new URL(origin).origin!==origin)throw Error('Verified artist context required.');
 const call=async(actor:string,action:string,input:unknown={})=>{if(actor!==actorId)throw Error('Account identity mismatch.');const result=await connection.transaction(async query=>{const identity=await query("SELECT current_setting('request.jwt.claim.sub',true) AS actor");if(identity.rows[0]?.actor!==actorId)throw Error('Verified database identity required.');const r=await query('SELECT studio_private.artist_portfolio_dispatch_v1($1::text,$2::jsonb) AS value',[action,JSON.stringify(input)]);if(r.rows.length!==1||r.rows[0].value===null)throw Error('Artist operation was not confirmed.');return r.rows[0].value;});if(result?.error==='portfolio_replacement_pending')throw Object.assign(new Error('A previous example replacement is still finishing. Your saved portfolio is safe. Retry this replacement before starting another.'),{code:'portfolio_replacement_pending'});return result;};
 const hydrate=(profile:any)=>profile?{...profile,portfolio_examples:profile.portfolio_examples.map((e:any)=>({...e,url:privatePath.test(e.url)?new URL(e.url,origin).href:e.url}))}:null;
 const readBytes=async(meta:any)=>{const r=await client.storage.from(ARTIST_PREVIEW_BUCKET).download(meta.object_path);if(r.error||!r.data)throw Error('This private preview is unavailable.');const bytes=new Uint8Array(await r.data.arrayBuffer());if(bytes.length!==meta.byte_size||await hash(bytes)!==meta.sha256)throw Error('Private preview verification failed.');return bytes;};
 const retire=async(actor:string,items?:any[])=>{for(const item of items??await call(actor,'retirements')){if(!uuid.test(item.id)||item.object_path!==actor+'/'+item.id+'.jpg')throw Error('Unexpected retirement reference.');const removed=await client.storage.from(ARTIST_PREVIEW_BUCKET).remove([item.object_path]);if(removed.error)throw Error('Replacement cleanup was not confirmed. Retry to finish without changing your saved portfolio.');await call(actor,'confirmRetired',{id:item.id});}};
 return {hosted:true,
  loadDraft:(actor:string)=>call(actor,'loadDraft'),
  saveDraft:(actor:string,value:any)=>call(actor,'saveDraft',value),
  canCreator:(actor:string)=>call(actor,'canBrowse'),
  async snapshot(actor:string){const r=await call(actor,'snapshot');return {...r,profile:hydrate(r.profile),published:hydrate(r.published)}},
  async directoryProfile(actor:string,id:string){return hydrate(await call(actor,'directoryProfile',{id}))},
  async directory(actor:string){return (await call(actor,'directory')).map(hydrate)},
  async saveApplication(actor:string,value:any,stamp:string,mediaHeads:Record<string,string>={},disclosure?:{confirmed:boolean;email:string}){const examples=value.portfolio_examples.map((e:any)=>{const u=new URL(e.url);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error('Use a valid portfolio link.');if(u.pathname.startsWith('/api/artists/portfolio/')){if(u.origin!==origin||!privatePath.test(u.pathname)||u.search||u.hash)throw Error('Choose a private preview from this Studio.');return {...e,url:u.pathname};}return e;});const profile=await call(actor,'submit',{application:{...value,portfolio_examples:examples},expected_updated_at:stamp,media_heads:mediaHeads,contact_disclosure_confirmed:disclosure?.confirmed===true,observed_email:disclosure?.email});await retire(actor);return hydrate(profile);},
  async savePreview(actor:string,bytes:Uint8Array,requestId:string,slot:number,expectedHead:string=''){if(!uuid.test(requestId)||!bytes.length||bytes.length>300000||!Number.isInteger(slot)||slot<1||slot>8||(expectedHead&&!uuid.test(expectedHead)))throw Error('Choose a valid portfolio example.');await retire(actor);const digest=await hash(bytes);let meta:any;for(let attempt=0;attempt<3;attempt++){meta=await call(actor,'reservePreview',{id:requestId,sha256:digest,byte_size:bytes.length,slot,expected_head:expectedHead});if(!meta.cleanup)break;await retire(actor,meta.cleanup);}if(!meta?.object_path)throw Error('Replacement is still finishing. Retry this same image.');if(meta.state==='reserved'){await client.storage.from(ARTIST_PREVIEW_BUCKET).upload(meta.object_path,bytes,{contentType:'image/jpeg',upsert:false});}await readBytes(meta);await call(actor,'completePreview',{id:requestId});return{id:requestId,slot};},
  async preview(actor:string,id:string){if(!uuid.test(id))return null;const meta=await call(actor,'preview',{id});return meta?readBytes(meta):null;},
  async reviewQueue(actor:string){return (await call(actor,'reviewQueue')).map((r:any)=>({...r,profile:hydrate(r.profile)}));},
  review:(actor:string,id:string,status:string,expected_updated_at:string)=>call(actor,'review',{id,status,expected_updated_at}),
 };
}
export function artistPortfolioStore(locals:any):any{return locals.studioArtistLocal===true?locals.studioArtistStore??null:locals.studioArtistPortfolioEnabled===true?locals.studioArtistPortfolioProvider??null:null;}
