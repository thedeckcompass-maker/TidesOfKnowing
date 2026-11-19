import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {experimental_AstroContainer as Container} from 'astro/container';import puppeteer from 'puppeteer';
const packet='C:/Users/DELL 7410/Documents/ChatGPT/Tides of Knowing Website/DCS-WORKBOOK-VOLUME-CORRECTION-20261111',artifact=packet+'/compiled-candidate',chunks=artifact+'/server/chunks',checks=[],errors=[],screenshots=[];
const owner='22222222-2222-4222-8222-222222222222',project='11111111-1111-4111-8111-111111111111',card='33333333-3333-4333-8333-333333333333';
const p={id:project,owner_id:owner,name:'TEST Navigation Deck',deck_type:'oracle',pathway:'personal',status:'draft',updated_at:'2026-11-11T01:00:00Z',created_at:'2026-11-11T00:00:00Z',settings:{},purpose:'TEST purpose'},c={id:card,project_id:project,title:'TEST Card',content:{},status:'draft',sort_order:0,version_number:1};
let signedIn=true,projects=[p],entries=[],saveMode='normal',captureRequests=0,linkRequests=0;
function db(){return {from(table){let filters=[],excluded=[];const result=(single=false)=>{let rows=table==='studio_projects'?projects:table==='studio_cards'?[c]:table==='studio_creator_inspiration'?[{owner_id:owner,inbox:{version:1,entries}}]:table==='studio_access'?[{user_id:owner,starts_at:'2000-01-01T00:00:00Z',expires_at:'2099-01-01T00:00:00Z'}]:[];rows=rows.filter(r=>filters.every(([k,v])=>r[k]===v)&&excluded.every(([k,v])=>r[k]!==v));return {data:single?rows[0]??null:rows,error:null};};const q={select(){return q},eq(k,v){filters.push([k,v]);return q},neq(k,v){excluded.push([k,v]);return q},order(){return q},limit(){return q},range(){return q},is(){return q},maybeSingle:async()=>result(true),single:async()=>result(true),then(resolve,reject){return Promise.resolve(result()).then(resolve,reject)}};return q;}};}
const memberLocals=()=>({user:{id:owner,email:'synthetic@example.invalid'},profile:{id:owner,status:'active',role:'member',username:'TESTCreator'},supabase:db()});
const entry=fs.readFileSync(artifact+'/server/entry.mjs','utf8'),manifestLine=entry.split('\n').find(l=>l.startsWith('var _manifest = deserializeManifest('));
const manifest=JSON.parse(manifestLine.slice(manifestLine.indexOf('(')+1,manifestLine.lastIndexOf(');')));
const container=await Container.create({manifest:{inlinedScripts:new Map(manifest.inlinedScripts)},resolve:id=>'/'+manifest.entryModules[id]});
async function component(prefix){const file=fs.readdirSync(chunks).find(n=>n.startsWith(prefix+'_')&&n.endsWith('.mjs'));if(!file)throw Error('COMPILED_COMPONENT_NOT_FOUND '+prefix);const m=await import(pathToFileURL(chunks+'/'+file));return m.page().default;}
const desk=await component('creators-desk');
async function routeComponent(route){const file=fs.readdirSync(chunks).filter(n=>n.endsWith('.mjs')).find(n=>{const s=fs.readFileSync(chunks+'/'+n,'utf8');return s.includes('/src/pages/'+route+'.astro')&&s.includes('var page =');});if(!file)throw Error('ROUTE_COMPONENT_NOT_FOUND '+route);return (await import(pathToFileURL(chunks+'/'+file))).page().default;}
const routes=new Map([['/studio/',await routeComponent('studio/index')],[`/studio/projects/${project}/my-deck/`,await routeComponent('studio/projects/[id]/my-deck/index')],[`/studio/projects/${project}/project-book/`,await routeComponent('studio/projects/[id]/project-book/index')],[`/studio/projects/${project}/exports/`,await routeComponent('studio/projects/[id]/exports/index')],['/studio/community/',await routeComponent('studio/community')]]);
async function renderDesk(url){let html=await container.renderToString(desk,{request:new Request(url),locals:locals()});const css=fs.readdirSync(artifact+'/client/_astro').filter(n=>/^(?:BaseLayout|creators-desk)\..*\.css$/.test(n));html=html.replace('</head>',css.map(n=>'<link rel="stylesheet" href="/_astro/'+n+'">').join('')+'</head>');fs.writeFileSync(packet+'/COMPILED-DESK-TEST.html',html);return html;}

