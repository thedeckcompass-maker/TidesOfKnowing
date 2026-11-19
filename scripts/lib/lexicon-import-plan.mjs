import {createHash} from 'node:crypto';
import {mapLexiconFixture} from './lexicon-studio-fixture.mjs';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const targetId=(projectId,kind,sourceId)=>{
  const b=createHash('sha256').update(`lexicon-import-v1:${projectId}:${kind}:${sourceId}`).digest();
  b[6]=(b[6]&15)|80;b[8]=(b[8]&63)|128;const h=b.subarray(0,16).toString('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
};

// Produces review material only. Ownership, entitlement and empty-target checks
// must be verified transactionally by the future executor, not by this function.
export function prepareLexiconImport(fixture,{ownerId,projectId,deckType,pathway}={}){
  if(!uuid.test(ownerId??'')||!uuid.test(projectId??''))throw Error('A proposed owner and project UUID are required');
  const source=mapLexiconFixture(fixture,{deckType,pathway});
  const rekey=(kind,id)=>targetId(projectId,kind,id);
  const familyIds=new Map(source.families.map(f=>[f.id,rekey('family',f.id)]));
  const families=source.families.map(f=>({...f,id:familyIds.get(f.id),project_id:projectId}));
  const cards=source.cards.map(c=>({...c,id:rekey('card',c.id),project_id:projectId,family_id:familyIds.get(c.family_id)}));
  const sections=source.sections.map(s=>({...s,id:rekey('section',s.id),project_id:projectId}));
  const journals=source.journals.map(j=>({...j,id:rekey('journal',j.id),project_id:projectId}));
  const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
  return {mode:'REVIEW_ONLY_NO_WRITES',ownerId,projectId,sourceSha256:fixture.provenance.sourceSha256,checksRequired:['isolated environment','owner identity and project ownership','active Develop-equivalent access','new empty target and no previous import','transactional insert and provenance recording'],projectFields:{...source.project, id:projectId,owner_id:ownerId},families,cards,sections,journals,rollback:{mode:'REVIEW_ONLY',requires:'Explicit approval, original import receipt and proof no record or dependency has been edited or added',rows:[...families,...cards,...sections,...journals].map(row=>({id:row.id,sha256:sha(row)}))},unmapped:source.preservedUnmapped};
}
