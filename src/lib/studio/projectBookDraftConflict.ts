// Compare the stored source, regardless of which editor route opened it.
export function bookDraftsConflict(drafts:any[]):boolean {
 const seen=new Set<string>();let outlineSetup=false,outlineCards=false;
 for(const d of drafts.filter(d=>d.dirty)){
  const manuscript=['companion','manuscript'].includes(d.kind);
  const identity=manuscript?(d.sectionId??d.value?.id):d.cardId??d.sectionId;
  // New records are independent until they have a stored identity.
  const key=d.kind.startsWith('new-')?`${d.kind}:${d.tab}:${d.key}`:
   `${manuscript?'manuscript':d.kind}:${identity??''}`;
  if(seen.has(key))return true;seen.add(key);
  if(d.kind==='outline'){if(d.cardId)outlineCards=true;else outlineSetup=true;}
 }
 // A structure snapshot can contain older writing. Require resolution before export.
 return outlineSetup&&outlineCards;
}
