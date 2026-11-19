export {};

const forms=document.querySelectorAll<HTMLFormElement>(
  '[data-community-member-reply]'
);

for(const form of forms){
  const textarea=form.querySelector<HTMLTextAreaElement>(
    'textarea[name="body"]'
  )!;
  const status=form.querySelector<HTMLElement>(
    '[data-community-reply-status]'
  )!;
  const button=form.querySelector<HTMLButtonElement>(
    'button[type="submit"]'
  )!;

  let submitting=false;

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(submitting||!form.reportValidity())return;

    submitting=true;
    button.disabled=true;
    status.hidden=false;
    status.textContent='Saving your reply.';

    try{
      const response=await fetch(form.action,{
        method:'POST',
        body:new FormData(form),
        credentials:'same-origin',
        cache:'no-store',
        signal:AbortSignal.timeout(15000)
      });

      const result=await response.json().catch(()=>null);

      if(!response.ok||
         typeof result?.id!=='string'||
         !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(result.id)){
        throw Error(
          typeof result?.error==='string'
            ?result.error
            :'Your reply could not be confirmed.'
        );
      }

      status.textContent='Reply saved. Refreshing the conversation.';
      textarea.value='';
      window.location.reload();
    }catch(error){
      status.textContent=
        error instanceof Error
          ?error.message
          :'Your reply was not confirmed. Please retry.';
      // Preserve text and submission key for an idempotent retry.
      textarea.focus();
    }finally{
      submitting=false;
      button.disabled=false;
    }
  });
}

