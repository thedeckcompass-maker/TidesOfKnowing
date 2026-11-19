import type {SupabaseClient} from '@supabase/supabase-js';
import type {PrivatePgConnection} from './postgresServiceRepository';
/** Uses the existing restricted SERIALIZABLE connection, never a service-role browser client. */
export function prepareArtistConversationProvider(client:SupabaseClient,connection:PrivatePgConnection,actorId:string){
 const call=async(actor:string,action:string,input:unknown={})=>{
  if(actor!==actorId)throw Error('Conversation identity mismatch.');
  const auth=await client.auth.getUser();if(auth.error||auth.data.user?.id!==actorId)throw Error('Verified conversation identity required.');
  return connection.transaction(async q=>{
   const identity=await q("SELECT current_setting('request.jwt.claim.sub',true) AS actor");
   if(identity.rows[0]?.actor!==actorId)throw Error('Verified database identity required.');
   const result=await q('SELECT studio_private.artist_conversation_dispatch_v1($1::text,$2::jsonb) AS value',[action,JSON.stringify(input)]);
   if(result.rows.length!==1||result.rows[0].value==null)throw Error('Conversation operation was not confirmed.');
   return result.rows[0].value;
  });
 };
 return {hosted:true,canCreator:(actor:string)=>call(actor,'canCreator'),conversations:(actor:string)=>call(actor,'read'),
  shortlist:(actor:string,input:any)=>call(actor,input.action==='remove-shortlist'?'removeShortlist':'shortlist',input),
  requestIntroduction:(actor:string,input:any)=>call(actor,'request',input),
  respondIntroduction:(actor:string,input:any)=>call(actor,'respond',input)};
}
