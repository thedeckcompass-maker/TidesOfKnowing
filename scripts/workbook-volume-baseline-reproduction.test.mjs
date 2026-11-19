import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {experimental_AstroContainer as Container} from 'astro/container';import puppeteer from 'puppeteer';
const packet='C:/Users/DELL 7410/Documents/ChatGPT/Tides of Knowing Website/DCS-WORKBOOK-VOLUME-CORRECTION-20261111',artifact='C:/Users/DELL 7410/Documents/ChatGPT/Tides of Knowing Website/DCS-CONNECTED-NAVIGATION-IMPLEMENTATION-20261110/release-candidate/compiled-candidate',chunks=artifact+'/server/chunks',checks=[],errors=[],screenshots=[];
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
 const page=await browser.newPage();await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(base+'/')?r.continue():r.respond({status:200,contentType:'text/css',body:''}));
 await page.goto(urlFor());await page.waitForSelector('[data-book-choice="manuscript"]');await page.click('[data-book-choice="manuscript"]');await page.waitForSelector('[data-book-choice="manuscript"][aria-current="page"]');
 assert.equal(new URL(page.url()).searchParams.get('book'),'manuscript');const link=await page.$eval('.studio-project-context a',a=>a.href);assert.equal(new URL(link).searchParams.get('book'),null);
 await Promise.all([page.waitForNavigation(),page.click('.studio-project-context a')]);const target=await page.$eval('.studio-project-actions a',a=>a.href);assert.equal(new URL(target).searchParams.get('book'),null);
 await page.goto(target);await page.waitForSelector('[data-book-choice="concept"][aria-current="page"]');
 checks.push('Preserved original compiled candidate reproduces Manuscript -> stale Change project -> chooser -> Concept; no production request or write');
}catch(e){errors.push(e.stack);process.exitCode=1;}finally{await browser?.close();await new Promise(r=>server.close(r));fs.writeFileSync(packet+'/BASELINE-DEFECT-REPRODUCTION.json',JSON.stringify({reproduced:!process.exitCode,checks,errors,productionRequests:0},null,2));console.log(JSON.stringify({reproduced:!process.exitCode,checks,errors}));}
