import {adminView,type AdminView} from '../lib/studio/communityAdminView';
const root=document.querySelector<HTMLElement>('#dcs-community-admin');
if(root){
 const audience=root.querySelector<HTMLSelectElement>('#audience-filter')!,chapter=root.querySelector<HTMLSelectElement>('#chapter-filter')!,view=root.querySelector<HTMLSelectElement>('#attention-filter')!;
 const cards=[...root.querySelectorAll<HTMLElement>('[data-post]')],pillars=[...root.querySelectorAll<HTMLButtonElement>('[data-pillar]')];
 const labels=new Map(pillars.map(b=>[b.dataset.pillar!,b.childNodes[0].textContent!.trim()]));
 const preference='dcs-community-admin-view:'+root.dataset.adminId;
 try{view.value=adminView(new URLSearchParams(location.search).get('view')??localStorage.getItem(preference));}catch{view.value='all';}
 const matches=(item:HTMLElement,mode:AdminView)=>mode==='all'||(mode==='reported'?Number(item.dataset.openReports)>0:mode==='mentions'?item.dataset.mentions==='true':mode==='scribed'?Number(item.dataset.scribes)>0:item.dataset.itemStatus==='hidden');
 function filter(){
  const mode=adminView(view.value);let visible=0,total=0;
  for(const card of cards){
   const items=[...card.querySelectorAll<HTMLElement>('[data-admin-item]')],count=items.filter(i=>matches(i,mode)).length;
   card.hidden=card.dataset.chapter!==chapter.value||(audience.value!=='all'&&card.dataset.audience!==audience.value)||count===0;
   if(!card.hidden){visible++;total+=count;}
   const question=items.find(i=>i.dataset.kind==='question')!,whole=matches(question,mode),allContext=mode==='all'||(mode==='hidden'&&whole);
   question.hidden=false;question.dataset.filterContext=String(!whole);question.querySelector<HTMLElement>('[data-context-label]')!.hidden=whole;
   for(const group of card.querySelectorAll<HTMLElement>('[data-thread-group]')){
    const parent=group.querySelector<HTMLElement>('[data-admin-item]')!,children=[...group.querySelectorAll<HTMLElement>('[data-kind=reply]')];
    const parentMatch=matches(parent,mode);group.hidden=!allContext&&!parentMatch&&!children.some(c=>matches(c,mode));
    parent.hidden=false;parent.dataset.filterContext=String(!parentMatch);parent.querySelector<HTMLElement>('[data-context-label]')!.hidden=parentMatch;
    for(const child of children){const match=matches(child,mode);child.hidden=!allContext&&!(mode==='hidden'&&parentMatch)&&!match;child.dataset.filterContext=String(!match);child.querySelector<HTMLElement>('[data-context-label]')!.hidden=match;}
   }
  }
  for(const b of pillars){
   b.setAttribute('aria-pressed',String(b.dataset.pillar===chapter.value));const matching=cards.filter(c=>c.dataset.chapter===b.dataset.pillar&&(audience.value==='all'||c.dataset.audience===audience.value));
   const active=matching.filter(c=>[...c.querySelectorAll<HTMLElement>('[data-admin-item]')].some(i=>matches(i,mode)));
   b.querySelector('[data-discussion-count]')!.textContent=active.length+' '+(active.length===1?'discussion':'discussions');
   b.querySelector('[data-attention-count]')!.textContent='('+matching.reduce((n,c)=>n+[...c.querySelectorAll<HTMLElement>('[data-admin-item]')].filter(i=>matches(i,mode)).length,0)+')';
  }
  root!.querySelector('#selected-pillar-heading')!.textContent=labels.get(chapter.value)??'';
  root!.querySelector<HTMLElement>('[data-empty-pillar]')!.hidden=visible!==0;
  root!.querySelector('[data-filter-status]')!.textContent=visible+' '+(visible===1?'discussion':'discussions')+' shown · '+total+' matching '+(total===1?'item':'items');
 }
 audience.addEventListener('change',filter);chapter.addEventListener('change',filter);view.addEventListener('change',()=>{try{localStorage.setItem(preference,adminView(view.value));}catch{}filter();});
 root.addEventListener('dcs-admin-comments-updated',filter);
 for(const b of pillars)b.addEventListener('click',()=>{chapter.value=b.dataset.pillar!;filter();root.querySelector<HTMLElement>('#selected-pillar-heading')!.focus();});
 function reveal(hash:string){const target=document.getElementById(hash.replace(/^#/,'')),card=target?.closest<HTMLElement>('[data-post]');if(!card)return;chapter.value=card.dataset.chapter!;if(audience.value!=='all'&&audience.value!==card.dataset.audience)audience.value='all';const item=target?.closest<HTMLElement>('[data-admin-item]');if(item&&!matches(item,adminView(view.value)))view.value='all';filter();for(const ancestor of [item,...item?.querySelectorAll<HTMLElement>('details')??[]])if(ancestor?.tagName==='DETAILS')ancestor.setAttribute('open','');target!.scrollIntoView({block:'center'});target!.setAttribute('tabindex','-1');target!.focus({preventScroll:true});}
 root.querySelectorAll<HTMLAnchorElement>('[data-target-chapter]').forEach(a=>a.addEventListener('click',()=>reveal(a.hash)));
 root.querySelectorAll<HTMLAnchorElement>('[data-open-discussion]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();view.value='all';chapter.value=a.closest<HTMLElement>('[data-post]')!.dataset.chapter!;filter();reveal('#moderate-'+a.closest<HTMLElement>('[data-post]')!.dataset.postId);}));
 window.addEventListener('hashchange',()=>reveal(location.hash));filter();if(location.hash)reveal(location.hash);
 const reportFilter=root.querySelector<HTMLSelectElement>('#report-status-filter')!;
 reportFilter.addEventListener('change',()=>{let count=0;for(const r of root.querySelectorAll<HTMLElement>('[data-report-row]')){r.hidden=reportFilter.value!=='all'&&r.dataset.reportState!==reportFilter.value;if(!r.hidden)count++;}root.querySelector<HTMLElement>('[data-empty-reports-view]')!.hidden=count>0;root.querySelector('[data-empty-reports-view]')!.textContent=reportFilter.value==='open'?'No open reports need review.':'No reports match this status.';});
 const busy=new WeakSet<HTMLFormElement>(),blocked=new WeakSet<HTMLFormElement>();
 const input=(f:HTMLFormElement,name:string)=>f.elements.namedItem(name) as HTMLInputElement;
 const noun=(form:HTMLFormElement)=>input(form,'reply_id').value?'comment':'discussion';
 function syncHiddenBody(item:HTMLElement,state:string){
  let details=item.querySelector<HTMLElement>(':scope > .admin-hidden-body');
  if(state==='hidden'&&!details){const words=[...item.querySelectorAll<HTMLElement>(':scope > .admin-words')];if(words.length){details=document.createElement('details');details.className='admin-hidden-body';const summary=document.createElement('summary');summary.textContent='Hidden '+(item.dataset.kind==='question'?'original question':item.dataset.kind)+' — show preserved text';details.append(summary);words[0].before(details);details.append(...words);}}
  if(state!=='hidden'&&details){for(const child of [...details.children])if(child.tagName!=='SUMMARY')details.before(child);details.remove();}
 }
 function updateEvidence(evidence:any,posts:any[]){
  root!.querySelector('[data-open-report-summary]')!.textContent='Reports ('+posts.reduce((n,p)=>n+Number(p.open_report_count??0)+(p.replies??[]).reduce((s:number,r:any)=>s+Number(r.open_report_count??0),0),0)+' open)';
  const findPost=(record:any)=>posts.find(p=>p.id===record.post_id||p.replies?.some((r:any)=>r.id===record.reply_id));
  const cell=(text:string)=>{const td=document.createElement('td');td.textContent=text;return td;};
  const target=(record:any)=>{const td=document.createElement('td'),post=findPost(record);if(post){const link=document.createElement('a');link.className='admin-item-link';link.textContent='View item';link.href='#moderate-'+(record.reply_id??post.id);link.addEventListener('click',()=>reveal(link.hash));td.append(link);}else td.textContent='Target unavailable';return td;};
  const audit=root!.querySelector('#community-history tbody');if(audit)audit.replaceChildren(...evidence.audit.map((a:any)=>{const tr=document.createElement('tr'),details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Reason and administrator';const reason=document.createElement('p');reason.className='admin-words';reason.textContent=a.reason;const actor=document.createElement('p');actor.textContent='Assigned administrator '+a.actor;details.append(summary,reason,actor);const detailCell=document.createElement('td');detailCell.append(details);tr.append(cell(a.action.replaceAll('_',' ')),cell(a.reply_id?'Comment':'Discussion'),cell(new Date(a.created_at).toLocaleString('en-GB')),detailCell,target(a));return tr;}));
  const reportsBody=root!.querySelector('#community-reports tbody');if(reportsBody)reportsBody.replaceChildren(...evidence.reports.map((r:any)=>{const tr=document.createElement('tr');tr.dataset.reportRow='';tr.dataset.reportState=r.status;const reason=cell(r.reason);if(r.notes){const details=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p');summary.textContent='Read report details';text.className='admin-words';text.textContent=r.notes;details.append(summary,text);reason.append(details);}tr.append(cell(r.reply_id?'Comment':'Discussion'),reason,cell(r.status),cell(new Date(r.created_at).toLocaleString('en-GB')),target(r));return tr;}));
  reportFilter.dispatchEvent(new Event('change'));
 }
 function refreshControls(form:HTMLFormElement,record:any,reports:any[]){
  const isReply=!!input(form,'reply_id').value,actions=record.status==='hidden'?['restore']:record.status==='published'?(isReply?['hide']:['hide','lock']):record.status==='locked'&&!isReply?['hide','unlock']:[];
  const open=reports.filter(r=>r.status==='open'&&(isReply?r.reply_id===record.id:r.post_id===record.id&&!r.reply_id));
  const container=form.querySelector<HTMLElement>('.moderation-buttons')!;container.replaceChildren(...[...actions,...(open.length?['dismiss']:[])].map(action=>{const b=document.createElement('button');b.type='button';b.dataset.chooseAction=action;b.textContent=action==='hide'?(isReply?'Hide this comment':'Hide entire discussion'):action==='dismiss'?'Dismiss report':action[0].toUpperCase()+action.slice(1)+' '+noun(form);return b;}));
  const reportsSelect=form.elements.namedItem('report_id') as HTMLSelectElement;reportsSelect.replaceChildren();const none=document.createElement('option');none.value='';none.textContent='No report';reportsSelect.append(none);for(const r of open){const o=document.createElement('option');o.value=r.id;o.textContent=r.reason;reportsSelect.append(o);}
  input(form,'expected').value=record.updated_at;input(form,'transition').value='';input(form,'key').value=crypto.randomUUID();form.querySelector<HTMLElement>('[data-action-fields]')!.hidden=true;form.closest('section')!.querySelector('.moderation-state strong')!.textContent=record.status;
 }
 root.addEventListener('click',event=>{
  const button=(event.target as Element).closest<HTMLButtonElement>('[data-choose-action],[data-cancel-action]');if(!button)return;
  const form=button.closest<HTMLFormElement>('[data-admin-moderation]')!;if(busy.has(form)||blocked.has(form))return;const panel=form.querySelector<HTMLElement>('[data-action-fields]')!;
  if(button.hasAttribute('data-cancel-action')){panel.hidden=true;input(form,'transition').value='';return;}
  const action=button.dataset.chooseAction!;input(form,'transition').value=action;panel.hidden=false;
  form.querySelector('[data-action-description]')!.textContent=action==='hide'?(noun(form)==='discussion'?'Hide the entire discussion, including all comments and nested replies, from creators. Nothing will be deleted.':'Hide only this comment. Its nested replies remain individually visible and manageable; nothing is deleted.'):action==='lock'?'Keep this discussion visible and close new contributions.':action==='restore'?`Restore this ${noun(form)} to its previous visible state.`:action==='unlock'?'Reopen contributions to this discussion.':'Dismiss the selected report without changing the content.';
  form.querySelector('[data-confirm-action]')!.textContent='Confirm '+(action==='hide'&&noun(form)==='discussion'?'hide entire discussion':action);
  for(const b of form.querySelectorAll<HTMLButtonElement>('[data-choose-action]'))b.setAttribute('aria-pressed',String(b===button));input(form,action==='dismiss'?'report_id':'reason').focus();
 });
 root.addEventListener('submit',async event=>{
  const form=event.target as HTMLFormElement;if(!form.matches('[data-admin-moderation]'))return;event.preventDefault();if(busy.has(form)||blocked.has(form)||!form.reportValidity())return;
  const status=form.querySelector<HTMLElement>('[data-admin-action-status]')!,action=input(form,'transition').value;
  if(!['hide','restore','lock','unlock','dismiss'].includes(action)){status.textContent='Choose an action first.';return;}
  if(action==='dismiss'&&!input(form,'report_id').value){status.textContent='Choose the report to dismiss.';return;}
  const payload=new FormData(form);busy.add(form);form.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);input(form,'reason').readOnly=true;let saved=false,verified=false;
  try{
   const response=await fetch('/api/studio/community-completion',{method:'POST',body:payload,credentials:'same-origin',redirect:'error'}),receipt=await response.json();
   if(!response.ok||!/^[-a-f0-9]{36}$/i.test(receipt.id)||typeof receipt.unchanged!=='boolean')throw Error('UNCONFIRMED');saved=true;
   const [read,audit]=await Promise.all([fetch('/api/studio/community-admin-local',{cache:'no-store',credentials:'same-origin',redirect:'error'}),fetch('/api/studio/community-completion?view=moderation',{cache:'no-store',credentials:'same-origin',redirect:'error'})]);
   if(!read.ok||!audit.ok)throw Error('READ_FAILED');const current=await read.json(),evidence=await audit.json(),post=current.posts?.find((p:any)=>p.id===payload.get('post_id'));
   if(!post||!evidence.audit?.some((a:any)=>a.id===receipt.id))throw Error('READ_FAILED');
   const card=form.closest<HTMLElement>('[data-post]')!;card.dataset.postStatus=post.status;card.querySelector('[data-discussion-state]')!.textContent=post.status;card.querySelector<HTMLElement>('[data-hidden-discussion]')!.hidden=post.status!=='hidden';
   for(const other of card.querySelectorAll<HTMLFormElement>('[data-admin-moderation]')){
    if(other!==form&&(busy.has(other)||blocked.has(other)))continue;
    const replyId=input(other,'reply_id').value,record=replyId?post.replies?.find((r:any)=>r.id===replyId):post;if(!record?.updated_at)throw Error('READ_FAILED');
    const item=other.closest<HTMLElement>('[data-admin-item]')!;item.dataset.itemStatus=record.status;item.dataset.openReports=String(record.open_report_count??0);item.dataset.scribes=String(record.scribe_count??0);item.dataset.mentions=String(record.mentions_leilia===true);item.querySelector('[data-item-state]')!.textContent=record.status;syncHiddenBody(item,record.status);
    const badge=item.querySelector<HTMLElement>('[data-report-badge]')!;badge.hidden=!record.open_report_count;badge.textContent='Reported ('+(record.open_report_count??0)+')';
    refreshControls(other,record,evidence.reports??[]);
   }
   const composer=card.querySelector<HTMLFormElement>('[data-reply]');if(composer){const off=post.status!=='published';composer.querySelector<HTMLButtonElement>('[type=submit]')!.disabled=off;composer.querySelector<HTMLTextAreaElement>('textarea')!.readOnly=off;}
   updateEvidence(evidence,current.posts);input(form,'reason').value='';blocked.delete(form);verified=true;status.textContent='Saved and audit verified. Current actions and attention counts are updated. No page refresh is needed.';filter();
  }catch{status.textContent=saved?'The action was saved, but verification could not finish. Refresh the page to check; do not submit it again.':'The result could not be confirmed. Refresh the page and check before another action. Nothing will be retried automatically.';}
  finally{busy.delete(form);input(form,'reason').readOnly=false;if(!verified)blocked.add(form);else form.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=false);}
 });
}
