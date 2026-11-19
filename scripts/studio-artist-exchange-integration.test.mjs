import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {transform} from '@astrojs/compiler-rs';
import puppeteer from 'puppeteer';

const source=`export * from './src/lib/studio/artistDirectory.ts';export * from './src/lib/studio/artistRegistrationProvider.ts';export * from './src/lib/studio/runtimeComposition.ts';export * from './src/lib/studio/runtimeEnvironment.ts';export * from './src/lib/studio/artistPortfolioProvider.ts';export * from './src/lib/studio/visualExchange.ts';export * from './src/lib/studio/visualExchangeArchive.ts';export * from './src/lib/studio/exchangeWriter.ts';export * from './src/lib/studio/access.ts';export * from './src/lib/studio/limitedForm.ts';export * from './src/lib/studio/validation.ts';export * from './src/lib/studio/artistPresentation.ts';export * from './src/pages/api/studio/artists/conversations.ts';`;
const bundle=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',define:{'import.meta.env':'{}'},write:false});
const module={exports:{}};new Function('module','exports','require',bundle.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));
const lib=module.exports,owner='11111111-1111-4111-8111-111111111111',project='22222222-2222-4222-8222-222222222222',artist='33333333-3333-4333-8333-333333333333',requestId='44444444-4444-4444-8444-444444444444';
function db(rows=[{id:project,name:'Synthetic deck'}]){return {from(table){const filters={};return {select(){return this},eq(k,v){filters[k]=v;return this},then(resolve){assert.equal(filters.owner_id,owner);resolve({data:rows,error:null})},async maybeSingle(){assert.equal(filters.owner_id,owner);return {data:rows.find(r=>r.id===filters.id)??null,error:null}}}}};}
function context(store){return {user:{id:owner,email:'synthetic@example.invalid'},profile:{id:owner,status:'active',role:'member'},supabase:db(),studioArtistLocal:true,studioArtistStore:store};}
function store(extra={}){return {canCreator:async()=>true,conversations:async()=>({shortlists:[],introductions:[]}),shortlist:async()=>({saved:true}),requestIntroduction:async()=>({id:requestId,status:'requested'}),respondIntroduction:async()=>({id:requestId,status:'accepted'}),...extra};}
function req(values){const f=new FormData();for(const [k,v]of Object.entries(values))f.set(k,v);return new Request('https://synthetic.invalid/api/studio/artists/conversations',{method:'POST',headers:{Origin:'https://synthetic.invalid'},body:f});}
const introduction={action:'request',project_id:project,artist_profile_id:artist,brief:'Synthetic creative brief with more than fifty characters for an isolated test.',expected_project_name:'Synthetic deck',expected_artist_name:'Synthetic artist',request_id:requestId,preview_confirmed:'on',contact_share_confirmed:'on',direct_contract_confirmed:'on'};
async function frontmatter(file,locals,returns,props={},search=''){
 const body=fs.readFileSync(file,'utf8').split('---')[1]+'\nreturn '+returns+';';
 const code=ts.transpileModule(body,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const astro={locals,props,params:{id:project},url:new URL('https://synthetic.invalid/'+search),redirect:(url,status)=>new Response(null,{status,headers:{Location:url}})};
 const symbol={symbolSources:async()=>[],directionState:()=>({}),VISUAL_DIRECTION_FIELDS:[]};
 return vm.runInNewContext('(async()=>{'+code+'})()',{exports:{},Response,URL,Astro:astro,require:n=>n.endsWith('/symbolJournal')?symbol:n.endsWith('/visualTiming')?{}:n.endsWith('/journalPhotoLifecycle')?{journalPhotoBucket:()=>''}:lib});
}

test('conversation reads and writes await their actual async provider results',async()=>{
 const locals=context(store({conversations:async()=>({shortlists:[{note:'Private synthetic note'}],introductions:[]})}));
 assert.equal((await (await lib.GET({locals})).json()).shortlists[0].note,'Private synthetic note');
 assert.equal((await (await lib.POST({locals,request:req({action:'shortlist',project_id:project,artist_profile_id:artist})})).json()).saved,true);
 const r=await lib.POST({locals,request:req({...introduction,action:'accepted',id:requestId,accept_contact_consent:'on'})});
 assert.equal((await r.json()).introduction.status,'accepted');
});
test('identity mismatch, Explore access and foreign projects cannot write conversations',async()=>{
 let writes=0;const s=store({shortlist:async()=>{writes++;return {saved:true}}});
 let locals=context(s);locals.profile.id='foreign';assert.equal((await lib.GET({locals})).status,401);
 assert.equal((await lib.POST({locals,request:req(introduction)})).status,401);
 locals=context({...s,canCreator:async()=>false});assert.equal((await lib.POST({locals,request:req(introduction)})).status,403);
 locals=context(s);locals.supabase=db([]);assert.equal((await lib.POST({locals,request:req(introduction)})).status,409);assert.equal(writes,0);
});
test('explicit exact-brief/contact consent and retry identity are required before submission',async()=>{
 let submitted=0;const locals=context(store({requestIntroduction:async(_who,data)=>{submitted++;assert.match(data.brief,/Selected excerpt I chose:\nOnly these synthetic words/);return {id:requestId}}}));
 for(const missing of ['preview_confirmed','contact_share_confirmed','direct_contract_confirmed']){const input={...introduction};delete input[missing];assert.ok((await lib.POST({locals,request:req(input)})).status>=400);}
 assert.equal((await lib.POST({locals,request:req({...introduction,request_id:'-'.repeat(36)})})).status,400);
 assert.equal(submitted,0);
 assert.equal((await lib.POST({locals,request:req({...introduction,selected_excerpt:'Only these synthetic words'})})).status,200);assert.equal(submitted,1);
});
test('acceptance without artist consent and cross-origin requests never reach the provider',async()=>{
 let responses=0;const locals=context(store({respondIntroduction:async()=>{responses++}}));
 assert.equal((await lib.POST({locals,request:req({action:'accepted',id:requestId})})).status,400);
 const request=req(introduction);request.headers.set('Origin','https://foreign.invalid');assert.equal((await lib.POST({locals,request})).status,403);assert.equal(responses,0);
});
test('failed providers cannot masquerade as successful empty records or reveal raw failures',async()=>{
 const locals=context(store({conversations:async()=>{throw Error('private-provider-detail')},shortlist:async()=>{throw Error('private-provider-detail')}}));
 const read=await lib.GET({locals});assert.equal(read.status,503);assert.doesNotMatch(await read.text(),/private-provider-detail/);
 const write=await lib.POST({locals,request:req({action:'shortlist',project_id:project,artist_profile_id:artist})});assert.equal(write.status,409);assert.doesNotMatch(await write.text(),/private-provider-detail/);
 const unavailable=context(store());unavailable.studioArtistLocal=false;unavailable.studioArtistPortfolioEnabled=true;unavailable.studioArtistPortfolioProvider=store();assert.equal((await lib.GET({locals:unavailable})).status,503);
});
test('creator and artist Exchange pages select the actual Exchange provider, independently of registration',async()=>{
 const writer={canExchange:async()=>true,registeredArtist:async()=>true};const locals=context(null);Object.assign(locals,{studioArtistLocal:false,studioExchangeHostedEnabled:true,studioExchangeProvider:writer});
 const p=await frontmatter('src/pages/studio/projects/[id]/visual-exchange/index.astro',locals,'({store,source})');assert.equal(p.store,writer);assert.equal(p.source.project.id,project);
 const board=await frontmatter('src/pages/artists/visual-design-exchange/index.astro',locals,'({store})');assert.equal(board.store,writer);
 locals.studioExchangeHostedEnabled=false;assert.equal((await frontmatter('src/pages/artists/visual-design-exchange/index.astro',locals,'({store})')).status,503);
 locals.studioExchangeHostedEnabled=true;writer.registeredArtist=async()=>false;assert.equal((await frontmatter('src/pages/artists/visual-design-exchange/index.astro',locals,'({store})')).status,403);
});
test('artist directory excludes Explore and validates owner-scoped project context',async()=>{
 const locals=context(null);let reads=0;Object.assign(locals,{studioArtistLocal:false,studioArtistPortfolioEnabled:true,studioArtistPortfolioProvider:{canCreator:async()=>false,directory:async()=>{reads++;return []}}});
 assert.equal((await frontmatter('src/pages/studio/artists/index.astro',locals,'({directoryHref})')).status,403);assert.equal(reads,0);
 locals.studioArtistPortfolioProvider.canCreator=async()=>true;
 const r=await frontmatter('src/pages/studio/artists/index.astro',locals,'({directoryHref,ownedProject})',{},'?project='+project);assert.equal(r.ownedProject.id,project);assert.match(r.directoryHref,/project=/);
 locals.supabase=db([]);assert.equal((await frontmatter('src/pages/studio/artists/index.astro',locals,'({directoryHref})',{},'?project='+project)).status,404);
});
test('Visual Direction awaits hosted entitlement rather than treating a Promise as permission',async()=>{
 const locals=context(null);locals.supabase={from:()=>({select(){return this},eq:async()=>({data:[]})})};Object.assign(locals,{studioArtistLocal:false,studioArtistPortfolioEnabled:true,studioArtistPortfolioProvider:{canCreator:async()=>false}});
 const file='src/components/studio/SymbolVisualDesk.astro',props={project:{id:project,owner_id:owner,settings:{}},mode:'direction'};
 assert.equal((await frontmatter(file,locals,'({canDiscoverArtists})',props)).canDiscoverArtists,false);
 locals.studioArtistPortfolioProvider.canCreator=async()=>true;assert.equal((await frontmatter(file,locals,'({canDiscoverArtists})',props)).canDiscoverArtists,true);
 const conversationLocals=context(store());conversationLocals.supabase={from:()=>({select(){return this},eq:async()=>({data:null,error:{code:'SYNTHETIC'}})})};
 const conversations=await frontmatter('src/components/studio/ArtistConversations.astro',conversationLocals,'({canSubmit,projectListUnavailable})',{artist:{id:artist}});assert.equal(conversations.canSubmit,false);assert.equal(conversations.projectListUnavailable,true);
});
test('conversation runtime is separately opt-in and composes only with verified portfolio/actor configuration',async()=>{
 const env={STUDIO_RUNTIME_ENABLED:'true',STUDIO_RUNTIME_CONFIG_JSON:JSON.stringify({artistConversations:true}),DCS_EXCHANGE_DB:{connectionString:'synthetic-only'}};
 assert.throws(()=>lib.studioRuntimeConfiguration(env,'https://www.tidesofknowing.com'),/portfolio/);
 env.STUDIO_RUNTIME_CONFIG_JSON=JSON.stringify({artistPortfolio:true,artistConversations:true});
 const config=lib.studioRuntimeConfiguration(env,'https://www.tidesofknowing.com');assert.equal(config.artistConversations,true);
 const locals=context(null);locals.supabase.auth={getUser:async()=>({data:{user:{id:owner}},error:null})};let connections=0;
 const factory=()=>{connections++;return {connect:async()=>{},end:async()=>{},query:async sql=>({rows:sql.includes('current_setting')?[{actor:owner}]:sql.includes('artist_conversation_dispatch')?[{value:true}]:[]})}};
 const providers=await lib.composeDcsRuntime(locals,config,factory);assert.equal(providers.studioArtistConversationsEnabled,true);assert.equal(connections,0);
 assert.equal(await providers.studioArtistConversationProvider.canCreator(owner),true);assert.equal(connections,1);
 const disabled=await lib.composeDcsRuntime(locals,{...config,artistConversations:false},factory);assert.equal(disabled.studioArtistConversationsEnabled,false);
 locals.profile.id='foreign';assert.equal((await lib.composeDcsRuntime(locals,config,factory)).studioArtistConversationsEnabled,false);
});
test('artist registration read failures retain an explicit unavailable state and no fabricated role',async()=>{
 const locals=context(null);Object.assign(locals,{studioArtistLocal:false,studioArtistRegistrationEnabled:true,studioArtistRegistrationProvider:{registration:async()=>{throw Error('Synthetic failure')}}});
 const result=await frontmatter('src/pages/artists/collaborate/index.astro',locals,'({registrationUnavailable,registration})');assert.equal(result.registrationUnavailable,true);assert.equal(result.registration.role,'');
});
test('real Exchange writer rechecks saved source, chosen excerpt and owner in its transaction',async()=>{
 const projectRow={id:project,owner_id:owner,name:'Synthetic deck',settings:{visual_direction_v1:{version:1,revision:2,fields:{vision:'Synthetic saved vision.'},sources:[],links:[]}}};
 const from={select(){return this},eq(){return this},maybeSingle:async()=>({data:projectRow,error:null})};
 const source=await lib.exchangeSource({from:()=>from},owner,project);let dispatched=0;
 const writer=lib.prepareExchangeWriter({auth:{getUser:async()=>({data:{user:{id:owner}},error:null})}},{transaction:async work=>work(async(sql,values)=>{
  if(sql.includes('current_setting'))return {rows:[{actor:owner}]};
  if(sql.includes('FROM public.studio_projects')){assert.equal(values[1],owner);return {rows:[projectRow]};}
  if(sql.includes('exchange_dispatch')){dispatched++;assert.equal(JSON.parse(values[1]).selected_text,'Synthetic saved vision.');return {rows:[{value:{id:requestId}}]};}
  throw Error('Unexpected synthetic SQL');
 })},owner);
 const input={project_id:project,key:requestId,title:'Synthetic brief',selected_text:'Synthetic saved vision.',images:[],source_version:2,source_fingerprint:source.fingerprint};
 await writer.exchangeDraft(owner,input);assert.equal(dispatched,1);
 await assert.rejects(writer.exchangeDraft(owner,{...input,source_fingerprint:'changed'}));
 await assert.rejects(writer.exchangeDraft(owner,{...input,selected_text:'Unselected private material'}));
 await assert.rejects(writer.exchangeDraft(owner,{...input,images:[{id:'foreign-image'}]}));
 await assert.rejects(writer.exchangeDraft('foreign',input));assert.equal(dispatched,1);
});
test('all changed real Astro components compile and keep their real navigation/contracts',async()=>{
 for(const file of ['src/pages/studio/artists/index.astro','src/pages/artists/collaborate/index.astro','src/pages/artists/visual-design-exchange/index.astro','src/pages/studio/projects/[id]/visual-exchange/index.astro','src/components/studio/SymbolVisualDesk.astro','src/components/studio/ArtistConversations.astro','src/components/studio/VisualExchangeWorkspace.astro']){
  const result=await transform(fs.readFileSync(file,'utf8'),{filename:file});assert.equal(result.diagnostics.filter(d=>d.severity===1).length,0,file);
 }
 const directory=fs.readFileSync('src/pages/studio/artists/index.astro','utf8');assert.match(directory,/ArtistConversations artist=\{selected\}/);assert.match(directory,/directoryHref/);
});
test('actual Exchange browser form rotates successful keys, retains failed drafts and preserves disabled controls',{timeout:40000},async()=>{
 const script=await build({entryPoints:['src/scripts/visualExchange.ts'],bundle:true,platform:'browser',format:'iife',write:false});
 const executablePath=process.env.PUPPETEER_EXECUTABLE_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>fs.existsSync(p));
 const browser=await puppeteer.launch({headless:true,...(executablePath?{executablePath}:{})});
 try{for(const failFirst of [false,true]){
  const page=await browser.newPage();
  const source={bookText:'Synthetic saved visual passage.',fingerprint:'a'.repeat(64)};
  await page.setContent(`<section data-visual-exchange data-board="false" data-owner="${owner}" data-project="${project}"><div data-book-reading></div><form data-exchange-draft><input name="title" required minlength="3"><textarea name="selected_text" required></textarea><input name="locked" disabled><button>Save private draft</button></form><p data-exchange-status></p><div data-exchange-records></div><script type="application/json" data-exchange-source>${JSON.stringify(source)}</script></section>`);
  await page.evaluate(fail=>{if(!crypto.randomUUID)crypto.randomUUID=()=>[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join('');window.posts=[];window.fail=fail;window.fetch=async(_url,options)=>{if(options?.method==='POST'){const data=Object.fromEntries(options.body);window.posts.push(data);if(window.fail){window.fail=false;return new Response(JSON.stringify({error:'Synthetic interruption'}),{status:503})}return new Response(JSON.stringify({saved:true}))}return new Response(JSON.stringify({snapshots:[]}))};},failFirst);
  await page.addScriptTag({content:script.outputFiles[0].text});
  const submit=()=>page.evaluate(()=>{const f=document.querySelector('form');f.elements.title.value='Synthetic brief';f.elements.selected_text.value='Synthetic saved visual passage.';f.requestSubmit()});
  await submit();await page.waitForFunction(()=>window.posts.length===1&&!document.querySelector('button').disabled);
  if(failFirst){assert.equal(await page.$eval('textarea',e=>e.value),'Synthetic saved visual passage.');await submit();await page.waitForFunction(()=>window.posts.length===2&&!document.querySelector('button').disabled);const keys=await page.evaluate(()=>window.posts.map(p=>p.key));assert.equal(keys[0],keys[1]);}
  await submit();await page.waitForFunction(count=>window.posts.length===count&&!document.querySelector('button').disabled,{},failFirst?3:2);
  const keys=await page.evaluate(()=>window.posts.map(p=>p.key));assert.notEqual(keys.at(-1),keys.at(-2));assert.equal(await page.$eval('[name=locked]',e=>e.disabled),true);
  await page.close();
 }}finally{await browser.close();}
});
