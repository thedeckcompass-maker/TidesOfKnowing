const thread=document.querySelector<HTMLElement>('[data-admin-thread]');
if(thread){let writing=false,uncertain=false;thread.addEventListener('click',async e=>{
 const b=(e.target as Element).closest<HTMLButtonElement>('[data-thread-action]'),item=b?.closest<HTMLElement>('[data-thread-moderation]');if(!b||!item||writing||uncertain)return;
 const action=b.dataset.threadAction!,reason=prompt((action==='hide'?'Content and authorship are preserved. Hiding is reversible.\n':'')+'Reason for '+action+' (5–1,000 characters):');if(reason===null||reason.trim().length<5||reason.length>1000)return;
 const f=new FormData();Object.entries({action:'moderate',post_id:item.dataset.post!,reply_id:item.dataset.reply??'',expected:item.dataset.expected!,transition:action,reason,key:crypto.randomUUID()}).forEach(([k,v])=>f.set(k,v));writing=true;b.disabled=true;
 try{const r=await fetch('/api/studio/community-completion',{method:'POST',credentials:'same-origin',redirect:'error',body:f}),v=await r.json();if(!r.ok||!v.id||typeof v.unchanged!=='boolean')throw Error('unconfirmed');location.reload();}catch{uncertain=true;item.querySelector('[data-thread-moderation-status]')!.textContent='Result not confirmed. Refresh and check before another action.';}finally{writing=false;}
});}
