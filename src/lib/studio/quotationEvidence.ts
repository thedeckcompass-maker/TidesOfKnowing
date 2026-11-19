import {createHash} from 'node:crypto';

export const QUOTATION_LIMITS=Object.freeze({original:20_000_000,metadata:2_048,version:8_000,aggregate:4_000_000});
export const QUOTATION_PREFIX='dcs-quotation-evidence/';
export function canonical(value:unknown):string {
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 return '{'+Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
}
export const quotationHash=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
export function quotationObjectKey(authorizedEnquiryId:string,evidenceId:string,digest:string){
 if(typeof authorizedEnquiryId!=='string'||!authorizedEnquiryId||typeof evidenceId!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(evidenceId)||typeof digest!=='string'||!/^[a-f0-9]{64}$/.test(digest))throw Error('Invalid original evidence reference. Record retained for review.');
 return QUOTATION_PREFIX+'v1/'+quotationHash(authorizedEnquiryId)+'/'+evidenceId+'/'+digest+'.eml';
}
export function assertQuotationReference(e:QuoteImport,authorizedEnquiryId:string){
 if(e.enquiryId!==authorizedEnquiryId||e.objectKey!==quotationObjectKey(authorizedEnquiryId,e.evidenceId,e.sha256))throw Error('Original evidence reference does not match the authorized enquiry. Record retained for review.');
}

