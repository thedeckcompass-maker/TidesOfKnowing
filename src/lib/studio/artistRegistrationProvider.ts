import type {PrivatePgConnection} from './postgresServiceRepository';
/** Verified server composition only. Portfolio submission remains a separate provider. */
export function prepareArtistRegistrationProvider(connection:PrivatePgConnection,actorId:string){
 const call=async(actor:string,action:string,input:unknown={})=>{
  if(actor!==actorId)throw Error('Account identity mismatch.');
  return connection.transaction(async query=>{
   const identity=await query("SELECT current_setting('request.jwt.claim.sub',true) AS actor");
   if(identity.rows[0]?.actor!==actorId)throw Error('Verified identity is required.');
   const r=await query('SELECT studio_private.exchange_dispatch_v1($1::text,$2::jsonb) AS value',[action,JSON.stringify(input)]);
   if(r.rows.length!==1||r.rows[0].value===null)throw Error('Artist operation was not confirmed.');return r.rows[0].value;
  });
 };
 return {registration:(actor:string)=>call(actor,'registration'),registerRole:(actor:string,role:string,revision:number)=>call(actor,'registerRole',{role,revision}),registeredArtist:(actor:string)=>call(actor,'registeredArtist'),canExchange:(actor:string)=>call(actor,'canPost'),exchangeBoard:(actor:string,id='')=>call(actor,'board',{id}),exchangeOwner:(actor:string,project_id:string)=>call(actor,'owner',{project_id}),exchangeDraft:(actor:string,input:unknown)=>call(actor,'draft',input),exchangeState:(actor:string,input:any)=>call(actor,input.action,input),exchangeInterest:(actor:string,input:unknown)=>call(actor,'interest',input)};
}
export function artistRegistrationStore(locals:any){return locals.studioArtistLocal===true?locals.studioArtistStore??null:locals.studioArtistRegistrationEnabled===true?locals.studioArtistRegistrationProvider??null:null;}
