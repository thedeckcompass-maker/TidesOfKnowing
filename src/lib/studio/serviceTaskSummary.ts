export function serviceTasks(data:any,now=Date.now()){
 const groups={requests:[] as any[],scheduling:[] as any[],sessions:[] as any[],assessments:[] as any[],deadlines:[] as any[]};
 const seenGroups=new Set<string>();
 for(const e of data.entries){const end=Date.parse(e.promise.editorialEnds),active=Date.parse(e.promise.start)<=now&&end>now;const href='#service-entry-'+encodeURIComponent(e.id),add=(bucket:keyof typeof groups,title:string)=>groups[bucket].push({title,member:e.name,entryId:e.id,href});if(!active)continue;
 const invitations=data.groups.filter((g:any)=>Date.parse(g.at)>now&&g.invitations.some((i:any)=>i.enrolmentId===e.id&&i.rsvp!=='no'));
 if(e.nextGroupRequested&&!invitations.length){add('requests','Group session requested');add('scheduling','Arrange a group session');}
 for(const c of e.consultations){if(c.status==='requested'){add('requests','Private consultation requested');add('scheduling','Arrange a private consultation');}if(c.status==='scheduled'&&c.date&&Date.parse(c.date)<=now+7*86400000)add('sessions','Private consultation: '+new Date(c.date).toLocaleString('en-GB',{timeZone:'UTC'})+' UTC');}
 for(const r of e.reviews){if(r.status==='requested')add('requests','Assessment requested — awaiting submitted work');if(['submitted','in_review'].includes(r.status))add('assessments','Written assessment awaiting delivery');}
 for(const g of data.groups){const i=g.invitations.find((v:any)=>v.enrolmentId===e.id);if(i&&!i.attended&&i.rsvp!=='no'&&Date.parse(g.at)<=now+7*86400000&&(Date.parse(g.at)>now||i.rsvp==='yes')&&!seenGroups.has(g.id)){seenGroups.add(g.id);add('sessions',g.title+' — '+new Date(g.at).toLocaleString('en-GB',{timeZone:'UTC'})+' UTC');}}
 if(end-now<=30*86400000&&(e.groupsRemaining+e.consultationsRemaining+e.reviewsRemaining)>0)add('deadlines',Math.ceil((end-now)/86400000)+' days left; '+e.groupsRemaining+' groups, '+e.consultationsRemaining+' consultations and '+e.reviewsRemaining+' assessments remain');
 }
 for(const q of data.quotes??[])if(q.status==='requested')groups.requests.push({title:'Additional work quote requested: '+q.project,member:data.entries.find((e:any)=>e.ownerId===q.ownerId)?.name??'Member',href:'#service-quote-'+encodeURIComponent(q.id)});
 return groups;
}
export function pendingPassInvitations(data:any,now=Date.now()){
 const result:any[]=[];for(const e of data.entries){if(e.promise.programme!=='explore-pass'||e.groupsRemaining<=0||Date.parse(e.promise.start)>now||Date.parse(e.promise.editorialEnds)<=now)continue;for(const g of data.groups){const i=g.invitations.find((v:any)=>v.enrolmentId===e.id);if(i?.rsvp==='invited'&&!i.attended&&Date.parse(g.at)>now)result.push({entry:e,group:g});}}return result;
}