export const bytes=(value:unknown)=>new TextEncoder().encode(canonical(value)).length;
export function bounded(value:unknown,limit:number,label:string){if(bytes(value)>limit)throw Error(label+' exceeds '+limit+' UTF-8 bytes. Nothing was truncated.');}
export type QuoteVersion={versionId:string;versionNumber:number;previousVersionId:string|null;scope:string;priceDecimal:string;currency:string;conditions:string;recipientEmailAtPreparation:string;preparedBy:string;preparedAt:string;canonicalSHA256:string};
export type QuoteImport={evidenceId:string;enquiryId:string;quotationVersionId:string;direction:'sent'|'received';objectKey:string;sha256:string;byteCount:number;mediaType:'message/rfc822';originalFilename:string;acquiredFrom:'Thunderbird export';importedBy:string;importedAt:string;parsedHeaderMetadata:Record<string,string>;captureState:'pending'|'verified'|'failed'};
export type QuoteEvent={id:string;kind:string;actor:string;at:string;versionId:string;versionHash:string;[key:string]:unknown};
export type QuoteExtension={schemaVersion:1;revision:number;versions:QuoteVersion[];imports:QuoteImport[];events:QuoteEvent[]};
export type Enquiry={id:string;ownerId:string;category:string;project:string;outcome:string;status:string;createdAt:string;quotationEvidence?:QuoteExtension};
export type QuoteLedger={quotes:Enquiry[];[key:string]:unknown};
export const emptyQuotation=():QuoteExtension=>({schemaVersion:1,revision:0,versions:[],imports:[],events:[]});
export function publicEnquiry(q:Enquiry){return {id:q.id,ownerId:q.ownerId,category:q.category,project:q.project,outcome:q.outcome,status:q.status,createdAt:q.createdAt};}
export function quotationTarget(state:QuoteLedger,id:unknown){const q=state.quotes?.find(q=>q.id===id);if(!q)throw Error('Quotation enquiry not found.');return q;}
const text=(v:unknown,name:string,max=8000)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('Enter valid '+name+'.');return v;};
export function checkAggregate(state:QuoteLedger){bounded(state.quotes.map(q=>q.quotationEvidence??null),QUOTATION_LIMITS.aggregate,'Quotation evidence ledger');}
export function applyQuotation(state:QuoteLedger,input:Record<string,unknown>,who:string,at:string,verifiedEmail?:string){
 const q=quotationTarget(state,input.enquiryId),x=q.quotationEvidence??emptyQuotation();
 if(!/^(0|[1-9]\d*)$/.test(String(input.expectedRevision))||!Number.isSafeInteger(Number(input.expectedRevision))||Number(input.expectedRevision)!==x.revision)throw Error('Quotation record changed. Reload and review before retrying.');
 const action=input.action;
 if(action==='quote-version-record'){
  if(!verifiedEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verifiedEmail))throw Error('Verified creator email is unavailable.');
  const scope=text(input.scope,'scope'),conditions=text(input.conditions,'conditions'),priceDecimal=text(input.priceDecimal,'price'),currency=text(input.currency,'currency');
  if(!/^(0|[1-9]\d{0,11})(\.\d{1,6})?$/.test(priceDecimal)||!/[A-Z]{3}/.test(currency)||currency.length!==3)throw Error('Use an exact non-negative decimal price and three-letter uppercase currency.');
  const body={versionId:crypto.randomUUID(),versionNumber:x.versions.length+1,previousVersionId:x.versions.at(-1)?.versionId??null,scope,priceDecimal,currency,conditions,recipientEmailAtPreparation:verifiedEmail,preparedBy:who,preparedAt:at};
  const version={...body,canonicalSHA256:quotationHash(canonical(body))};bounded(version,QUOTATION_LIMITS.version,'Quotation version');x.versions.push(version);
 }else{
  const v=x.versions.find(v=>v.versionId===input.versionId);if(!v||v.canonicalSHA256!==input.versionHash)throw Error('Exact quotation version and hash required.');
  const base={id:crypto.randomUUID(),kind:String(action),actor:who,at,versionId:v.versionId,versionHash:v.canonicalSHA256};
  const evidence=(id:unknown,direction:string)=>{const e=x.imports.find(e=>e.evidenceId===id);if(!e||e.quotationVersionId!==v.versionId||e.direction!==direction||e.captureState!=='verified')throw Error('Verified original correspondence for this version is required.');return e;};
  if(action==='quote-import-reserve'){
   const digest=text(input.sha256,'original hash');if(!/^[a-f0-9]{64}$/.test(digest))throw Error('Invalid original hash.');
   const byteCount=Number(input.byteCount);if(!Number.isSafeInteger(byteCount)||byteCount<1||byteCount>QUOTATION_LIMITS.original)throw Error('Original exceeds the 20000000-byte limit.');
   if(!['sent','received'].includes(String(input.direction)))throw Error('Choose Sent or received original.');
   const filename=text(input.originalFilename,'filename',128);if(!/^[A-Za-z0-9][A-Za-z0-9 ._()-]*\.eml$/i.test(filename)||filename.includes('..'))throw Error('Use a simple .eml filename without paths.');
   const metadata=input.parsedHeaderMetadata;if(!metadata||typeof metadata!=='object'||Array.isArray(metadata)||Object.values(metadata).some(v=>typeof v!=='string'))throw Error('Original header metadata is required.');
   const same=x.imports.find(e=>e.sha256===digest&&e.quotationVersionId===v.versionId&&e.direction===input.direction);if(same)return {saved:true,unchanged:true,revision:x.revision,evidence:structuredClone(same)};
   const id=crypto.randomUUID(),e:QuoteImport={evidenceId:id,enquiryId:q.id,quotationVersionId:v.versionId,direction:input.direction as 'sent'|'received',objectKey:quotationObjectKey(q.id,id,digest),sha256:digest,byteCount,mediaType:'message/rfc822',originalFilename:filename,acquiredFrom:'Thunderbird export',importedBy:who,importedAt:at,parsedHeaderMetadata:metadata as Record<string,string>,captureState:'pending'};
   bounded(e,QUOTATION_LIMITS.metadata,'Evidence reference');x.imports.push(e);
  }else if(action==='quote-import-verify'||action==='quote-import-fail'){
   const e=x.imports.find(e=>e.evidenceId===input.evidenceId&&e.quotationVersionId===v.versionId);if(!e||e.sha256!==input.sha256)throw Error('Reserved original mismatch.');
   if(action==='quote-import-verify'){e.captureState='verified';}else if(e.captureState!=='verified'){e.captureState='failed';}
   const event={...base,evidenceId:e.evidenceId,sha256:e.sha256};bounded(event,QUOTATION_LIMITS.metadata,'Capture event');x.events.push(event);
  }else{
   let event:QuoteEvent=base;
   if(action==='quote-dispatch-evidence-record'){const e=evidence(input.evidenceId,'sent');event={...base,evidenceId:e.evidenceId,meaning:'Outgoing original retained; delivery not proven'};}
   else if(action==='quote-response-evidence-record'){const e=evidence(input.evidenceId,'received');event={...base,evidenceId:e.evidenceId};}
   else if(action==='quote-acceptance-verify'){
    if(v!==x.versions.at(-1)||x.events.some(e=>e.versionId===v.versionId&&['quote-withdrawal-record','quote-version-supersede'].includes(e.kind)))throw Error('This quotation version is no longer current. Fresh written acceptance is required.');
    const sent=evidence(input.outgoingEvidenceId,'sent'),reply=evidence(input.responseEvidenceId,'received');if(sent.evidenceId===reply.evidenceId||sent.sha256===reply.sha256)throw Error('Distinct outgoing original and incoming creator response are required.');
    if(input.verified!==true&&input.verified!=='true')throw Error('Explicit administrator verification is required.');
    event={...base,outgoingEvidenceId:sent.evidenceId,outgoingSHA256:sent.sha256,responseEvidenceId:reply.evidenceId,responseSHA256:reply.sha256,creatorWrittenAcceptance:text(input.creatorWrittenAcceptance,'exact written acceptance transcription',700),identityVerification:text(input.identityVerification,'creator identity verification',300),administratorVerified:true,verificationMethod:'Manual original-message review; not cryptographic sender proof'};
   }else if(action==='quote-version-supersede'){
    const replacement=x.versions.find(e=>e.versionId===input.replacementVersionId&&e.versionNumber>v.versionNumber);if(!replacement)throw Error('Choose an existing newer quotation version.');event={...base,replacementVersionId:replacement.versionId};
   }else if(['quote-withdrawal-record','quote-work-authorisation-record','quote-payment-reference-record'].includes(String(action))){
    if(action==='quote-work-authorisation-record'&&(v!==x.versions.at(-1)||x.events.some(e=>e.versionId===v.versionId&&['quote-withdrawal-record','quote-version-supersede'].includes(e.kind))||!x.events.some(e=>e.kind==='quote-acceptance-verify'&&e.versionId===v.versionId)))throw Error('Written acceptance must be verified first.');
    event={...base,note:text(input.note,'external record reference',1000),effects:'Record only; no payment, allocation or project permission change'};
   }else throw Error('Unsupported quotation operation.');
   bounded(event,QUOTATION_LIMITS.metadata,'Quotation event');x.events.push(event);
  }
 }
 x.revision++;q.quotationEvidence=x;checkAggregate(state);
 return {saved:true,unchanged:false,revision:x.revision,version:x.versions.at(-1),evidence:input.action==='quote-import-reserve'?x.imports.at(-1):undefined};
}
