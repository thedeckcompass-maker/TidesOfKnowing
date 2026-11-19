import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {parse,transform} from '@astrojs/compiler-rs';
import {experimental_AstroContainer as Container} from 'astro/container';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const source=`export * from './src/lib/studio/projectFolder.ts';export * from './src/lib/studio/projectRestore.ts';export * from './src/lib/studio/saveState.ts';export * from './src/lib/studio/visualDesign.ts';export * from './src/lib/studio/deckDesign.ts';export * from './src/lib/studio/productionSpecification.ts';export * from './src/lib/studio/visualExport.ts';export * from './src/lib/studio/projectBookView.ts';export * from './src/lib/studio/projectBookDocuments.ts';export * from './src/lib/studio/navigation.ts';export * from './src/lib/studio/access.ts';`;
const compiled=await build({stdin:{contents:source,resolveDir:process.cwd()},bundle:true,write:false,format:'cjs',platform:'node',define:{'import.meta.env':'{}'}});
const module={exports:{}};new Function('module','exports','require',compiled.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));const lib=module.exports;
const owner='11111111-1111-4111-8111-111111111111',projectId='22222222-2222-4222-8222-222222222222',cardId='33333333-3333-4333-8333-333333333333';
const imageBytes=await sharp({create:{width:150,height:250,channels:3,background:'#143e5f'}}).jpeg().toBuffer(),image='data:image/jpeg;base64,'+imageBytes.toString('base64');
const board=()=>({defaults:{...lib.visualDefaults,elements:'artwork'},cards:{[cardId]:{...lib.blankVisualCard(),front:image,url:'https://example.invalid/creative-work',mediaLabel:'Synthetic linked work',qrPlacement:'both'}},references:[],commonBack:'',notes:'',deckConfigured:true,locked:[]});
const card={id:cardId,project_id:projectId,title:'Synthetic card',card_number:'1',sort_order:1,status:'draft',content:{meaning:'A synthetic meaning.'}};
const project=b=>({id:projectId,owner_id:owner,name:'Synthetic deck',updated_at:'2026-11-17T00:00:00Z',settings:{visual_design_v1:b}});
let browser;
async function browserInstance(){return browser??=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe'});}
after(async()=>{if(browser)await browser.close()});
async function pageWith(html,suffix='cards/'+cardId+'/'){
 const p=await (await browserInstance()).newPage();await p.setRequestInterception(true);
 p.on('request',r=>r.respond({status:200,contentType:r.resourceType()==='document'?'text/html':'text/plain',body:r.resourceType()==='document'?html:''}));
 await p.goto(`https://studio.synthetic.invalid/studio/projects/${projectId}/${suffix}`);return p;
}
async function client(entry,plugins=[]){return (await build({entryPoints:[entry],bundle:true,write:false,format:'iife',platform:'browser',loader:{'.css':'empty'},plugins})).outputFiles[0].text;}
fs.mkdirSync(path.resolve('.build-temp'),{recursive:true});
const fixtureOutput=fs.mkdtempSync(path.resolve('.build-temp/creator-workflow-')),components=new Map();
async function componentHtml(file,props,locals={}){
 let compiled=components.get(file);
 if(!compiled){
  // Match Astro's installed compile options, including its resolvePath metadata contract.
  const result=transform(fs.readFileSync(file,'utf8'),{filename:path.resolve(file).replaceAll('\\','/'),internalURL:'astro/compiler-runtime',resultScopedSlot:true,resolvePath:s=>s});
  assert.equal(result.diagnostics.filter(d=>d.severity==='error'||d.severity===1).length,0);
  const output=path.join(fixtureOutput,path.basename(file)+'.mjs');
  await build({stdin:{contents:result.code,resolveDir:path.dirname(path.resolve(file))},bundle:true,format:'esm',platform:'node',packages:'external',outfile:output,plugins:[{name:'component-css',setup(b){b.onResolve({filter:/\?astro&type=style/},a=>({path:a.path,namespace:'style'}));b.onLoad({filter:/.*/,namespace:'style'},()=>({contents:'',loader:'js'}));}}]});
  compiled={module:(await import(pathToFileURL(output))).default,css:result.css.join('\n')};components.set(file,compiled);
 }
 const container=await Container.create(),html=await container.renderToString(compiled.module,{props,locals,request:new Request('https://studio.synthetic.invalid/')});
 return '<style>'+compiled.css+'</style>'+html.replace(/<script\b(?![^>]*type="(?:application\/json|text\/plain)")[^>]*>[\s\S]*?<\/script>/g,'');
}

test('all nine supported templates have source-specific physical geometry; two retain boundary discrepancies',()=>{
 for(const preset of lib.cardSizePresets){const spec=lib.productionSpecification({...lib.visualDefaults,width:preset.width,height:preset.height});assert.ok(spec);assert.equal(spec.trim.width,preset.width);assert.equal(spec.trim.height,preset.height);assert.ok(spec.width>spec.trim.width&&spec.safe.width<spec.trim.width);assert.match(spec.sha256,/^[a-f0-9]{64}$/);assert.equal(spec.dpi,300);}
 const tarot=lib.productionSpecification(lib.visualDefaults);assert.deepEqual([tarot.width,tarot.height,tarot.safe.width,tarot.safe.height],[2.99,4.99,2.51,4.51]);
 const poker=lib.productionSpecification({...lib.visualDefaults,width:2.48,height:3.46});assert.equal(poker.safe.width,2.28);assert.equal(poker.safe.height,3.27);
 assert.equal(lib.cardSizePresets.filter(p=>lib.productionSpecification({...lib.visualDefaults,width:p.width,height:p.height}).issue).length,2);
 assert.equal(lib.productionSpecification({...lib.visualDefaults,width:17,height:21}),null);
});
test('reconciled printer sources distinguish confirmed raster canvas from unresolved physical boundaries',()=>{
 const cases=[['jumbo',1122,1572,1050,1500,975,1425],['square-2-5',822,822,750,750,690,690],['square-2-75',897,897,825,825,753,753]];
 for(const [id,w,h,tw,th,sw,sh] of cases){
  const preset=lib.cardSizePresets.find(p=>p.id===id),style={...lib.visualDefaults,width:preset.width,height:preset.height},s=lib.productionSpecification(style);
  assert.deepEqual(s.pixels,{width:w,height:h});assert.deepEqual(s.rasterSource.pixels,[w,h]);assert.equal(s.rasterSource.dpi,300);
  assert.deepEqual(s.calculatedPixels,{trim:{width:tw,height:th},safe:{width:sw,height:sh}});
  assert.equal(s.trim.x,.12);assert.equal(s.trim.y,.12);assert.match(s.rasterSource.sha256,/^[a-f0-9]{64}$/);assert.match(s.vectorSource.sha256,/^[a-f0-9]{64}$/);
  assert.ok(s.rasterSource.url.startsWith('https://www.makeplayingcards.com/dl/templates/playingcard/'));
  const instructions=lib.artworkInstructions(style);assert.match(instructions,/Printer PSD document confirms/);assert.match(instructions,/not verified print-ready/);
  if(id==='jumbo'){assert.equal(s.issue,null);assert.doesNotMatch(instructions,/Production hold/);}else{assert.match(instructions,/Production hold/);assert.match(instructions,/Existing.*working guides are retained/);}
  const b=board();b.defaults=style;const files=lib.visualFiles(project(b),[card]),spec=JSON.parse(new TextDecoder().decode(files.find(f=>f.path==='visual-design/production-specification.json').bytes));
  assert.deepEqual(spec,s);assert.match(lib.workingCardSvg(b,card),new RegExp(`width="${s.width}in" height="${s.height}in"`));
 }
});
test('downloaded official PSD headers independently confirm the three pinned raster sources',t=>{
 const r=JSON.parse(fs.readFileSync('src/data/studio/mpc-template-specifications.json','utf8'));
 const sources=['jumbo','square-2-5','square-2-75'].map(id=>r.templates[id].rasterSource);
 if(sources.some(s=>!fs.existsSync('.build-temp/publishing-templates/'+s.file))){t.skip('Public source downloads are local verification evidence, not required repository fixtures.');return;}
 for(const s of sources){const bytes=fs.readFileSync('.build-temp/publishing-templates/'+s.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),s.sha256);assert.equal(bytes.toString('ascii',0,4),'8BPS');assert.equal(bytes.readUInt16BE(4),1);assert.deepEqual([bytes.readUInt32BE(18),bytes.readUInt32BE(14)],s.pixels);
  let p=26;p+=4+bytes.readUInt32BE(p);const end=p+4+bytes.readUInt32BE(p);p+=4;let dpi=null;
  while(p<end){const id=bytes.readUInt16BE(p+4);p+=6;const n=bytes[p];p+=1+n+(1+n)%2;const length=bytes.readUInt32BE(p);p+=4;if(id===1005)dpi=[bytes.readUInt32BE(p)/65536,bytes.readUInt32BE(p+8)/65536];p+=length+length%2;}
  assert.deepEqual(dpi,[300,300]);
 }
});
test('project walkthrough renders real contextual tools behind existing ownership and editing checks',async()=>{
 const html=await componentHtml('src/components/studio/ProjectWalkthrough.astro',{project:project(board())});
 const hrefs=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));
 for(const task of ['direction','cards','visual','outline','workbook','journal','production','exports'])assert.ok(hrefs.includes(lib.projectDestination(task,projectId)),task);
 assert.ok(hrefs.every(h=>h==='/studio/creators-desk/'||h.startsWith(`/studio/projects/${projectId}/`)));assert.doesNotMatch(html,/fixture|Lexicon|completed consultation/);
 assert.equal(lib.projectDestination('walkthrough',projectId),`/studio/projects/${projectId}/?view=walkthrough`);
 assert.ok(lib.studioMenu(projectId).flatMap(g=>g.items).some(i=>i.href===lib.projectDestination('walkthrough',projectId)));
 const source=fs.readFileSync('src/pages/studio/projects/[id]/index.astro','utf8');assert.equal(parse(source).diagnostics.length,0);
 assert.ok(source.indexOf('workspace.project.owner_id !== Astro.locals.user?.id')<source.indexOf('<ProjectWalkthrough'));
 assert.ok(source.indexOf('if(await studioProjectWriteAccessResponse')<source.indexOf('<ProjectWalkthrough'));
 assert.match(source,/return Astro.redirect\('\/studio\/projects\/'\+project.id\+'\/project-book\/',303\)/);
 const shell=fs.readFileSync('src/components/studio/StudioShell.astro','utf8');assert.equal(parse(shell).diagnostics.length,0);assert.match(shell,/get\('view'\)==='walkthrough'\?'walkthrough'/);
 await client('src/lib/studio/deckWorkspaceClient.ts');
});
test('QR placement including quiet zone stays inside each verified safe area at every extreme',()=>{
 for(const preset of lib.cardSizePresets)for(const x of [0,50,100])for(const y of [0,50,100])for(const size of [1,22,100]){
  const s={...lib.visualDefaults,width:preset.width,height:preset.height,qrX:x,qrY:y,qrSize:size},p=lib.productionSpecification(s),q=lib.qrBounds(s);
  assert.ok(q.x+p.trim.x>=p.safe.x-.00001);assert.ok(q.y+p.trim.y>=p.safe.y-.00001);assert.ok(q.x+p.trim.x+q.size<=p.safe.x+p.safe.width+.00001);assert.ok(q.y+p.trim.y+q.size<=p.safe.y+p.safe.height+.00001);
 }
});
test('complete images suppress generated elements without rewriting original bytes; legacy styling survives',()=>{
 const b=board();let svg=lib.workingCardSvg(b,card);assert.doesNotMatch(svg,/<text\b/);assert.match(svg,/foreignObject/);assert.match(svg,/not print-ready/);
 b.defaults.elements='studio';svg=lib.workingCardSvg(b,card);assert.match(svg,/<text\b/);
 const legacy=board();delete legacy.defaults.elements;assert.equal(lib.parseVisualBoard(legacy,new Set([cardId]),legacy).defaults.elements,'studio');
 const files=lib.visualFiles(project(b),[card]);assert.deepEqual(Buffer.from(files.find(f=>f.path.endsWith('/front.jpg')).bytes),imageBytes);assert.ok(files.some(f=>f.path.endsWith('artwork-instructions.md')));assert.ok(files.some(f=>f.path.endsWith('production-specification.json')));
 const before=JSON.stringify(b);assert.throws(()=>lib.parseVisualBoard({...b,cards:{[cardId]:{...b.cards[cardId],qrPlacement:'unknown'}}},new Set([cardId]),b));assert.equal(JSON.stringify(b),before);
});
test('validated QR generation and all four placements are honoured by working card and Guidebook outputs',()=>{
 for(const placement of ['card','guidebook','both','neither']){
  const b=board();b.cards[cardId].qrPlacement=placement;
  const svg=lib.visualQrSvg(b.cards[cardId]);assert.equal(!!svg,placement!=='neither');if(svg)assert.match(svg,/<svg[\s\S]*viewBox=/);
  const document=lib.projectBookDocuments(lib.projectBookView(project(b),[card],[]));
  const block=document.manuscript[0].blocks.find(x=>x.cardId===cardId);assert.equal(!!block.qrSvg,['guidebook','both'].includes(placement));
  const preview=lib.workingCardSvg(b,card);assert.equal((preview.match(/<svg\b/g)??[]).length,1+Number(['card','both'].includes(placement)));
  assert.equal(lib.visualFiles(project(b),[card]).some(f=>f.path.endsWith('/qr.svg')),placement!=='neither');
 }
 assert.throws(()=>lib.visualQrSvg({url:'javascript:alert(1)'}));assert.throws(()=>lib.visualQrSvg({url:'https://user:password@example.invalid/'}));
});
test('contextual Workbook URL uses the actual stable manuscript card anchor',()=>{
 const url=new URL(lib.workbookCardDestination(projectId,cardId),'https://example.invalid');assert.equal(url.searchParams.get('card'),cardId);assert.equal(url.searchParams.get('book'),'manuscript');assert.equal(url.hash.slice(1),lib.workbookCardAnchor(cardId));assert.throws(()=>lib.workbookCardDestination('foreign',cardId));
});
test('actual project ZIP includes the new working outputs and remains inspectable with unchanged source records',async()=>{
 const b=board(),p={...project(b),deck_type:'oracle',pathway:'personal',status:'writing',description:'',purpose:'',intended_reader:'',promise:'',deck_size:null,next_action:'',current_risk:''};
 const c={...card,family_id:null,version_number:1,deleted_at:null};const records={card_versions:[{id:'44444444-4444-4444-8444-444444444444',project_id:projectId,card_id:cardId,version_number:1,snapshot:{content:c.content}}],guidebook_versions:[],production_plan_versions:[],import_records:[],photos:[],excerpts:[]};
 const bytes=lib.buildStudioProjectFolder({exported_at:'2026-11-17T00:00:00Z',project:p,cards:[c],families:[],guidebook:[],journal:[],production_plan:null},records,[]);const archive=await lib.inspectProjectArchive(bytes);
 assert.equal(archive.data.cards[0].content.meaning,card.content.meaning);assert.equal(archive.counts.card_versions,1);assert.ok(archive.files.has('visual-design/production-specification.json'));assert.ok(archive.files.has(`visual-design/cards/${cardId}/card-preview.svg`));assert.deepEqual(Buffer.from(archive.files.get(`visual-design/cards/${cardId}/front.jpg`)),imageBytes);assert.equal(archive.project.settings.visual_design_v1.cards[cardId].qrPlacement,'both');
});
test('guidance distinguishes verified global/project rights and unavailable reads without inferring Explore',async()=>{
 const profile={id:owner,status:'active',role:'member'};let global=true,scoped=false,failed=false;
 const db={rpc:async name=>({data:name==='studio_has_write_access'?global:scoped,error:failed?{code:'SYNTHETIC'}:null})};
 assert.equal(await lib.loadStudioGuidance(db,owner,profile,[projectId]),'studio');global=false;scoped=true;assert.equal(await lib.loadStudioGuidance(db,owner,profile,[projectId]),'project');scoped=false;assert.equal(await lib.loadStudioGuidance(db,owner,profile,[]),'registered');failed=true;assert.equal(await lib.loadStudioGuidance(db,owner,profile,[projectId]),'unavailable');
 for(const file of ['src/pages/studio/creators-desk.astro','src/pages/studio/index.astro'])assert.doesNotMatch(fs.readFileSync(file,'utf8'),/Explore is permanently free|Explore is free: keep/);
});
test('changed templates parse and actual client/API modules bundle without new dependencies',async()=>{
 for(const file of ['src/components/studio/DeckVisualWorkspace.astro','src/components/studio/SymbolVisualDesk.astro','src/pages/studio/index.astro','src/pages/studio/creators-desk.astro','src/pages/studio/projects/[id]/cards/[cardId].astro','src/pages/studio/projects/[id]/project-book/index.astro'])assert.equal(parse(fs.readFileSync(file,'utf8')).diagnostics.filter(d=>d.severity==='error'||d.severity===1).length,0,file);
 for(const file of ['src/lib/studio/deckWorkspaceClient.ts','src/scripts/creatorJourney.ts','src/scripts/symbolVisualDesk.ts','src/scripts/projectBookOverview.ts','src/pages/api/studio/projects/[id]/visual-design.ts'])await build({entryPoints:[file],bundle:true,write:false,format:'esm',platform:'node',loader:{'.css':'empty'},define:{'import.meta.env':'{}'},logLevel:'silent'});
});

