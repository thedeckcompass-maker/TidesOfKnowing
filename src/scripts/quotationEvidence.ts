for(const root of document.querySelectorAll<HTMLElement>('[data-quotation-record]')){
 for(const form of root.querySelectorAll<HTMLFormElement>('[data-quotation-import]'))form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector<HTMLButtonElement>('button')!,result=form.querySelector<HTMLElement>('[data-result]')!,file=(form.elements.namedItem('original') as HTMLInputElement).files?.[0];
  if(!file||!file.name.toLowerCase().endsWith('.eml')){result.textContent='Choose an original .eml file.';return;}
  if(file.size<1||file.size>20_000_000){result.textContent='The original must be between 1 and 20,000,000 bytes. Nothing was uploaded or truncated.';return;}
  button.disabled=true;result.textContent='Retaining and verifying the original. Keep the selected file until confirmed.';
  try{const query=new URLSearchParams({versionId:form.dataset.version!,versionHash:form.dataset.hash!,revision:root.dataset.revision!,direction:(form.elements.namedItem('direction') as HTMLSelectElement).value});const response=await fetch('/api/studio/quotation-evidence/'+encodeURIComponent(root.dataset.enquiry!)+'?'+query,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'message/rfc822','X-Retry-Key':form.dataset.key!,'X-Original-Filename':file.name},body:file});const data=await response.json();if(!response.ok)throw Error(data.error||'Original capture was not confirmed.');result.textContent='Original verified. No acceptance, payment or allocation was created.';location.reload();}
  catch(error){result.textContent=(error as Error).message+' Your selected file is retained. Reload the record to review pending evidence before retrying.';button.disabled=false;}
 });
}