const locals=()=>signedIn?memberLocals():{user:null,profile:null,supabase:db()};
const other='77777777-7777-4777-8777-777777777777',foreign='88888888-8888-4888-8888-888888888888';
const foreignOwner='99999999-9999-4999-8999-999999999999';
const ownOther={...p,id:other,name:'TEST Second owned project'};
const foreignProject={...p,id:foreign,owner_id:foreignOwner,name:'TEST Foreign project'};
const workbook=await routeComponent('studio/projects/[id]/project-book/index');
const newCard=await routeComponent('studio/projects/[id]/cards/new');
const {build}=await import('esbuild');const {createRequire}=await import('node:module');
async function load(file){const code=(await build({entryPoints:[file],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',define:{'import.meta.env':'{}'}})).outputFiles[0].text;const m={exports:{}};new Function('module','exports','require',code)(m,m.exports,createRequire(import.meta.url));return m.exports;}
const view=(await load(packet+'/build-root/src/lib/studio/projectBookView.ts')).projectBookView;
const assets=new Map();for(const n of fs.readdirSync(artifact+'/client/_astro'))assets.set(n,fs.readFileSync(artifact+'/client/_astro/'+n));
let base='',writes=0,blockedFontRequests=0;const requests=[],external=[];
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,base);requests.push({method:req.method,path:url.pathname});
 if(req.method!=='GET'){writes++;res.writeHead(405);return res.end('NO_WRITES_IN_BROWSER_HARNESS');}
 if(url.pathname.startsWith('/_astro/')||url.pathname.startsWith('/_dcs-assets/_astro/')){const n=url.pathname.split('/').pop();if(!assets.has(n)){res.writeHead(404);return res.end();}res.setHeader('content-type',n.endsWith('.css')?'text/css':'text/javascript');return res.end(assets.get(n));}
 const api=url.pathname.match(/^\/api\/studio\/projects\/([^/]+)\/project-book$/);
 if(api){const row=projects.find(x=>x.id===api[1]&&x.owner_id===owner);if(!signedIn||!row){res.writeHead(403);return res.end('{}');}res.setHeader('content-type','application/json');return res.end(JSON.stringify(view(row,[],[])));}
 const match=url.pathname.match(/^\/studio\/projects\/([^/]+)\/(project-book|cards\/new)\/$/);
 const component=match?(match[2]==='project-book'?workbook:newCard):url.pathname==='/studio/'?routes.get('/studio/'):null;
 if(!component){res.writeHead(404);return res.end('SYNTHETIC_NOT_FOUND');}
 const response=await container.renderToResponse(component,{request:new Request(url),locals:locals(),params:{id:match?.[1]}});
 res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(await response.text());
 }catch(e){errors.push(e.stack);res.writeHead(500);res.end('SYNTHETIC_HARNESS_ERROR');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;
let browser;const pass=name=>checks.push(name),urlFor=(id=project,book)=>base+`/studio/projects/${id}/project-book/`+(book?'?book='+encodeURIComponent(book):'');
try{
 browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-background-networking']});
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);page.on('request',r=>{if(r.url().startsWith(base+'/'))r.continue();else if(new URL(r.url()).origin==='https://fonts.googleapis.com'){blockedFontRequests++;r.respond({status:200,contentType:'text/css',body:''});}else{external.push(new URL(r.url()).origin);r.abort();}});
 await page.setViewport({width:1440,height:1000});
 const selected=async key=>{await page.waitForSelector(`[data-book-choice="${key}"][aria-current="page"]`);assert.equal(await page.$eval('[data-book-panel]:not([hidden])',x=>x.dataset.bookPanel),key);};
 const changeVolume=async key=>{await page.click(`[data-book-choice="${key}"]`);await selected(key);assert.equal(new URL(await page.$eval('[data-workbook-change-project]',a=>a.href)).searchParams.get('book'),key);};
 const choose=async(id,key)=>{
  await Promise.all([page.waitForNavigation(),page.click('[data-workbook-change-project]')]);
  const chooser=new URL(page.url());assert.equal(chooser.pathname,'/studio/');assert.equal(chooser.searchParams.get('task'),'workbook');assert.equal(chooser.searchParams.get('choose'),'1');assert.equal(chooser.searchParams.get('book'),key);
  assert.equal(await page.$eval('[name=task]',x=>x.value),'workbook');assert.equal(await page.$eval('[name=book]',x=>x.value),key);
  const href=`/studio/projects/${id}/project-book/?book=${key}`;await Promise.all([page.waitForNavigation(),page.click(`.studio-project-actions a[href="${href}"]`)]);
  assert.equal(new URL(page.url()).pathname,`/studio/projects/${id}/project-book/`);await selected(key);
 };
 for(const count of [1,2])for(const key of ['manuscript','planning','concept']){
  projects=count===1?[p]:[p,ownOther];await page.goto(urlFor());await selected('concept');
  // Explicitly choose concept after a different volume as well as default entry.
  if(key==='concept')await changeVolume('manuscript');await changeVolume(key);
  await choose(count===1?project:other,key);await page.reload();await selected(key);
  assert.equal(new URL(await page.$eval('[data-workbook-change-project]',a=>a.href)).searchParams.get('book'),key);
  pass(`${key}: in-place switch -> explicit chooser (${count} owned projects) -> ${count===1?'same':'different'} project -> reload retains volume and correct project`);
 }
 projects=[p,ownOther];await page.goto(urlFor());await selected('concept');await changeVolume('manuscript');await changeVolume('planning');
 await page.goBack();await selected('manuscript');assert.equal(new URL(await page.$eval('[data-workbook-change-project]',a=>a.href)).searchParams.get('book'),'manuscript');
 await page.goBack();await selected('concept');assert.equal(new URL(await page.$eval('[data-workbook-change-project]',a=>a.href)).searchParams.get('book'),'concept');
 await page.goForward();await selected('manuscript');await choose(other,'manuscript');pass('Browser Back/Forward synchronises reader and continuation; real chooser round trip retains restored history volume');
 for(const key of ['concept','manuscript','planning']){
  projects=[p];await page.goto(base+'/studio/?orientation=skip&task=workbook&book='+key);assert.equal(new URL(page.url()).pathname,`/studio/projects/${project}/project-book/`);await selected(key);
  projects=[p,ownOther];await page.goto(base+'/studio/?orientation=skip&task=workbook&book='+key);assert.equal(new URL(page.url()).pathname,'/studio/');
  const href=`/studio/projects/${other}/project-book/?book=${key}`;await Promise.all([page.waitForNavigation(),page.click(`.studio-project-actions a[href="${href}"]`)]);await selected(key);
  pass(`${key}: direct task entry resolves one owned project or normal multi-project selection without volume/project confusion`);
 }
 for(const bad of ['https://evil.invalid/','__proto__','manuscript&task=addcard','../planning','MANUSCRIPT']){
  await page.goto(urlFor(project,bad));await selected('concept');const link=new URL(await page.$eval('[data-workbook-change-project]',a=>a.href));assert.equal(link.origin,base);assert.equal(link.searchParams.get('book'),'concept');assert.equal(link.searchParams.get('task'),'workbook');
 }
 pass('Invalid volume values fall back to Concept; continuation is fixed same-origin Workbook task, never a caller URL');
 projects=[p,foreignProject];await page.goto(base+'/studio/?orientation=skip&task=workbook&choose=1&book=planning');assert.equal(await page.$$eval('.studio-project-actions a',a=>a.some(x=>x.href.includes('88888888-8888'))),false);
 assert.equal((await fetch(urlFor(foreign,'planning'),{redirect:'manual'})).status,404);pass('Chooser excludes foreign project; actual compiled Workbook rejects direct foreign-project access with 404');
 signedIn=false;const denied=await fetch(urlFor(project,'manuscript'),{redirect:'manual'});assert.equal(denied.status,303);assert.equal(denied.headers.get('location'),'/auth/register/');assert(!(await denied.text()).includes(p.name));signedIn=true;
 pass('Actual compiled page guard rejects anonymous Workbook read (303); unchanged middleware sign-in normalisation is retained, not simulated as hosted evidence');
 projects=[p];await page.goto(base+'/studio/?orientation=skip&task=addcard');assert.equal(new URL(page.url()).pathname,`/studio/projects/${project}/cards/new/`);assert.equal(await page.$$('[data-workbook-change-project]').then(a=>a.length),0);
 const addChange=new URL(await page.$eval('.studio-project-context a',a=>a.href));assert.equal(addChange.searchParams.get('task'),'addcard');assert.equal(addChange.searchParams.get('book'),null);
 projects=[p,ownOther];await page.goto(base+'/studio/?orientation=skip&task=addcard&choose=1&book=planning');assert.equal(await page.$$eval('.studio-project-actions a',a=>a.filter(x=>x.href.endsWith('/cards/new/')).length),2);pass('Quick add direct resolution, Change project task and multi-project card links remain unaffected by Workbook volume');
 await page.goto(urlFor(project,'planning'));await selected('planning');await page.evaluate(()=>document.dispatchEvent(new CustomEvent('studio-book-message',{detail:{type:'draft',draft:{tab:'synthetic',key:'project',sequence:1,dirty:true,kind:'project',value:{name:'TEST UNSAVED NAME',purpose:'TEST unsaved purpose'}}}})));
 await selected('planning');assert.equal(new URL(await page.$eval('[data-workbook-change-project]',a=>a.href)).searchParams.get('book'),'planning');pass('Draft-driven reader render retains volume and marked continuation without a save');
 assert.equal(writes,0);assert.equal(external.length,0);assert.equal(errors.length,0,errors.join('\n'));pass('No JavaScript errors, unexpected external requests or browser record-write attempts; shared font CSS stubbed locally before any outbound traffic');
}catch(e){errors.push(e.stack);process.exitCode=1;}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(packet+'/BROWSER-RESULTS.json',JSON.stringify({passed:!process.exitCode,checks,errors,browserWriteAttempts:writes,unexpectedExternalRequests:external,blockedFontRequests,productionRequests:0,scope:'Compiled successor routes, shell and actual reader JS; synthetic database ports on loopback only. No hosted acceptance claim.'},null,2));console.log(JSON.stringify({passed:!process.exitCode,checks:checks.length,errors},null,2));}