async function deckHtml(b){return '<style>body{margin:8px}.deck-visual{max-width:700px}</style><div data-studio-owner="'+owner+'">'+await componentHtml('src/components/studio/DeckVisualWorkspace.astro',{project:project(b),cards:[card],card,mode:'card'},{} )+'</div>';}
test('actual artwork editor fits full cards on desktop/mobile and expands without cropping; QR and element choices render',{timeout:30000},async()=>{
 const code=await build({stdin:{contents:"import {initDeckWorkspace} from './src/lib/studio/deckWorkspaceClient';initDeckWorkspace(document.querySelector('[data-deck-visual]'));",resolveDir:process.cwd()},bundle:true,write:false,format:'iife',platform:'browser',loader:{'.css':'empty'}});
 const p=await pageWith(await deckHtml(board()));try{
  await p.addScriptTag({content:code.outputFiles[0].text});
  for(const width of [1200,390]){await p.setViewport({width,height:850});await p.waitForFunction(()=>document.querySelector('[data-sheet=front]').offsetHeight>0);await new Promise(r=>setTimeout(r,80));const box=await p.evaluate(()=>({card:document.querySelector('[data-sheet=front]').getBoundingClientRect().height,view:document.querySelector('.deck-preview-scroll').clientHeight,title:getComputedStyle(document.querySelector('[data-title]')).display}));assert.ok(box.card<=box.view,JSON.stringify(box));assert.equal(box.title,'none');}
  await p.click('[data-expand-preview]');assert.equal(await p.$eval('dialog',e=>e.open),true);await p.click('[data-close-preview]');await p.waitForFunction(()=>!document.querySelector('dialog').open);
  await p.select('[data-media=qrPlacement]','guidebook');assert.equal(await p.$eval('[data-qr]',e=>getComputedStyle(e).display),'none');assert.ok(await p.$('[data-qr-preview] svg'));
  await p.select('[data-media=qrPlacement]','both');const contained=await p.evaluate(()=>{const q=document.querySelector('[data-qr]').getBoundingClientRect(),s=document.querySelector('[data-safe-guide]').getBoundingClientRect();return q.left>=s.left-.5&&q.right<=s.right+.5&&q.top>=s.top-.5&&q.bottom<=s.bottom+.5});assert.equal(contained,true);
  await p.select('[data-style=elements]','studio');assert.notEqual(await p.$eval('[data-title]',e=>getComputedStyle(e).display),'none');
 }finally{await p.close();}
 const legacy=board();delete legacy.cards[cardId].qrPlacement;const legacyPage=await pageWith(await deckHtml(legacy));try{await legacyPage.addScriptTag({content:code.outputFiles[0].text});assert.equal(await legacyPage.$eval('[data-media=qrPlacement]',e=>e.value),'card');}finally{await legacyPage.close();}
});

