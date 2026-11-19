/** Exploratory text stored in the existing inspiration entry, never a new project/store. */
export const BRAINSTORM_FIELDS=[['concept','The idea I want to explore'],['possibilities','Possibilities and different directions'],['meaning','Why this interests me and what someone might discover'],['questions','Questions, connections and things to investigate'],['next','One small experiment or next step']] as const;
export type Brainstorm={fields:Record<string,string>;previousInspirationId:string|null};
const prefix='DCS exploratory inspiration v1\n';
export function encodeBrainstorm(value:Brainstorm){
 if(value.previousInspirationId!==null&&!/^[a-f0-9-]{36}$/i.test(value.previousInspirationId))throw Error('The earlier inspiration reference could not be verified.');
 const fields=Object.fromEntries(BRAINSTORM_FIELDS.map(([k])=>{const v=value.fields[k];if(typeof v!=='string'||v.length>3000)throw Error('Keep each exploration within 3,000 characters.');return[k,v];}));
 if(!Object.values(fields).some(v=>v.trim()))throw Error('Add an idea or possibility before saving your exploration.');
 return prefix+JSON.stringify({fields,previousInspirationId:value.previousInspirationId});
}
export function inspirationWriting(text:string){const b=decodeBrainstorm(text);return b?'# Exploratory deck idea\n\n'+BRAINSTORM_FIELDS.filter(([k])=>b.fields[k].trim()).map(([k,label])=>'## '+label+'\n\n'+b.fields[k]).join('\n\n'):text;}
export function decodeBrainstorm(text:string):Brainstorm|null{
 if(!text.startsWith(prefix))return null;try{const v=JSON.parse(text.slice(prefix.length));if(!v||!v.fields||Object.keys(v.fields).length!==BRAINSTORM_FIELDS.length||BRAINSTORM_FIELDS.some(([k])=>typeof v.fields[k]!=='string'||v.fields[k].length>3000))return null;if(v.previousInspirationId!==null&&!/^[a-f0-9-]{36}$/i.test(v.previousInspirationId))return null;return v;}catch{return null;}
}
