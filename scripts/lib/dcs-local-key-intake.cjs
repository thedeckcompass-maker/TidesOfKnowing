'use strict';
const crypto=require('node:crypto');
const inspectKey=require('./dcs-intake-key-diagnostics.cjs');

module.exports=function createIntake({projectRef,origin,deadline,getBound,setBinding,reportDiagnostics=()=>{}}){
 const formSessions=new Map(),sessionCookie='dcs_local_intake';
 const equal=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);};
 const headers={'cache-control':'no-store, max-age=0','pragma':'no-cache','referrer-policy':'same-origin','x-content-type-options':'nosniff','x-frame-options':'DENY','content-security-policy':"default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; style-src 'unsafe-inline'"};
 const reply=(res,status,text,extra={})=>{res.writeHead(status,{...headers,'content-type':'text/html; charset=utf-8',...extra});res.end(text);};
 const message=(title,text)=>'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>'+title+'</title><main><h1>'+title+'</h1><p>Temporary project: <strong>'+projectRef+'</strong></p><p>'+text+'</p></main></html>';
 return async function handle(req,res){
  if(req.headers.host!==new URL(origin).host){reply(res,403,message('Request refused','Use the exact loopback URL.'));return true;}
  // Opening the empty form from another app is a safe navigation. Only mutation
  // requests require the local Origin; POST also requires its session and CSRF.
  if(!['GET','HEAD'].includes(req.method)&&req.headers.origin&&req.headers.origin!==origin){reply(res,403,message('Request refused','Cross-origin submissions are not accepted. Open the address directly in a normal Chrome tab.'));return true;}
  let url;try{url=new URL(req.url,origin);}catch{reply(res,400,message('Invalid request','Open the intake URL again.'));return true;}
  if(url.origin!==origin){reply(res,403,message('Request refused','Use the exact loopback URL.'));return true;}
  req.localPath=url.pathname.replace(/\/$/,'')||'/';
  if([...url.searchParams.keys()].some(k=>/key|secret|password|token/i.test(k))){reply(res,400,message('Request refused','Credentials must be submitted through the form only.'));return true;}
  if(req.localPath==='/favicon.ico'){res.writeHead(204,headers);res.end();return true;}
  if(req.localPath!=='/intake')return false;
  if(Date.now()>=deadline){reply(res,410,message('Acceptance window expired','Do not enter a key.'));return true;}
  for(const [id,s] of formSessions)if(s.expires<=Date.now())formSessions.delete(id);
  if(req.method==='GET'||req.method==='HEAD'){
   if(getBound()){reply(res,200,message('Temporary binding loaded','The key is held in local process memory only.'));return true;}
   const sid=crypto.randomBytes(32).toString('hex'),csrf=crypto.randomBytes(32).toString('hex');
   while(formSessions.size>=16)formSessions.delete(formSessions.keys().next().value);
   formSessions.set(sid,{csrf,expires:Math.min(Date.now()+600000,deadline)});
   const html=message('Isolated DCS acceptance binding','Enter this temporary project’s legacy service-role API key, not your Supabase login or database password. It stays in process memory and is never logged, saved or returned.')
    .replace('</main>','<form method="post" action="/intake" autocomplete="off"><input type="hidden" name="csrf" value="'+csrf+'"><p><label for="temporary-key">Temporary service-role key</label><br><input id="temporary-key" type="password" name="key" autocomplete="off" autocapitalize="none" spellcheck="false" required></p><button type="submit">Load temporary binding</button></form></main>');
   reply(res,200,req.method==='HEAD'?'':html,{'set-cookie':sessionCookie+'='+sid+'; Path=/intake; HttpOnly; SameSite=Strict; Max-Age=600'});return true;
  }
  if(req.method!=='POST'){reply(res,405,message('Method not allowed','Open the intake URL with GET.'),{Allow:'GET, HEAD, POST'});return true;}
  if(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site'){reply(res,403,message('Request refused','Submit the form from this local page.'));return true;}
  if((req.headers['content-type']||'').split(';')[0].trim()!=='application/x-www-form-urlencoded'){reply(res,415,message('Request refused','Submit the local HTML form.'));return true;}
  const sid=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(sessionCookie+'='))?.slice(sessionCookie.length+1);
  const session=sid&&formSessions.get(sid);
  if(!session){reply(res,403,message('Session expired','Reload the local form before entering the key.'));return true;}
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>8192){reply(res,413,message('Request refused','The form submission is too large.'));return true;}}
  const form=new URLSearchParams(body);
  if(!equal(form.get('csrf'),session.csrf)){reply(res,403,message('Request refused','Reload the local form before entering the key.'));return true;}
  formSessions.delete(sid);
  if(getBound()){reply(res,409,message('Binding already loaded','The existing in-memory binding was preserved.'));return true;}
  let key=form.get('key');
  const diagnostic=form.getAll('key').length===1?inspectKey(key,projectRef):{reason:'EXPECTED_ONE_KEY_FIELD'};
  reportDiagnostics(diagnostic);
  if(diagnostic.reason!=='ACCEPTED_LEGACY_SERVICE_ROLE_FORMAT'){key=null;reply(res,400,message('Key not accepted','Diagnostic: <strong>'+diagnostic.reason+'</strong>. No credential value is shown or retained. Reload the form before retrying.'));return true;}
  key=key.trim();
  setBinding(key);key=null;reply(res,200,message('Temporary binding loaded','The key is held only in local process memory. You can return to Codex.'),{'set-cookie':sessionCookie+'=; Path=/intake; HttpOnly; SameSite=Strict; Max-Age=0'});return true;
 };
};
