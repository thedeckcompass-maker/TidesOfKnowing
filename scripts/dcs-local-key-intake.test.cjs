'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const createIntake=require('./lib/dcs-local-key-intake.cjs');
test('local intake form, session binding, origin checks and nonreflection',async()=>{
 const ref='kcahcrfdubpoajsfxziv';let handler,binding=null;
 const server=http.createServer(async(req,res)=>{if(!await handler(req,res)){res.writeHead(404);res.end('Not found');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 handler=createIntake({projectRef:ref,origin,deadline:Date.now()+60000,getBound:()=>!!binding,setBinding:key=>{binding=key;}});
 async function form(route='/intake'){const response=await fetch(origin+route);assert.equal(response.status,200);const html=await response.text();assert.match(html,/type="password"/);assert.match(html,/method="post" action="\/intake"/);assert(html.includes(ref));assert.match(response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);return {html,cookie:response.headers.get('set-cookie').split(';')[0],csrf:html.match(/name="csrf" value="([a-f0-9]+)"/)[1]};}
 async function submit(f,key,extra={}){return fetch(origin+'/intake',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',Origin:origin,Cookie:f.cookie,...extra},body:new URLSearchParams({csrf:f.csrf,key})});}
 const fake=project=>[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({ref:project,role:'service_role'})).toString('base64url'),'not-a-real-signature'].join('.');
 try{
  await form();await form('/intake/');await form('/intake?utm_source=chatgpt.com');
  const linked=await fetch(origin+'/intake',{headers:{Origin:'https://chatgpt.com'}});assert.equal(linked.status,200);assert.match(await linked.text(),/type="password"/);
  const opaqueNavigation=await fetch(origin+'/intake',{headers:{Origin:'null'}});assert.equal(opaqueNavigation.status,200);
  assert.equal((await fetch(origin+'/favicon.ico')).status,204);assert.equal((await fetch(origin+'/unknown')).status,404);
  const a=await form();assert.equal((await submit(a,fake(ref),{Origin:'https://unrelated.invalid'})).status,403);
  assert.equal((await submit(a,fake(ref),{Origin:''})).status,403);assert.equal((await submit(a,fake(ref),{Cookie:''})).status,403);
  assert.equal((await submit({...a,csrf:'0'.repeat(64)},fake(ref))).status,403);
  const wrong=fake('wrong-project'),bad=await submit(a,wrong);assert.equal(bad.status,400);assert(!(await bad.text()).includes(wrong));assert.equal(binding,null);
  const malformed=await submit(await form(),'not-a-key-private-marker');assert.equal(malformed.status,400);assert(!(await malformed.text()).includes('not-a-key-private-marker'));
  const b=await form(),sent=fake(ref),accepted=await submit(b,' \r\n'+sent+'\n ');assert.equal(accepted.status,200);assert.equal(binding,sent);assert(!(await accepted.text()).includes(sent));assert.equal((await submit(b,sent)).status,403);
  const loaded=await fetch(origin+'/intake');assert.match(await loaded.text(),/Temporary binding loaded/);
 }finally{binding=null;await new Promise(resolve=>server.close(resolve));}
});
