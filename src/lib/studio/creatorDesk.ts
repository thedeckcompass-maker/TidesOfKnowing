import {accountInspiration} from './accountInspiration';
import {projectDestination} from './navigation';

export type EditorialDeskState='eligible'|'not-included'|'unavailable'|'disabled-preview';
export function creatorDeskTiles(projectId:string|undefined,state:EditorialDeskState){
 const tiles=[
  {label:'Capture an idea',href:'?capture=choose#capture',description:'Keep inspiration, write for a project or explore a possible deck.'},
  {label:'My projects',href:'/studio/?orientation=skip',description:'Resume your deck or create a working project.'},
  {label:'Quick add a card',href:projectDestination('addcard',projectId),description:'Choose a project and go straight to a new card.'},
  {label:'My Project Workbook',href:projectDestination('workbook',projectId),description:'Review how your concept, manuscript and launch plans come together.'},
  {label:'Community',href:'/studio/community/',description:'Find a conversation or ask a question.'},
  {label:'The Eight Pillars',href:'/studio/journey-map/?from=%2Fstudio%2Fcreators-desk%2F',description:'Explore the complete eight-Section creative methodology.'}
 ];
 // Navigation is available even without included programme services. The
 // destination still checks access and displays only recorded allowances.
 tiles.push({label:'Editorial Support',href:'/studio/editorial-support/',description:'Check your recorded support and editorial support options.'});
 return tiles;
}

export async function loadCreatorDesk(db:any,owner:string,serviceRecords:any,disabledPreview=false){
 const [projectsResult,saved]=await Promise.all([
  db.from('studio_projects').select('id,name').eq('owner_id',owner).is('deleted_at',null).neq('status','archived').order('updated_at',{ascending:false}),
  db.from('studio_creator_inspiration').select('inbox').eq('owner_id',owner).maybeSingle()
 ]);
 let entries:any[]|null=null;
 let inspirationState:'ready'|'missing-contract'|'unavailable'='unavailable';
 if(saved.error){if(['42P01','PGRST205'].includes(saved.error.code))inspirationState='missing-contract';}
 else try{entries=accountInspiration(saved.data?.inbox).entries;inspirationState='ready';}catch{/* Keep capture unavailable; do not replace malformed saved work. */}
 let editorialState:EditorialDeskState=disabledPreview?'disabled-preview':'unavailable';
 if(!disabledPreview&&serviceRecords)try{
  const records=await serviceRecords.read(owner,false);
  if(!records||!Array.isArray(records.entries))throw Error('Unavailable');
  editorialState=records.entries.some((e:any)=>['collaborate','develop'].includes(e.promise?.programme))?'eligible':'not-included';
 }catch{/* Preserve unavailable independently of inspiration reads. */}
 return {projects:projectsResult.error?null:projectsResult.data??[],entries,inspirationState,editorialState};
}
