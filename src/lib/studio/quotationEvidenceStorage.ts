import {QUOTATION_LIMITS,quotationHash,bounded,assertQuotationReference,type QuoteImport} from './quotationEvidence';
export interface OriginalStorage {upload(path:string,bytes:Uint8Array):Promise<void>;download(path:string):Promise<Uint8Array|null>}
export async function readOriginal(request:Request){
 const type=request.headers.get('content-type')?.split(';')[0].trim();if(type!=='message/rfc822')throw Error('Upload an original .eml as message/rfc822.');
 const declared=request.headers.get('content-length');if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>QUOTATION_LIMITS.original))throw Error('Original exceeds the 20000000-byte limit.');
 const reader=request.body?.getReader();if(!reader)throw Error('Original message is missing.');const chunks:Uint8Array[]=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>QUOTATION_LIMITS.original){await reader.cancel();throw Error('Original exceeds the 20000000-byte limit. Nothing was truncated.');}chunks.push(value)}}finally{reader.releaseLock()}
 if(!size||(declared!==null&&Number(declared)!==size))throw Error('Original message is empty or truncated.');const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 const preview=new TextDecoder('utf-8',{fatal:false}).decode(bytes.subarray(0,Math.min(size,65536)));const split=preview.search(/\r?\n\r?\n/);if(split<0)throw Error('An original message header/body separator within 65536 bytes is required.');
 const header=preview.slice(0,split);if(header.includes('\0'))throw Error('Invalid original headers.');const metadata:Record<string,string>={};for(const line of header.replace(/\r?\n[ \t]+/g,' ').split(/\r?\n/)){const match=/^([A-Za-z0-9-]+):[ \t]*(.*)$/.exec(line);if(!match)throw Error('Malformed original message headers.');const k=match[1].toLowerCase();if(['from','to','cc','subject','date','message-id','in-reply-to','references'].includes(k)){if(metadata[k]!==undefined)throw Error('Ambiguous duplicate original header: '+k);metadata[k]=match[2];}}
 for(const k of ['from','to','date','subject'])if(!metadata[k])throw Error('Original message must contain '+k+'.');bounded(metadata,QUOTATION_LIMITS.metadata,'Original header metadata');
 return {bytes,sha256:quotationHash(bytes),byteCount:size,parsedHeaderMetadata:metadata};
}
export async function verifyOriginal(storage:OriginalStorage,e:QuoteImport,authorizedEnquiryId:string,bytes?:Uint8Array){
 assertQuotationReference(e,authorizedEnquiryId);
 let existing=await storage.download(e.objectKey);
 if(!existing&&bytes){try{await storage.upload(e.objectKey,bytes)}catch(error){existing=await storage.download(e.objectKey);if(!existing)throw error;}}
 const saved=existing??await storage.download(e.objectKey);if(!saved||saved.byteLength!==e.byteCount||quotationHash(saved)!==e.sha256)throw Error('Stored original verification failed. The pending record and original are retained; no acceptance was recorded.');return saved;
}
export function supabaseOriginalStorage(service:{storage:{from(bucket:string):{upload(path:string,bytes:Uint8Array,options:{contentType:string;upsert:boolean}):Promise<{error:unknown}>;download(path:string):Promise<{data:Blob|null;error:unknown}>}}}):OriginalStorage{
 const bucket=service.storage.from('ask-leilia-uploads');return {
  async upload(path,bytes){const {error}=await bucket.upload(path,bytes,{contentType:'message/rfc822',upsert:false});if(error)throw Error('Original upload was not confirmed. Retry the same retained file.');},
  async download(path){const {data,error}=await bucket.download(path);if(error||!data)return null;if(data.size>QUOTATION_LIMITS.original)throw Error('Stored original exceeds the application limit.');return new Uint8Array(await data.arrayBuffer());}
 };
}
