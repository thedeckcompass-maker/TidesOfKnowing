import {guidebookOutline,outlineSlots} from './guidebookOutline';
import {readableFields,fieldsMarkdown} from './readableFields';
import {readingManuscript} from './readingText';
import {preparedVisualImage} from './visualDesign';
export type EditorialSource={kind:'card'|'card-entry'|'guidebook'|'image';id:string;version:string;versionId:string|null;title:string;text:string;image:string;fingerprint:string};
export async function fingerprint(value:unknown){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');}
// Owned-project query first. Never query journal records or other projects.
export async function editorialSources(client:import('@supabase/supabase-js').SupabaseClient,actor:string,projectId:string){
 const {data:project,error}=await client.from('studio_projects').select('id,owner_id,name,settings').eq('id',projectId).eq('owner_id',actor).maybeSingle();if(error||!project)throw Error('Project not found.');
 const [cards,sections]=await Promise.all([client.from('studio_cards').select('id,title').eq('project_id',projectId),client.from('studio_guidebook_sections').select('id,title').eq('project_id',projectId)]);if(cards.error||sections.error)throw Error('Source list unavailable.');
 const sources:EditorialSource[]=[];
 const outline=guidebookOutline(project.settings);
 for(const card of cards.data??[]){
  const text=outlineSlots(outline,card.id).filter(s=>s.text.trim()).map(s=>'## '+s.label+'\n\n'+s.text).join('\n\n');
  if(!text)continue;
  // A settings revision is not a historical card-version UUID. Keep the identities distinct.
  const value={kind:'card-entry' as const,id:card.id,version:'entry:'+outline.revision,versionId:null,title:card.title+' - guidebook entry',text,image:''};
  sources.push({...value,fingerprint:await fingerprint(value)});
 }
 for(const [kind,items,table,key]of [['card',cards.data??[],'studio_card_versions','card_id'],['guidebook',sections.data??[],'studio_guidebook_versions','section_id']] as const){for(const item of items){const {data:versions,error:versionError}=await client.from(table).select('id,version_number,snapshot').eq(key,item.id).order('version_number',{ascending:false});if(versionError)throw Error('Saved versions unavailable.');for(const version of versions??[]){if(!version.snapshot||typeof version.snapshot!=='object')continue;const snapshot=version.snapshot;const value={kind,id:item.id,version:String(version.version_number),versionId:String(version.id),title:typeof snapshot.title==='string'?snapshot.title:item.title,text:kind==='card'?fieldsMarkdown(readableFields(snapshot,'card')):readingManuscript(snapshot),image:''};sources.push({...value,fingerprint:await fingerprint(value)});}}}
 for(const ref of project.settings?.visual_design_v1?.references??[]){if(typeof ref.id!=='string'||!ref.image)continue;const image=preparedVisualImage(ref.image),value={kind:'image' as const,id:ref.id,version:'Saved reference',versionId:ref.id,title:typeof ref.note==='string'?ref.note:'Visual reference',text:typeof ref.note==='string'?ref.note:'',image};sources.push({...value,fingerprint:await fingerprint(value)});}
 return {project,sources};
}
export function selectedPacket(source:EditorialSource,selected:string){if(typeof selected!=='string'||selected.length>50000||(!selected.trim()&&!source.image))throw Error('Select the passage or reference image you want reviewed.');// HTML form submission normalizes line endings to CRLF; preserve exact text apart from that transport encoding.
selected=selected.replace(/\r\n?/g,'\n');if(selected&&!source.text.replace(/\r\n?/g,'\n').includes(selected))throw Error('The selected text must be an exact passage from this saved version. Keep your additional context in the question.');return {source_kind:source.kind,source_id:source.id,source_version:source.version,source_version_id:source.versionId,source_fingerprint:source.fingerprint,title:source.title,selected_text:selected,selected_image:source.image};}