const journeyHelper={name:'isolated-chapter-presentation',setup(b){b.onResolve({filter:/^\.\/chapterDocuments$/},()=>({path:'chapter-layout',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:"export const setupChapterDocuments=()=>({read:()=>({foundation:{responses:{},output:{}},architecture:{responses:{},output:{},connections:[]}}),render(){},fill(){},pendingConnection:()=>false,stageConnection:()=>true,connectionDraft:()=>null,restoreConnectionDraft(){}})",loader:'js'}));}};
function journeyHtml(){const initial={journey:{chapter:'spark',moment:0,guidance:'gentle'},document:{responses:{topic:'Saved idea'},northStar:{},history:[]}};return `<div data-studio-owner="${owner}"><section class="creative-journey" data-project="${projectId}" data-owner="${owner}" data-updated="2026-11-17T00:00:00Z"><script id="journey-initial" type="application/json">${JSON.stringify(initial)}</script>${['journey-title','journey-lede','output-name','context-title','context-note'].map(x=>`<p data-${x}></p>`).join('')}<p id="journey-status"></p><p id="current-location"></p><div id="original-reflections"></div><div id="north-star-history"></div><p id="copy-notice"></p><select id="guidance"><option>gentle</option></select><select data-response="startingPlace"><option value="idea">Idea</option></select><textarea data-response="topic"></textarea><button id="save-journey">Save</button><button id="use-originals">Copy</button><button id="next-moment">Next</button><button data-chapter="foundation">Foundation</button></section></div>`;}
test('actual Journey save and draft manager await in-flight persistence, dismiss the modal and run the original navigation',{timeout:30000},async()=>{
 const code=await client('src/scripts/creatorJourney.ts',[journeyHelper]);
 for(const success of [true,false]){const p=await pageWith(journeyHtml(),'journey/');try{
  await p.evaluate(ok=>{window.sent=[];window.fetch=async(_u,o)=>{window.sent.push(JSON.parse(o.body));return new Promise(resolve=>{window.finish=()=>resolve(new Response(JSON.stringify(ok?{message:'Saved.',updatedAt:'2026-11-17T00:01:00Z'}:{error:'Saved version changed. Reload before retrying.'}),{status:ok?200:409,headers:{'Content-Type':'application/json'}}))})};},success);
  await p.addScriptTag({content:code});await p.$eval('[data-response=topic]',e=>{e.value='Current unsaved idea';e.dispatchEvent(new Event('input',{bubbles:true}))});await p.click('#save-journey');await p.waitForFunction(()=>window.sent.length===1);await p.click('[data-chapter=foundation]');await p.waitForFunction(()=>document.querySelector('dialog').open);
  await p.evaluate(()=>[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Save changes and continue').click());assert.equal(await p.$eval('dialog',e=>e.open),true);await p.evaluate(()=>window.finish());
  if(success){await p.waitForFunction(()=>!document.querySelector('dialog').open);assert.equal(await p.$eval('.creative-journey',e=>e.dataset.currentChapter),'foundation');}
  else{await p.waitForFunction(()=>document.querySelector('dialog [role=status]').textContent.includes('Saved version changed'));assert.equal(await p.$eval('dialog',e=>e.open),true);assert.equal(await p.$eval('[data-response=topic]',e=>e.value),'Current unsaved idea');}
  assert.equal(await p.evaluate(()=>window.sent.length),1);assert.equal(await p.evaluate(()=>window.sent[0].expectedUpdatedAt),'2026-11-17T00:00:00Z');
 }finally{await p.close();}}
});
test('Symbol Journal is card-scoped by default and retains optional cross-card associations',()=>{
 const markup=fs.readFileSync('src/components/studio/SymbolVisualDesk.astro','utf8'),code=fs.readFileSync('src/scripts/symbolVisualDesk.ts','utf8');assert.match(markup,/data-symbol-card=\{cardId\} checked hidden/);assert.match(markup,/Also connect other cards \(optional\)/);assert.match(code,/cardIds:selectedCards\(\)/);assert.match(code,/linked_card_id===card/);
});

test('actual card version controller joins Save and continue and refuses stale acknowledgements',{timeout:30000},async()=>{
 const compiled=await build({stdin:{contents:"import {initStudioEditorialController} from './src/scripts/studioEditorialController';initStudioEditorialController();initStudioEditorialController();",resolveDir:process.cwd()},bundle:true,write:false,format:'iife',platform:'browser',loader:{'.css':'empty'}});
 for(const success of [true,false]){const p=await pageWith(`<main data-studio-owner="${owner}"><form id="studio-card-editor" data-studio-versioned-save data-creator-id="${owner}" action="https://studio.synthetic.invalid/api/studio/cards/${cardId}" method="post"><input name="project_id" type="hidden" value="${projectId}"><input name="expected_current_version" type="hidden" value="1"><label>Card title<input name="title" value="Saved title"></label><textarea name="meaning">Saved meaning</textarea><p data-studio-save-feedback></p><button type="submit">Save writing</button></form><button data-studio-navigate onclick="window.continued=(window.continued||0)+1">Continue</button></main>`);try{
  await p.evaluate(ok=>{window.sent=0;window.fetch=async(_u,o)=>{window.sent++;window.submittedVersion=o.body.get('expected_current_version');return new Response(JSON.stringify(ok?{outcome:'saved',id:location.pathname.split('/').filter(Boolean).at(-1),version_number:2}:{message:'A newer saved version exists.'}),{status:ok?200:409,headers:{'Content-Type':'application/json'}})};},success);
  await p.addScriptTag({content:compiled.outputFiles[0].text});await p.$eval('[name=title]',e=>{e.value='Current writing';e.dispatchEvent(new Event('input',{bubbles:true}))});await p.click('[data-studio-navigate]');await p.waitForFunction(()=>document.querySelector('dialog').open);await p.evaluate(()=>[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Save changes and continue').click());
  if(success){await p.waitForFunction(()=>window.continued===1);assert.equal(await p.$eval('dialog',e=>e.open),false);assert.equal(await p.$eval('[name=expected_current_version]',e=>e.value),'2');}
  else{await p.waitForFunction(()=>document.querySelector('dialog [role=status]').textContent.includes('newer saved version'));assert.equal(await p.$eval('dialog',e=>e.open),true);assert.equal(await p.$eval('[name=expected_current_version]',e=>e.value),'1');assert.equal(await p.$eval('[name=title]',e=>e.value),'Current writing');}
  assert.equal(await p.evaluate(()=>window.sent),1);assert.equal(await p.evaluate(()=>window.submittedVersion),'1');
 }finally{await p.close();}}
});
test('actual Workbook reader opens the requested card layout, contains Guidebook QR and explains missing cards',{timeout:30000},async()=>{
 const b=board(),html=await componentHtml('src/components/studio/ProjectBookOverview.astro',{project:project(b),cards:[card],sections:[]});
 const code=await client('src/scripts/projectBookOverview.ts');
 for(const selected of [cardId,'99999999-9999-4999-8999-999999999999']){const p=await pageWith(html,'project-book/?book=manuscript&card='+selected+'#'+lib.workbookCardAnchor(selected));const errors=[];p.on('pageerror',e=>errors.push(e.message));try{
  const data=lib.projectBookView(project(b),[card],[]);await p.evaluate(saved=>{window.fetch=async()=>new Response(JSON.stringify(saved),{headers:{'Content-Type':'application/json'}})},data);await p.addScriptTag({content:code});
  await new Promise(r=>setTimeout(r,100));assert.deepEqual(errors,[],'Workbook client runtime');await p.waitForSelector('[data-book-card]',{timeout:4000});assert.equal(await p.$eval('[data-book-panel=manuscript]',e=>e.hidden),false);
  assert.ok(await p.$('[data-book-card] .book-qr svg'));assert.match(await p.$eval('[data-book-card] img',e=>e.getAttribute('src')),/^data:image\/svg\+xml/);
  assert.match(await p.$eval('[data-book-print-style]',e=>e.textContent),/\.book-qr\{width:8rem/);
  if(selected!==cardId)await p.waitForFunction(()=>document.querySelector('[data-project-book-status]').textContent.includes('not available'));
  else{await p.waitForFunction(()=>document.querySelector('[data-book-panel=manuscript] .book-reader-viewport')?.clientWidth>0,{timeout:4000});await new Promise(r=>setTimeout(r,100));const visible=await p.evaluate(()=>{const entry=document.querySelector('[data-book-card] h2').getBoundingClientRect(),viewport=document.querySelector('[data-book-panel=manuscript] .book-reader-viewport').getBoundingClientRect();return entry.right>viewport.left&&entry.left<viewport.right});assert.equal(visible,true);}
 }finally{await p.close();}}
});
test('actual Symbol Journal editor auto-selects this card and preserves existing cross-card links on save',{timeout:30000},async()=>{
 const journalId='44444444-4444-4444-8444-444444444444',otherId='55555555-5555-4555-8555-555555555555',stamp='2026-11-17T00:00:00Z';
 const journal={id:journalId,project_id:projectId,title:'Synthetic observation',body_markdown:'Private synthetic observation.',linked_card_id:cardId,tags:['research'],entry_kind:'reflection',created_at:stamp,updated_at:stamp};
 const book={version:1,revision:1,fields:{},links:[{journalId,cardIds:[cardId,otherId],motifs:'A motif',why:'A connection'}],sources:[],history:[]};
 const db={from:table=>({select(){return this},eq:async()=>({data:table==='studio_journal_entries'?[journal]:[],error:null})})};
 const model=project(board());model.settings.visual_direction_v1=book;const html=await componentHtml('src/components/studio/SymbolVisualDesk.astro',{project:model,cards:[card,{...card,id:otherId,title:'Other card'}],cardId,mode:'symbols'},{supabase:db});
 const p=await pageWith(html);try{await p.evaluate(saved=>{window.fetch=async(_u,o)=>{window.symbolPayload=JSON.parse(o.body);return new Response(JSON.stringify({book:{...saved,links:window.symbolPayload.links,fields:window.symbolPayload.fields,revision:2},updatedAt:'2026-11-17T00:01:00Z',message:'Saved'}))}},book);await p.addScriptTag({content:await build({stdin:{contents:"import {initSymbolVisualDesk} from './src/scripts/symbolVisualDesk';initSymbolVisualDesk(document.querySelector('[data-symbol-desk]'));",resolveDir:process.cwd()},bundle:true,write:false,format:'iife',platform:'browser',loader:{'.css':'empty'}}).then(r=>r.outputFiles[0].text)});
  assert.equal(await p.$eval(`[data-symbol-card="${cardId}"]`,e=>e.checked&&e.hidden),true);assert.match(await p.$eval('[data-symbol-entry-list]',e=>e.textContent),/Synthetic observation/);await p.select('[data-symbol-entry]',journalId);await p.click('[data-save-symbols]');await p.waitForFunction(()=>window.symbolPayload);const ids=await p.evaluate(()=>window.symbolPayload.links[0].cardIds);assert.deepEqual([...ids].sort(),[cardId,otherId].sort());
 }finally{await p.close();}
});
test('field help and focus outlines stay with their own labels at desktop and mobile sizes',{timeout:30000},async()=>{
 const css=fs.readFileSync('src/styles/studio.css','utf8');const p=await pageWith(`<style>${css}</style><main class="studio-page"><form data-card-writing><label class="studio-field"><span>Card title</span><input name="title"></label><label class="studio-field"><span>Meaning</span><textarea name="meaning"></textarea></label></form></main>`);try{await p.addScriptTag({content:await client('src/scripts/studioFieldWisdom.ts')});await p.waitForSelector('.studio-field-wisdom summary');
  for(const width of [1200,390]){await p.setViewport({width,height:850});await p.focus('input');const geometry=await p.evaluate(()=>{const fields=[...document.querySelectorAll('input,textarea')];return fields.map(field=>{const wrap=field.closest('.studio-field-help-wrap'),heading=wrap.querySelector('.studio-help-label-text').getBoundingClientRect(),help=wrap.querySelector('summary').getBoundingClientRect(),box=field.getBoundingClientRect();return {gap:box.top-heading.bottom,iconBeforeField:help.bottom<=box.top,related:!!document.getElementById(field.getAttribute('aria-details'))}})});assert.ok(geometry.every(g=>g.gap>=5&&g.iconBeforeField&&g.related),JSON.stringify(geometry));}
  await p.$eval('input',e=>e.closest('label').hidden=true);assert.equal(await p.$eval('input',e=>getComputedStyle(e.closest('.studio-field-help-wrap')).display),'none');await p.$eval('input',e=>e.closest('label').hidden=false);assert.notEqual(await p.$eval('input',e=>getComputedStyle(e.closest('.studio-field-help-wrap')).display),'none');
 }finally{await p.close();}
});
test('project acknowledgements must be valid and cannot move a draft to an older database version',()=>{
 const previous='2026-11-17T00:00:00Z';assert.throws(()=>lib.acknowledgedProjectTimestamp({},previous));assert.throws(()=>lib.acknowledgedProjectTimestamp({message:'Saved',updatedAt:'bad'},previous));assert.throws(()=>lib.acknowledgedProjectTimestamp({message:'Saved',updatedAt:'2026-11-16T00:00:00Z'},previous));assert.equal(lib.acknowledgedProjectTimestamp({message:'No changes',updatedAt:previous},previous),previous);
});
test('actual artwork save rejects malformed acknowledgements and preserves choices entered during an in-flight save',{timeout:30000},async()=>{
 const code=await build({stdin:{contents:"import {initDeckWorkspace} from './src/lib/studio/deckWorkspaceClient';initDeckWorkspace(document.querySelector('[data-deck-visual]'));",resolveDir:process.cwd()},bundle:true,write:false,format:'iife',platform:'browser',loader:{'.css':'empty'}});
 for(const malformed of [false,true]){const p=await pageWith(await deckHtml(board()));try{
  await p.evaluate(({b,id,malformed})=>{window.fetch=async(_u,o)=>{const sent=JSON.parse(o.body);window.savedInput=sent;return new Promise(resolve=>{window.finish=()=>resolve(new Response(JSON.stringify(malformed?{}:{message:'Saved',updatedAt:'2026-11-17T00:01:00Z'}),{headers:{'Content-Type':'application/json'}}))})};}, {b:board(),id:cardId,malformed});
  await p.addScriptTag({content:code.outputFiles[0].text});await p.$eval('[data-media=mediaLabel]',e=>{e.value='Submitted label';e.dispatchEvent(new Event('input',{bubbles:true}))});await p.click('[data-save]');await p.waitForFunction(()=>window.savedInput);
  await p.$eval('[data-media=mediaLabel]',e=>{e.value='Newer unsaved label';e.dispatchEvent(new Event('input',{bubbles:true}))});await p.evaluate(()=>window.finish());
  await p.waitForFunction(bad=>document.querySelector('[data-status]').textContent.includes(bad?'could not be confirmed':'newer choices remain unsaved'),{},malformed);assert.equal(await p.$eval('[data-media=mediaLabel]',e=>e.value),'Newer unsaved label');assert.equal(await p.evaluate(()=>window.savedInput.card.mediaLabel),'Submitted label');
 }finally{await p.close();}}
});
