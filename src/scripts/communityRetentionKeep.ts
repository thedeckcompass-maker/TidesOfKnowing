const page=document.querySelector('#dcs-community-admin');
if(page){let busy=false,uncertain=false;page.addEventListener('click',async e=>{
 const button=(e.target as Element).closest<HTMLButtonElement>('[data-retention-keep]');if(!button)return;e.preventDefault();if(busy||uncertain||button.disabled)return;
 const keep=button.dataset.kept!=='true';if(!confirm(keep?'Keep this whole discussion from automatic cleanup until you release it? Use this for a legal hold, dispute or anything you need to preserve.':'Allow scheduled cleanup again? Nothing is deleted immediately, but expired content may be erased in the next daily run.'))return;
 busy=true;button.disabled=true;const status=page.querySelector('[data-inbox-status]');
 try{const r=await fetch('/api/studio/community-retention',{method:'POST',credentials:'same-origin',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({post:button.dataset.post,keep,expected:button.dataset.event||null})}),v=await r.json();if(!r.ok||v.saved!==true||v.kept!==keep)throw Error('UNCONFIRMED');location.reload();}
 catch{uncertain=true;if(status)status.textContent='Protection change not confirmed. Refresh and check before trying again. Nothing is retried automatically.';}
 finally{busy=false;}
});}
