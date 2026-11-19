import type {APIRoute} from 'astro';
import {sameOriginMutation} from '../../../../lib/studio/access';
import {createCommunityServiceClient} from '../../../../lib/community/supabaseServer';
import {readOriginal,verifyOriginal,supabaseOriginalStorage,type OriginalStorage} from '../../../../lib/studio/quotationEvidenceStorage';
import {quotationHash,assertQuotationReference,type Enquiry,type QuoteImport} from '../../../../lib/studio/quotationEvidence';
type Proof={storageProof?:{id:string;sha256:string}};
export interface QuotationPort {quotationRead(who:string,id?:string):Promise<{quotes:Enquiry[]}>;quotationAct(who:string,input:Record<string,unknown>,context?:Proof):Promise<{revision:number;evidence?:QuoteImport}>}
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
export function quotationEvidenceHandlers(storageFactory:(locals:App.Locals)=>OriginalStorage){
 async function access(locals:App.Locals,id:string|undefined){if(!locals.user||locals.profile?.id!==locals.user.id||locals.profile.status!=='active'||!id)throw Error('Active authenticated administrator required.');const store=(locals as App.Locals & {studioServiceRecords?:QuotationPort}).studioServiceRecords;if(!store)throw Error('Service records are unavailable.');const data=await store.quotationRead(locals.user.id,id),q=data.quotes.find(q=>q.id===id);if(!q)throw Error('Quotation enquiry not found.');return {store,q,who:locals.user.id};}
 const POST:APIRoute=async({request,locals,params})=>{
  if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
  try{const {store,q,who}=await access(locals,params.enquiryId),u=new URL(request.url),key=request.headers.get('x-retry-key'),versionId=u.searchParams.get('versionId'),versionHash=u.searchParams.get('versionHash'),expectedRevision=u.searchParams.get('revision');
   if(!key||key.length>100)throw Error('Keep a valid import retry key.');const x=q.quotationEvidence;if(!x)throw Error('Quotation changed. Reload before importing.');const version=x.versions.find(v=>v.versionId===versionId&&v.canonicalSHA256===versionHash);if(!version)throw Error('Exact quotation version required.');
   const original=await readOriginal(request),filename=request.headers.get('x-original-filename')??'',direction=u.searchParams.get('direction');
   const existing=x.imports.find(i=>i.quotationVersionId===versionId&&i.direction===direction&&i.sha256===original.sha256);
   if(existing)assertQuotationReference(existing,q.id);
   const reserved=await store.quotationAct(who,{action:'quote-import-reserve',key,enquiryId:q.id,expectedRevision,versionId,versionHash,originalFilename:filename,direction,sha256:original.sha256,byteCount:original.byteCount,parsedHeaderMetadata:original.parsedHeaderMetadata});
   const fresh=(await store.quotationRead(who,q.id)).quotes.find(candidate=>candidate.id===q.id),e=fresh?.quotationEvidence?.imports.find(i=>i.evidenceId===reserved.evidence?.evidenceId);if(!e||!fresh)throw Error('Reserved evidence could not be read.');
   assertQuotationReference(e,q.id);
   if(e.sha256!==original.sha256||e.byteCount!==original.byteCount||e.quotationVersionId!==versionId||e.direction!==direction)throw Error('Reserved original does not match the submitted evidence. Record retained for review.');
   const storage=storageFactory(locals);try{await verifyOriginal(storage,e,q.id,original.bytes)}catch(error){try{await store.quotationAct(who,{action:'quote-import-fail',key:crypto.randomUUID(),enquiryId:q.id,expectedRevision:fresh.quotationEvidence!.revision,versionId,versionHash,evidenceId:e.evidenceId,sha256:e.sha256})}catch{}throw error;}
   if(e.captureState==='verified')return json({saved:true,unchanged:true,evidenceId:e.evidenceId});
   await store.quotationAct(who,{action:'quote-import-verify',key:quotationHash(key+':verified'),enquiryId:q.id,expectedRevision:fresh.quotationEvidence!.revision,versionId,versionHash,evidenceId:e.evidenceId,sha256:e.sha256},{storageProof:{id:e.evidenceId,sha256:e.sha256}});
   return json({saved:true,evidenceId:e.evidenceId,message:'Original retained and verified. Acceptance and payment were not authorised.'});
  }catch(error){return json({error:(error as Error).message},409)}
 };
 const GET:APIRoute=async({request,locals,params})=>{try{const {q}=await access(locals,params.enquiryId),id=new URL(request.url).searchParams.get('evidenceId'),e=q.quotationEvidence?.imports.find(i=>i.evidenceId===id&&i.captureState==='verified');if(!e)throw Error('Verified original not found.');assertQuotationReference(e,q.id);const bytes=await verifyOriginal(storageFactory(locals),e,q.id);return new Response(new Blob([bytes as BlobPart]),{headers:{'Content-Type':'message/rfc822','Content-Disposition':'attachment; filename="'+e.originalFilename+'"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})}catch(error){return json({error:(error as Error).message},404)}};
 return {POST,GET};
}
const handlers=quotationEvidenceHandlers(locals=>supabaseOriginalStorage(createCommunityServiceClient(locals)));
export const prerender=false;export const POST=handlers.POST;export const GET=handlers.GET;
