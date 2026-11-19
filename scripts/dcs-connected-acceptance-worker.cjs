'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async(c,ids)=>{
 const {Miniflare,convertV4MiniflareOptions,Log,LogLevel}=await import('miniflare');
 const root=path.resolve('.build-temp/dcs-production-worker-candidate-20261118-v6/server'),pages=path.resolve('.build-temp/dcs-pages-workspace-grant-20261118-v4/public'),origin='https://www.tidesofknowing.com';
 const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
 const modules=(dir,entry)=>walk(dir).filter(f=>/\.(mjs|js)$/.test(f)).sort((a,b)=>Number(path.basename(b)===entry)-Number(path.basename(a)===entry)).map(p=>({type:'ESModule',path:p,contents:fs.readFileSync(p,'utf8')}));
 const bindings={...c.serverBindings(),STUDIO_RUNTIME_ENABLED:'true',STUDIO_RUNTIME_CONFIG_JSON:JSON.stringify({exports:true,services:false,exchange:false,community:false,artists:false,artistPortfolio:false,artistConversations:false}),STUDIO_DEPLOYMENT_TARGET:'production',STUDIO_BILLING_LIVE_ENABLED:'false',STUDIO_BILLING_TEST_ENABLED:'false',STUDIO_BILLING_SCHEDULER_ENABLED:'false',STUDIO_FOUNDING_ENABLED:'false',STUDIO_VIDEO_ENABLED:'false'};
 let mfPages,mf,requests=0;const results=[],trace=[];
 const network=async req=>{c.ensure();assert.equal(new URL(req.url).origin,c.config.url,'Only temporary Supabase egress is allowed');requests++;const response=await fetch(req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:await req.arrayBuffer()}),redirect:'error',signal:AbortSignal.timeout(20000)});if(new URL(req.url).pathname==='/auth/v1/user')trace.push({kind:'auth-user',status:response.status});return response;};
 try{
  mfPages=new Miniflare(convertV4MiniflareOptions({routes:[origin+'/*'],modules:modules(pages+'/_worker.js','index.js'),modulesRoot:pages+'/_worker.js',compatibilityDate:'2026-04-01',compatibilityFlags:['nodejs_compat'],log:new Log(LogLevel.NONE),bindings,serviceBindings:{ASSETS:async req=>{let p=decodeURIComponent(new URL(req.url).pathname);if(p.endsWith('/'))p+='index.html';const file=path.resolve(pages,'.'+p);assert(file.startsWith(pages+path.sep));return fs.existsSync(file)?new Response(fs.readFileSync(file),{headers:{'content-type':file.endsWith('.html')?'text/html':'application/octet-stream'}}):new Response('missing',{status:404});}},outboundService:network}));await mfPages.ready;const pagesWorker=await mfPages.getWorker();
  mf=new Miniflare(convertV4MiniflareOptions({routes:[origin+'/*'],modules:modules(root,'dcs-scoped-entry.mjs'),modulesRoot:root,compatibilityDate:'2026-04-01',compatibilityFlags:['nodejs_compat'],log:new Log(LogLevel.NONE),bindings,outboundService:async req=>new URL(req.url).origin===origin?pagesWorker.fetch(req):network(req)}));await mf.ready;
  const cookieHeaders=(response)=>typeof response.headers.getSetCookie==='function'?response.headers.getSetCookie():[response.headers.get('set-cookie')].filter(Boolean);
  const jars={};
  async function app(u,route,options={}){
   c.ensure();const headers=new Headers(options.headers);if(u&&jars[u])headers.set('Cookie',Object.entries(jars[u]).map(([k,v])=>k+'='+v).join('; '));if(options.method&&options.method!=='GET')headers.set('Origin',origin);
   const response=await mf.dispatchFetch(origin+route,{...options,headers,redirect:'manual'});
   if(u){jars[u]??={};for(const line of cookieHeaders(response)){const cookie=line.split(';')[0],i=cookie.indexOf('=');if(i>0)jars[u][cookie.slice(0,i)]=cookie.slice(i+1);}}
   trace.push({kind:'app',user:u,path:new URL(route,origin).pathname,status:response.status,cookieNames:u?Object.keys(jars[u]||{}):[]});
   return response;
  }
  const registration=await app(null,'/auth/register/?redirectTo=%2Fstudio%2F');assert.equal(registration.status,200);const registrationHtml=await registration.text();assert.match(registrationHtml,/<form\b/);assert.match(registrationHtml,/name="email"/);results.push('Registration form from exact compiled pair');
  for(const u of ['explore','develop','admin']){
   let linkResponse;for(let attempt=0;attempt<3;attempt++){try{linkResponse=await c.api('/auth/v1/admin/generate_link',{type:'magiclink',email:c.users[u].email,options:{redirect_to:'http://localhost:18761/auth/callback/'}});break;}catch(e){if(e.name!=='TypeError'||attempt===2)throw e;}}
   const generated=c.ok(linkResponse,'Synthetic login token');const props=generated.properties??generated;assert(props.hashed_token);
   const callback=await app(u,'/auth/callback/?token_hash='+encodeURIComponent(props.hashed_token)+'&type=email&redirectTo=%2Fstudio%2F');assert([302,303].includes(callback.status),'Compiled Auth callback '+u+' HTTP '+callback.status);assert(Object.keys(jars[u]||{}).some(k=>k.includes('auth-token')),'Compiled callback issued session cookies');
   const dashboard=await app(u,'/studio/');assert.equal(dashboard.status,200,'Authenticated Studio '+u);const html=await dashboard.text();assert.doesNotMatch(html,/Sign in to continue/);results.push('Genuine compiled callback and Studio session: '+u);
  }
  const project=await app('develop','/studio/projects/'+ids.develop+'/?view=project');assert.equal(project.status,200,'Compiled owned project view HTTP '+project.status);assert.match(await project.text(),/Synthetic Develop/);
  const foreign=await app('explore','/studio/projects/'+ids.develop+'/?view=project');assert([403,404].includes(foreign.status),'Foreign compiled project denied');results.push('Compiled project ownership isolation');
  const appProject=ids.foreign,appCard='22000000-0000-4000-8000-000000000032';
  const formPost=(u,route,fields)=>app(u,route,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',accept:'application/json'},body:new URLSearchParams(fields).toString()});
  const created=await formPost('develop','/api/studio/projects',{request_id:appProject,name:'Synthetic compiled project',deck_type:'oracle',pathway:'personal',deck_size:'22',purpose:'Bounded connected acceptance'});assert.equal(created.status,200,'Compiled project create HTTP '+created.status);
  const newCard=await formPost('develop','/api/studio/projects/'+appProject+'/cards',{creation_id:appCard,title:'Synthetic compiled card',card_number:'1',family_id:''});assert.equal(newCard.status,200,'Compiled card create HTTP '+newCard.status);
  const beforeCard=c.ok(await c.api('/rest/v1/studio_cards?id=eq.'+appCard,undefined,{method:'GET',token:c.sessions.develop.access}),'Compiled saved card lookup')[0];
  const writing='Synthetic compiled saved writing '+beforeCard.version_number;
  const saved=await formPost('develop','/api/studio/cards/'+appCard,{project_id:appProject,expected_current_version:String(beforeCard.version_number),title:'Synthetic compiled card',card_number:'1',sort_order:'0',family_id:'',status:'draft',meaning:writing});assert.equal(saved.status,200,'Compiled save HTTP '+saved.status);
  const reopened=await app('develop','/studio/projects/'+appProject+'/cards/'+appCard+'/');const reopenLocation=reopened.headers.get('location');assert.equal(reopened.status,200,'Compiled reopen HTTP '+reopened.status+' destination '+(reopenLocation?new URL(reopenLocation,origin).pathname:'none'));assert((await reopened.text()).includes(writing));
  for(const action of ['delete','restore']){const r=await formPost('develop','/api/studio/cards/'+appCard+'/lifecycle',{project_id:appProject,action,confirm:'yes'});assert.equal(r.status,303);assert(!(r.headers.get('location')||'').includes('error='),'Compiled card lifecycle '+action);}
  for(const action of ['delete','restore']){const r=await formPost('develop','/api/studio/projects/'+appProject+'/lifecycle',{action,confirm:'yes'});assert.equal(r.status,303);assert(!(r.headers.get('location')||'').includes('error='),'Compiled project lifecycle '+action);}
  const retained=c.ok(await c.api('/rest/v1/studio_cards?id=eq.'+appCard,undefined,{method:'GET',token:c.sessions.develop.access}),'Retained compiled card')[0];assert.equal(retained.deleted_at,null);assert.equal(retained.content.meaning,writing);results.push('Compiled project/card creation, editing, reopen and deletion/restoration retain content');
  for(const format of ['json','md','zip']){
   const response=await app('develop','/api/studio/projects/'+ids.develop+'/export/'+format);const body=Buffer.from(await response.arrayBuffer());assert.equal(response.status,200,'Compiled '+format+' export failed with HTTP '+response.status);assert(body.length>20);if(format==='zip'){
    assert.equal(body.subarray(0,2).toString(),'PK');const files=[];let at=0;
    while(at+30<=body.length&&body.readUInt32LE(at)===0x04034b50){assert.equal(body.readUInt16LE(at+8),0);const size=body.readUInt32LE(at+18),nameLength=body.readUInt16LE(at+26),extra=body.readUInt16LE(at+28),name=body.subarray(at+30,at+30+nameLength).toString(),start=at+30+nameLength+extra;files.push({name,bytes:body.subarray(start,start+size)});at=start+size;}
    const photos=files.filter(f=>f.name.startsWith('media/journal/')&&f.name.endsWith('.jpg'));assert.equal(photos.length,1,'Complete ZIP includes attached private image');assert.equal(photos[0].bytes.readUInt16BE(0),0xffd8);assert(body.includes(Buffer.from('Synthetic Exchange')),'Complete ZIP includes Exchange content');results.push('Complete ZIP contains private JPEG bytes and Exchange history');
   }results.push('Compiled authenticated '+format+' export');
  }
  const publicPage=await app(null,'/repeating-card-meanings/ace-of-cups/');assert.equal(publicPage.status,200);const html=await publicPage.text();assert.match(html,/Leilia Spencer/);assert.match(html,/rel="canonical"/);results.push('Preserved Pages article through consolidated Worker');
  c.results.push({name:'Exact Worker v6 and Pages v4 connected runtime',pass:true,checks:results,isolatedSupabaseRequests:requests,emailTransport:'Auth Admin generates synthetic confirmation tokens; outbound mail is not exercised'});c.save();return {passed:true,checks:results};
 }finally{fs.writeFileSync(path.join(c.evidence,'worker-progress.json'),JSON.stringify({target:c.config.projectRef,checks:results,trace,isolatedSupabaseRequests:requests,at:new Date().toISOString()},null,2));if(mf)await mf.dispose();if(mfPages)await mfPages.dispose();}
};
