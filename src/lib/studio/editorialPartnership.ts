import {serviceAllowancePresentation} from './serviceAllowancePresentation';

export const EDITORIAL_VIEWS=['overview','included','groups','consultations','reviews','additional'] as const;
export type EditorialView=typeof EDITORIAL_VIEWS[number];
export function editorialView(value:unknown):EditorialView{return EDITORIAL_VIEWS.includes(value as EditorialView)?value as EditorialView:'overview';}
export function editorialExcerpt(value:string,limit=180){return value.length>limit?value.slice(0,limit).trimEnd()+'…':value;}
export function editorialHref(view:EditorialView='overview',entry?:string,item?:string,context?:string){
 const params=new URLSearchParams();if(view!=='overview')params.set('view',view);if(entry)params.set('entry',entry);if(item&&view==='reviews')params.set('item',item);if(context?.startsWith('/studio/projects/'))params.set('from',context);
 return '/studio/editorial-support/'+(params.size?'?'+params.toString():'');
}
/** Presentation only. Eligibility and mutations remain with the existing provider. */
export function partnershipState(data:any,actor:string,requestedEntry:string|null,now=Date.now()){
 const entries=(data.entries??[]).filter((e:any)=>e.ownerId===actor);
 const ordered=[...entries].sort((a:any,b:any)=>{
  const live=(e:any)=>now>=Date.parse(e.promise.start)&&now<Date.parse(e.promise.editorialEnds)&&(e.paymentAvailability?.editorial??true);
  return Number(live(b))-Number(live(a))||String(b.promise.start).localeCompare(String(a.promise.start));
 });
 const entry=requestedEntry?entries.find((e:any)=>e.id===requestedEntry):ordered.find((e:any)=>['collaborate','develop','explore-pass'].includes(e.promise.programme));
 if(!entry)return {entries,entry:null,foreignEntry:!!requestedEntry,active:false,consultations:null,reviews:null};
 const active=now>=Date.parse(entry.promise.start)&&now<Date.parse(entry.promise.editorialEnds)&&(entry.paymentAvailability?.editorial??true);
 return {entries,entry,foreignEntry:false,active,
  consultations:serviceAllowancePresentation(entry.promise.benefits.consultations,entry.consultations,'completed',entry.paymentAvailability?.consultations??entry.promise.benefits.consultations,active),
  reviews:serviceAllowancePresentation(entry.promise.benefits.assessments,entry.reviews,'delivered',entry.paymentAvailability?.reviews??entry.promise.benefits.assessments,active)};
}
export function editorialActivity(entry:any,groups:any[]){
 if(!entry)return [];
 const rows:any[]=[];
 for(const g of groups)for(const i of g.invitations??[])if(i.enrolmentId===entry.id)rows.push({id:'group-'+g.id,type:'Group session',view:'groups',subject:g.title,date:g.at,status:i.attended?'Attended':i.rsvp==='no'?'Declined':i.rsvp==='yes'?'Scheduled':'Invitation',consumed:!!i.attended});
 for(const c of entry.consultations)rows.push({id:c.id,type:'Private consultation',view:'consultations',date:c.date,status:c.status==='completed'?'Completed':c.status==='scheduled'?'Scheduled':'Awaiting scheduling',consumed:c.status==='completed'});
 for(const r of entry.reviews){const q=r.submission;rows.push({id:r.id,type:'Written review',view:'reviews',subject:q?.title,purpose:q?.question,date:q?.created_at,projectId:typeof q?.project_id==='string'&&/^[a-f0-9-]{36}$/i.test(q.project_id)?q.project_id:null,status:({requested:'Ready for your material',submitted:'Submitted',in_review:'With your editor',delivered:'Delivered'} as Record<string,string>)[r.status]??'Recorded',consumed:r.status==='delivered',outcome:r.status==='delivered'?q?.replies?.at(-1)?.body:null});}
 return rows.sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0));
}
